/**
 * The Examples section: a gallery of every `examples/<topic>/<name>.example.ts(x)`, and a page for each
 * that shows the picture its visual test draws, runs it live, and quotes what the guide that embeds it
 * says about it. There may be no examples yet: the gallery then says so, and no page is written.
 *
 * Nothing here is written by hand. An example's title is the `title` of its object, or the heading of
 * the guide section that first shows its code, or its name; its lead is the prose of that section
 * before its snippet, or when there is none the `description` of its object or the JSDoc above it; its
 * description is the start of that lead; its alt text that of its picture in the guide. Its pictures are those of
 * `examples/pictures.mts`.
 *
 * Each example's code is also a JSON file in `static/example-sources`, listed in its `index.json`, which
 * the API reference's cards read, and an editor would open by name.
 */
import path from 'node:path';

import type { Nodes, Root } from 'mdast';

import { blobUrl, editUrl } from '../../links/index.ts';
import type { ExampleFile } from '../../plugins/example/catalogue.mts';
import { exampleId, listExamples, PICTURES, THUMBNAILS, topicRank } from '../../plugins/example/catalogue.mts';
import { examplePrograms } from '../../plugins/example/source.mts';
import type { GalleryExample, GalleryTopic } from '../../src/components/Examples/types.ts';
import type { ExampleCatalogue, ExampleSourceFile } from '../../src/components/Live/catalogue.ts';
import { ROOT } from '../paths.mts';
import type { GeneratedFiles, Generator, Shared } from '../sync.mts';
import { GUIDES } from '../typedoc/guides.mts';
import { docFiles, MARKER } from '../typedoc/snippets.mts';
import { Example, ExampleHeader, Gallery, GuideSections } from './components.mts';
import { docNodes } from './content/mdx.mts';
import { pageOf } from './content/sidebar.mts';
import { examplePictures } from './examples/pictures.mts';
import type { Flow } from './markdown.mts';
import { categoryJson, heading, headingIds, paragraph, parsedDocs, plainText, writePage } from './markdown.mts';

const PAGES = 'content/examples';
const SOURCES = 'static/example-sources';

/** Where a guide shows an example's code */
interface Use {
  /** The guide, from the repo root */
  readonly doc: string;
  readonly heading: string;
  /** The heading's id on the site, as Docusaurus slugs it */
  readonly anchor: string;
  /** The prose that brings the snippet in; empty for all but an example's first use */
  readonly lead: readonly Nodes[];
  /** The snippet's place among the guide's blocks, which orders the examples of one guide */
  readonly position: number;
}

/** One example, with what the guides say about it */
interface Entry extends ExampleFile {
  readonly uses: Use[];
  /** The alt text of its picture in the guide */
  alt: string | null;
}

/** What a block of a guide is to an example: its heading, its snippet marker, its code or picture, or prose */
type Block =
  | { readonly kind: 'heading'; readonly text: string; readonly anchor: string }
  | { readonly kind: 'marker'; readonly file: string }
  | { readonly kind: 'code' }
  | { readonly kind: 'picture'; readonly id: string; readonly alt: string }
  | { readonly kind: 'prose'; readonly node: Nodes };

/**
 * A name as words, for a topic or an example with no title of its own: `loading-models` is "Loading
 * models", and `2d` is "2D"
 * @param name - The folder or file name
 */
export function humanize(name: string): string {
  const words = name
    .replace(/[-_]+/g, ' ')
    .replace(/\b(\d)d\b/g, '$1D')
    .trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A guide as blocks; comments other than snippet markers aren't there
 * @param doc - The guide, from the repo root
 * @param tree - Its tree
 */
function blocks(doc: string, tree: Root): Block[] {
  const ids = headingIds(tree.children);

  return tree.children.flatMap((node): Block[] => {
    if (node.type === 'heading' && node.depth >= 2 && node.depth <= 4) {
      return [{ kind: 'heading', text: plainText(node), anchor: ids.get(node)! }];
    }
    if (node.type === 'html') {
      const marker = MARKER.exec(node.value.trim());

      return marker ? [{ kind: 'marker', file: marker[1]! }] : [];
    }
    if (node.type === 'code') return [{ kind: 'code' }];

    const image = node.type === 'paragraph' && node.children.length === 1 ? node.children[0]! : null;
    const pictured =
      image?.type === 'image'
        ? /^tests\/snapshots\/docs\/([\w/-]+)\.webgl\.png$/.exec(path.posix.join(path.posix.dirname(doc), image.url))
        : null;

    if (image?.type === 'image' && pictured) return [{ kind: 'picture', id: pictured[1]!, alt: image.alt ?? '' }];

    return [{ kind: 'prose', node }];
  });
}

/**
 * The prose blocks that run from a block on, skipping tables, until any other kind of block
 * @param list - The blocks
 * @param from - The index of the first
 * @param step - 1 to read on, -1 to read back
 */
function proseRun(list: readonly Block[], from: number, step: 1 | -1): Nodes[] {
  const run: Nodes[] = [];

  for (let i = from; i >= 0 && i < list.length; i += step) {
    const block = list[i]!;

    if (block.kind !== 'prose') break;
    if (block.node.type !== 'table') run.push(block.node);
  }

  return step === 1 ? run : run.reverse();
}

/**
 * What a guide says to bring in a snippet: the prose just before it, or, when its section opens with
 * it, the prose after its code and picture
 * @param list - The guide's blocks
 * @param at - The index of the snippet's marker
 */
function leadOf(list: readonly Block[], at: number): Nodes[] {
  const before = proseRun(list, at - 1, -1);

  if (before.length) return before.slice(-2);

  let after = at + 1;

  while (list[after]?.kind === 'code' || list[after]?.kind === 'picture') after++;

  return proseRun(list, after, 1).slice(0, 2);
}

/**
 * Every example with its uses and alt text, from the README and the guides
 * @param shared - The values of the sync
 */
function readGuides(shared: Shared): Map<string, Entry> {
  const examples = new Map<string, Entry>(
    shared(listExamples).map((example) => [example.id, { ...example, uses: [], alt: null }]),
  );
  const doc = shared(parsedDocs);

  if (examples.size === 0) return examples;
  for (const file of docFiles(ROOT)) {
    const list = blocks(file, doc(file));
    let section = { text: '', anchor: '' };

    list.forEach((block, index) => {
      if (block.kind === 'heading') section = block;
      if (block.kind === 'picture') {
        const entry = examples.get(block.id);

        if (entry) entry.alt ??= block.alt;
      }
      if (block.kind !== 'marker') return;

      const entry = examples.get(exampleId(block.file) ?? '');

      if (!entry || entry.file !== block.file || entry.uses.some((use) => use.anchor === section.anchor)) return;
      entry.uses.push({
        doc: file,
        heading: section.text,
        anchor: section.anchor,
        lead: entry.uses.length ? [] : leadOf(list, index),
        position: index,
      });
    });
  }

  return examples;
}

/**
 * The topics of some examples, in the order of the site's navigation: those named like a guide first,
 * titled and linked as the guide, then the rest, by their folder's name
 * @param ids - The topic of each example
 */
function topics(ids: readonly string[]): GalleryTopic[] {
  return [...new Set(ids)]
    .sort((a, b) => topicRank(a) - topicRank(b) || a.localeCompare(b))
    .map((id) => {
      const guide = GUIDES.find((each) => each.id === id);

      return {
        id,
        title: guide?.title ?? humanize(id),
        guide: guide ? pageOf(guide.file, '') : null,
      };
    });
}

/**
 * A page's description from the prose that brings its example in: whole sentences up to about the
 * length search results show, cut at a word past 200 characters
 * @param lead - The prose
 */
function summary(lead: readonly Nodes[]): string {
  let text = '';

  for (const sentence of plainText(lead).split(/(?<=[.!?])\s+(?=[A-Z0-9@(])/)) {
    if (text.length >= 90) break;
    text = text ? `${text} ${sentence}` : sentence;
  }
  text = `${text.charAt(0).toUpperCase()}${text.slice(1)}`.replace(/:$/, '.');

  return text.length <= 200 ? text : `${text.slice(0, 199).replace(/[\s,;:]+\S*$/, '')}…`;
}

/**
 * The pages, their sidebar folders, the pictures and the examples' sources
 * @param shared - The values of the sync
 */
async function generate(shared: Shared): Promise<GeneratedFiles> {
  const entries = [...readGuides(shared).values()];
  const pictures = await shared(examplePictures);
  const programs = shared(examplePrograms);
  const all = topics(entries.map((entry) => entry.topic));
  const files: GeneratedFiles = {};
  const examples: GalleryExample[] = [];
  const titles = new Set<string>();

  all.forEach((topic, topicIndex) => {
    const members = entries
      .filter((entry) => entry.topic === topic.id)
      .sort(
        (a, b) => (a.uses[0]?.position ?? Infinity) - (b.uses[0]?.position ?? Infinity) || a.id.localeCompare(b.id),
      );

    files[`${PAGES}/${topic.id}/_category_.json`] = categoryJson(topic.title, topicIndex + 1);
    members.forEach((entry, index) => {
      const [first] = entry.uses;
      const name = path.posix.basename(entry.id);
      const program = programs.get(entry.id)!;
      const section = program.title ?? first?.heading ?? humanize(name);
      const title = titles.has(section) ? `${section} (${name})` : section;
      const site = pictures.get(entry.id);
      const guideLead: Flow[] = first
        ? docNodes(first.lead, {
            source: first.doc,
            output: `${PAGES}/${entry.id}.mdx`,
            names: new Map(),
            quoted: true,
          })
        : [];
      const lead: Flow[] =
        guideLead.length > 0 ? guideLead : program.description ? [paragraph(program.description)] : [];
      const alt = entry.alt ?? program.description ?? `What the ${name} example of ${topic.title} draws`;
      const example: GalleryExample = {
        id: entry.id,
        title,
        topic: topic.id,
        description: lead.length ? summary(lead) : `The ${humanize(name).toLowerCase()} example of ${topic.title}.`,
        alt,
        href: `/examples/${entry.id}/`,
        thumbnail: site?.thumbnail ?? null,
      };
      const source: ExampleSourceFile = {
        id: entry.id,
        title,
        language: program.language,
        code: program.shown,
        compiled: program.compiled,
        files: program.files,
        picture: site?.picture ?? null,
      };

      titles.add(section);
      examples.push(example);
      Object.assign(
        files,
        site?.files,
        { [`${SOURCES}/${entry.id}.json`]: JSON.stringify(source) },
        writePage({
          output: `${PAGES}/${entry.id}.mdx`,
          route: example.href,
          // The heading is the page's own; the title, which tabs and search results show, names the topic too
          fields: {
            title: `${title} (${topic.title} example)`,
            sidebar_label: title,
            sidebar_position: index + 1,
            description: example.description,
            image: site?.card ?? '/img/ogimage.png',
            hide_table_of_contents: true,
            custom_edit_url: editUrl(entry.file),
          },
          children: [
            heading(1, title),
            ExampleHeader({ topic, source: blobUrl(entry.file) }),
            ...lead,
            Example({ file: entry.file, title: path.posix.basename(entry.file), alt }),
            GuideSections({
              topic,
              sections: entry.uses.map((use) => ({
                title: use.heading,
                href: pageOf(use.doc, use.anchor) ?? blobUrl(`${use.doc}#${use.anchor}`),
              })),
            }),
          ],
        }),
      );
    });
  });

  const catalogue: ExampleCatalogue = {
    topics: all.map(({ id, title }) => ({ id, title })),
    examples: examples.map(({ id, title, topic }) => ({ id, title, topic })),
  };

  return Object.assign(
    files,
    { [`${SOURCES}/index.json`]: JSON.stringify(catalogue) },
    writePage({
      output: `${PAGES}/index.mdx`,
      route: '/examples/',
      fields: {
        title: 'Examples',
        sidebar_label: 'All examples',
        sidebar_position: 0,
        description:
          'Every example of react-pixi-fiber, each drawn by its visual test and runnable in the page, by topic.',
        hide_table_of_contents: true,
        custom_edit_url: null,
      },
      children: [
        heading(1, 'Examples'),
        paragraph(
          'Every example is a visual test: the picture is what it draws on pixi-3d, and its page runs it live. Pick a topic or search to narrow the list.',
        ),
        Gallery({ examples, topics: all }),
      ],
    }),
  );
}

export const examples: Generator = {
  name: 'examples',
  outputs: [PAGES, 'llms/examples', `static/${PICTURES}`, `static/${THUMBNAILS}`, SOURCES],
  sources: ['examples', 'tests/snapshots/docs', 'src'],
  generate,
};

/**
 * The Docs section, made from the Markdown of the repo: the guides in `src/**\/__docs__` (listed in
 * `GUIDES`), laid out as react-three-fiber's own docs are, and the parity findings of
 * docs/feasibility.md, which the Differences page lists after its guide. Each section of the sidebar
 * has an overview page, the one its heading and the breadcrumbs link.
 *
 * `content/sidebar.mts` says which pages there are and how the sidebar groups them; `content/mdx.mts`
 * turns a doc into the nodes of a page. Every page's "Edit this page" opens its source on GitHub.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { Nodes, PhrasingContent, Root } from 'mdast';
import { visit } from 'unist-util-visit';

import { editUrl } from '../../links/index.ts';
import { listExamples } from '../../plugins/example/catalogue.mts';
import { PACKAGE_SOURCES, ROOT } from '../paths.mts';
import type { GeneratedFiles, Generator, Shared } from '../sync.mts';
import { ENTRIES, packageName } from '../typedoc/entries.mts';
import type { Guide, GuideSection } from '../typedoc/guides.mts';
import { DIFFERENCES_ID, GUIDES, INTRODUCTION_ID, SECTION_PACKAGES, SECTIONS } from '../typedoc/guides.mts';
import { installable, PRERELEASE } from '../version.mts';
import { apiLinks } from './api/model.mts';
import { Cards, Lead, Status, TabItem, Tabs } from './components.mts';
import type { DocContext } from './content/mdx.mts';
import { docNodes } from './content/mdx.mts';
import type { Parity } from './content/parity.mts';
import { FEASIBILITY, PARITY_CLASSES, readParity } from './content/parity.mts';
import { FORK_DIFF, guidePage, pageUrl, SECTION_INDEX } from './content/sidebar.mts';
import type { Flow, Page } from './markdown.mts';
import {
  code,
  heading,
  inlineCode,
  link,
  list,
  paragraph,
  parsedDocs,
  plainText,
  table,
  text,
  writePage,
} from './markdown.mts';

/** How long a page's description may grow, in characters, as search engines show it */
const DESCRIPTION_LENGTH = 160;
/** How long it may grow to take a second sentence after a first shorter than half of `DESCRIPTION_LENGTH` */
const DESCRIPTION_STRETCH = 220;

/** The package managers the install tabs show, by the command that adds a package */
const PACKAGE_MANAGERS = ['npm install', 'pnpm add', 'yarn add', 'bun add'];

/** What the pages of the section are made from, each read once */
interface Sources {
  /** The tree of a guide, by its file */
  readonly doc: (file: string) => Root;
  /** Where the names in a page's code spans link: public names to the API reference, topics to the gallery */
  readonly names: ReadonlyMap<string, string>;
  /** How many examples each folder of `examples/` has */
  readonly exampleCounts: ReadonlyMap<string, number>;
}

/**
 * A page of the section
 * @param id - Its id
 * @param fields - Its front matter
 * @param children - Its content
 */
function page(id: string, fields: Page['fields'], children: readonly Flow[]): Page {
  return { output: `content/${id}.mdx`, route: pageUrl(id), fields, children };
}

/**
 * A page's description for search engines and link previews: the first sentences of a paragraph, as
 * many as fit in `DESCRIPTION_LENGTH`, at least one, and two when the first is short
 * @param paragraph - The paragraph's text
 */
function describe(paragraph: string): string {
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  let description = sentences[0]!;

  for (const sentence of sentences.slice(1)) {
    const limit = description.length < DESCRIPTION_LENGTH / 2 ? DESCRIPTION_STRETCH : DESCRIPTION_LENGTH;

    if (description.length + 1 + sentence.length > limit) break;
    description += ` ${sentence}`;
  }

  return description;
}

/**
 * The text of the first paragraph of a doc that isn't a picture alone
 * @param children - The doc
 */
function firstParagraph(children: readonly Nodes[]): string {
  const first = children.find(
    (node) => node.type === 'paragraph' && !(node.children.length === 1 && node.children[0]!.type === 'image'),
  );

  return first ? plainText(first) : '';
}

/**
 * How a guide becomes a page
 * @param guide - The guide
 * @param names - Where the names the page may link go
 */
function contextOf(guide: Guide, names: ReadonlyMap<string, string>): DocContext {
  return { source: guide.file, output: `content/${guidePage(guide.id)}.mdx`, names };
}

/**
 * A command for each package manager, as tabs that remember the reader's choice across the site
 * @param packages - What to install, as `npm install` names them
 */
function installTabs(packages: string): Flow {
  return Tabs(
    { groupId: 'package-manager' },
    PACKAGE_MANAGERS.map((add) => {
      const [manager = ''] = add.split(' ');

      return TabItem({ value: manager, label: manager }, [code(installable(`${add} ${packages}`), 'sh')]);
    }),
  );
}

/**
 * A list of links as cards: each item a link, then what is there
 * @param label - What the cards are, for a screen reader
 * @param items - The content of each item, `[Title](url) What is there.`
 */
function cards(label: string, items: readonly (readonly PhrasingContent[])[]): Flow {
  return Cards({ label }, [list(items.map((item) => [paragraph(...item)]))]);
}

/**
 * A guide's examples as a count, `4 examples`
 * @param count - How many
 */
const examplesText = (count: number): string => `${count} example${count === 1 ? '' : 's'}`;

/**
 * The nodes of a guide, with each `npm install` block as tabs for every package manager
 * @param guide - The guide
 * @param sources - The guides, and where their names link
 */
function guideNodes(guide: Guide, sources: Sources): Flow[] {
  const nodes = docNodes(sources.doc(guide.file).children, contextOf(guide, sources.names)).map((node) =>
    node.type === 'code' && node.lang === 'sh' && node.value.startsWith('npm install ') && !node.value.includes('\n')
      ? installTabs(node.value.slice('npm install '.length))
      : node,
  );

  visit({ type: 'root', children: nodes }, 'inlineCode', (node) => {
    if (node.value.startsWith('npm install ')) node.value = installable(node.value);
  });

  return nodes;
}

/**
 * Where a guide leads on to: its examples, which run in the page, and the API reference
 * @param guide - The guide
 * @param count - How many examples it has
 */
function guideLinks(guide: Guide, count: number): Flow[] {
  return [
    { type: 'thematicBreak' },
    cards('More on this guide', [
      ...(count > 0
        ? [
            [
              link(`/examples/?topic=${guide.id}`, 'Examples'),
              text(
                count === 1
                  ? " This guide's example, with the picture its visual test draws."
                  : ` The ${examplesText(count)} of this guide, each with the picture its visual test draws.`,
              ),
            ],
          ]
        : []),
      [link('/api/', 'API reference'), text(' Every export of the packages, with its types.')],
    ]),
  ];
}

/**
 * The parity findings as the end of the Differences page: how far each level carries over, then every
 * item of r3f's surface by group, with how it works on pixi-3d, then what still limits swapping the
 * import
 * @param parity - The findings
 */
function parityNodes(parity: Parity): Flow[] {
  const label = new Map(PARITY_CLASSES.map(({ id, label: shown }) => [id, shown]));

  return [
    heading(2, 'How much carries over'),
    paragraph(
      "r3f's surface splits into three levels: the React API (L1), three's JSX names (L2), and the fields and methods of the objects behind them (L3). From the findings in ",
      inlineCode(FEASIBILITY),
      ':',
    ),
    parity.levels,
    heading(2, 'Item by item'),
    paragraph("Each item of r3f's surface is one of these:"),
    list(
      PARITY_CLASSES.map(({ id, label: shown, meaning }) => [
        paragraph(Status({ kind: id, label: shown }), ` ${meaning}`),
      ]),
    ),
    paragraph(
      'Where an item has a second label, that is the change that would bring it to full parity. The level says which of the three it belongs to.',
    ),
    ...parity.groups.flatMap((group) => [
      heading(3, group.title),
      table(
        ['r3f', 'On pixi-3d', 'Level', 'Notes'],
        group.rows.map((row) => [
          row.item,
          row.classes.flatMap((kind, index) => [
            ...(index > 0 ? [text(' ')] : []),
            Status({ kind, label: label.get(kind)! }),
            ...(row.qualifiers[index] ? [text(` ${row.qualifiers[index]}`)] : []),
          ]),
          [text(row.level)],
          row.notes,
        ]),
      ),
    ]),
    ...(parity.blockers.length > 0
      ? [
          heading(2, 'What still limits swapping the import'),
          paragraph(
            "None of these stops r3f's core from running. They limit how far an existing app gets by changing its import alone:",
          ),
          list(
            parity.blockers.map((blocker) => [
              paragraph(...blocker.blocker),
              paragraph({ type: 'emphasis', children: [text('Fix: ')] }, ...blocker.fix),
            ]),
          ),
        ]
      : []),
  ];
}

/**
 * A guide as its page
 * @param guide - The guide
 * @param sources - The guides, where their names link, and the examples
 * @param parity - The parity findings, which the Differences page ends with
 */
function guidePageOf(guide: Guide, sources: Sources, parity: Parity): Page {
  const doc = sources.doc(guide.file);
  const nodes = guideNodes(guide, sources);
  const [first, ...rest] = nodes;
  const lead: Flow[] =
    first?.type === 'heading' && first.depth === 1 && rest[0]?.type === 'paragraph'
      ? [first, Lead({}, [rest[0]]), ...rest.slice(1)]
      : nodes;
  const count = sources.exampleCounts.get(guide.id) ?? 0;
  const prerelease: Flow[] =
    guide.id === 'installation' && PRERELEASE
      ? [
          {
            type: 'containerDirective' as const,
            name: 'info',
            children: [
              { type: 'paragraph' as const, data: { directiveLabel: true }, children: [text('Not on npm yet')] },
              paragraph(
                "react-pixi-fiber hasn't been released. Until then, build it from the repo and link it, as the README of the repo explains.",
              ),
            ],
          },
        ]
      : [];

  return page(
    guidePage(guide.id),
    {
      title: guide.title,
      sidebar_label: guide.label,
      description: describe(firstParagraph(doc.children)),
      keywords: guide.section === 'getting-started' ? ['get started', 'react-three-fiber', 'pixi-3d'] : undefined,
      custom_edit_url: editUrl(guide.file),
    },
    [
      ...lead.slice(0, 2),
      ...prerelease,
      ...lead.slice(2),
      ...(guide.id === DIFFERENCES_ID ? parityNodes(parity) : []),
      ...(guide.id === INTRODUCTION_ID ? [] : guideLinks(guide, count)),
    ],
  );
}

/** What each section's overview says first: what its package is */
const SECTION_LEADS: Readonly<Record<Exclude<GuideSection, 'getting-started'>, string>> = {
  core: "@react-fiber/core is react-three-fiber's API on pixi.js: <Canvas>, roots, the hooks and the events, the stage that draws 2D over and under the 3D, the frame loop, and the bridges between 2D and 3D. Every app has it, and the other packages plug into it.",
  '2d': "@react-fiber/2d puts pixi.js 2D in the same canvas, tree, hooks and events as the 3D: sprites, graphics, text, filters and masks as elements, drawn over or under the 3D, with react-three-fiber's API and no change to pixi.js's classes.",
  '3d': "@react-fiber/3d puts @pixi/3d's own classes in the tree as elements, under pixi's conventions: options objects, @pixi/3d's vectors and rotations and pixi colours, with react-three-fiber's hooks, events and loading, and nothing of three.js installed.",
  'threejs-compat':
    "@react-fiber/threejs-compat is the optional mixin that gives @pixi/3d's objects three.js's names and API, so a react-three-fiber app swaps its imports. These are react-three-fiber's own guides, running on @pixi/3d with the same code.",
  r3f: "@react-fiber/r3f is react-three-fiber's core, forked so that it asks its renderer through eight hooks where it reached into three.js objects. Written for react-three-fiber's maintainers: the interface, each hook and why, the diff against upstream, and how r3f's own tests run on it.",
};

/**
 * The overview of a section, which its heading in the sidebar links: a card for each of its guides,
 * with what it covers, then its package's API reference, or for the r3f fork, its diff
 * @param section - The section
 * @param sources - The guides
 */
function sectionIndex(section: Exclude<GuideSection, 'getting-started'>, sources: Sources): Page {
  const guides = GUIDES.filter((guide) => guide.section === section);
  const title = SECTIONS[section];
  const items = guides.map((guide): PhrasingContent[] => {
    const count = sources.exampleCounts.get(guide.id) ?? 0;

    return [
      link(pageUrl(guidePage(guide.id)), guide.title),
      text(` ${describe(firstParagraph(sources.doc(guide.file).children))}`),
      ...(count > 0 ? [text(' '), link(`/examples/?topic=${guide.id}`, examplesText(count))] : []),
    ];
  });
  const pkg = SECTION_PACKAGES[section];
  const entries = ENTRIES.filter((entry) => entry.package === pkg);
  const topic = sources.exampleCounts.get(section) ?? 0;

  if (section === 'r3f') {
    items.push([
      link(pageUrl(FORK_DIFF.id), FORK_DIFF.title),
      text(' Every line the fork changes, file by file, as git apply takes it in the repository of react-three-fiber.'),
    ]);
  }
  if (topic > 0) {
    items.push([
      link(`/examples/?topic=${section}`, `The ${SECTIONS[section]} examples`),
      text(` The ${examplesText(topic)} of the package, each drawn by its visual test and runnable in the page.`),
    ]);
  }
  for (const entry of entries) {
    items.push([
      link(`/api/${entry.name}/`, `${packageName(entry)} API`),
      text(' Every export of the entry, from its JSDoc, with its types.'),
    ]);
  }

  return page(SECTION_INDEX[section], { title, description: SECTION_LEADS[section], custom_edit_url: null }, [
    heading(1, title),
    Lead({}, [paragraph(SECTION_LEADS[section])]),
    cards(`${title} pages`, items),
  ]);
}

/**
 * The fork's diff against upstream as a page of the r3f section: how big it is, each file with what it
 * adds and removes, then each file's hunks, read from `packages/r3f/fork.diff`
 * @param readme - The fork's README, whose size line and upstream commit the page repeats
 */
function forkDiffPage(readme: string): Page {
  const diff = fs.readFileSync(path.join(ROOT, FORK_DIFF.file), 'utf8');
  const files = diff
    .split(/^(?=diff --git )/m)
    .filter((part) => part.startsWith('diff --git '))
    .map((part) => {
      const name = /^diff --git a\/packages\/fiber\/(\S+)/.exec(part)![1]!;
      const lines = part.split('\n');
      const added = lines.filter((line) => line.startsWith('+') && !line.startsWith('+++')).length;
      const removed = lines.filter((line) => line.startsWith('-') && !line.startsWith('---')).length;

      return { name, added, removed, body: part.trimEnd() };
    });
  const commit = /commit `([0-9a-f]{40})`/.exec(readme)?.[1] ?? '';
  const size = /<!-- diff-size -->(.*?)<!-- \/diff-size -->/.exec(readme)?.[1] ?? '';
  const lead = `The whole of the fork's change to react-three-fiber's packages/fiber at ${commit.slice(0, 7)}: ${size}. npm run diff:r3f writes it, npm run test:lint fails when it is stale, and git apply fork.diff takes it at the root of a clone of r3f at that commit.`;

  return page(FORK_DIFF.id, { title: FORK_DIFF.title, description: describe(lead), custom_edit_url: null }, [
    heading(1, FORK_DIFF.title),
    Lead({}, [
      paragraph(
        "The whole of the fork's change to react-three-fiber's ",
        inlineCode('packages/fiber'),
        ' at ',
        link(
          `https://github.com/pmndrs/react-three-fiber/tree/${commit}/packages/fiber`,
          inlineCode(commit.slice(0, 7)),
        ),
        `: ${size}. `,
        inlineCode('npm run diff:r3f'),
        ' writes it, ',
        inlineCode('npm run test:lint'),
        ' fails when it is stale, and ',
        inlineCode('git apply fork.diff'),
        ' takes it at the root of a clone of r3f at that commit, not in ',
        inlineCode('packages/fiber'),
        ', where git would skip every path. ',
        link(pageUrl(guidePage('renderer-hooks')), 'Renderer hooks'),
        ' says what each change is for.',
      ),
    ]),
    table(
      ['File in packages/fiber', 'Added', 'Removed'],
      files.map(({ name, added, removed }) => [[inlineCode(name)], [text(`${added}`)], [text(`${removed}`)]]),
    ),
    ...files.flatMap(({ name, body }) => [heading(2, name), code(body, 'diff')]),
  ]);
}

/**
 * Where the names in code spans link: each public name and `Name.member` to its API reference, the
 * package to its entry's overview, and each folder of examples to its examples
 * @param api - Every public name's page in the API reference
 * @param topics - The folders of `examples/`
 */
function linkedNames(api: ReadonlyMap<string, string>, topics: readonly string[]): Map<string, string> {
  const names = new Map<string, string>();

  for (const topic of topics) names.set(`examples/${topic}`, `/examples/?topic=${topic}`);
  for (const entry of ENTRIES) names.set(packageName(entry), `/api/${entry.name}/`);
  for (const [name, url] of api) names.set(name, url);

  return names;
}

/**
 * Every page of the Docs section, built once per sync: the generator writes them, and the API reference
 * lists the sections that link each of its pages
 * @param shared - The values of the sync
 */
export function docsPages(shared: Shared): readonly Page[] {
  const exampleCounts = new Map<string, number>();

  for (const { topic } of shared(listExamples)) exampleCounts.set(topic, (exampleCounts.get(topic) ?? 0) + 1);

  const sources: Sources = {
    doc: shared(parsedDocs),
    names: linkedNames(shared(apiLinks), [...exampleCounts.keys()]),
    exampleCounts,
  };
  const parity = readParity(ROOT);

  return [
    ...GUIDES.map((guide) => guidePageOf(guide, sources, parity)),
    ...(Object.keys(SECTION_LEADS) as (keyof typeof SECTION_LEADS)[]).map((section) => sectionIndex(section, sources)),
    forkDiffPage(fs.readFileSync(path.join(ROOT, 'packages/r3f/README.md'), 'utf8')),
  ];
}

/** The Docs section, from the guides and the parity findings */
export const content: Generator = {
  name: 'content',
  outputs: ['content/docs', 'llms/docs'],
  sources: [
    ...PACKAGE_SOURCES,
    'examples',
    'package.json',
    FEASIBILITY,
    'packages/docs/scripts/typedoc',
    'packages/r3f/README.md',
    FORK_DIFF.file,
  ],
  generate: (shared) => Object.assign({}, ...shared(docsPages).map(writePage)) as GeneratedFiles,
};

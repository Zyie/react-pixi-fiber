/**
 * The Docs section, made from the Markdown of the repo: the guides in `src/**\/__docs__` (listed in
 * `GUIDES`), laid out as react-three-fiber's own docs are, and the parity findings of
 * docs/feasibility.md, which the Differences page lists after its guide. Each section of the sidebar
 * has an overview page, the one its heading and the breadcrumbs link.
 *
 * `content/sidebar.mts` says which pages there are and how the sidebar groups them; `content/mdx.mts`
 * turns a doc into the nodes of a page. Every page's "Edit this page" opens its source on GitHub.
 */
import type { Nodes, PhrasingContent, Root } from 'mdast';
import { visit } from 'unist-util-visit';

import { editUrl } from '../../links/index.ts';
import { listExamples } from '../../plugins/example/catalogue.mts';
import { ROOT } from '../paths.mts';
import type { GeneratedFiles, Generator, Shared } from '../sync.mts';
import { ENTRIES, packageName } from '../typedoc/entries.mts';
import type { Guide, GuideSection } from '../typedoc/guides.mts';
import { DIFFERENCES_ID, GUIDES, INTRODUCTION_ID, SECTIONS } from '../typedoc/guides.mts';
import { installable, PRERELEASE } from '../version.mts';
import { apiLinks } from './api/model.mts';
import { Cards, Lead, Status, TabItem, Tabs } from './components.mts';
import type { DocContext } from './content/mdx.mts';
import { docNodes } from './content/mdx.mts';
import type { Parity } from './content/parity.mts';
import { FEASIBILITY, PARITY_CLASSES, readParity } from './content/parity.mts';
import { guidePage, pageUrl, SECTION_INDEX } from './content/sidebar.mts';
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
  const entry = ENTRIES[0];

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
      [
        link(`/api/${entry.name}/`, 'API reference'),
        text(' Every export of '),
        inlineCode(packageName(entry)),
        text(', with its types.'),
      ],
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
                "react-pixi-fiber hasn't been released, and @pixi/3d isn't on npm either. Until then, build it from the repo and link it, as the README of the repo explains.",
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

/**
 * The overview of a section, which its heading in the sidebar links: a card for each of its guides,
 * with what it covers, and for the reference, the API
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
  const leads: Record<typeof section, string> = {
    tutorials:
      "Step by step through react-three-fiber's tutorials, each running on pixi-3d with the same code. Every one assumes you know some React.",
    '2d': "pixi.js 2D in the same canvas, tree, hooks and events as the 3D: sprites, graphics, text, filters and masks as elements, drawn over or under the 3D, with react-three-fiber's API, and bridges that put 2D on 3D objects, 3D inside 2D and 2D filters on the 3D.",
    reference:
      'What differs from react-three-fiber, item by item, and every name react-pixi-fiber exports, read from its source and JSDoc.',
    advanced: 'Keeping scenes fast as they grow: rendering on demand, sharing resources and instancing, on pixi-3d.',
  };

  if (section === 'reference') {
    items.push([
      link('/api/', 'API reference'),
      text(
        ' Every export of react-pixi-fiber, from its JSDoc, with its types: the hooks, the components and the types.',
      ),
    ]);
  }

  return page(SECTION_INDEX[section], { title, description: leads[section], custom_edit_url: null }, [
    heading(1, title),
    Lead({}, [paragraph(leads[section])]),
    cards(`${title} pages`, items),
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
    sectionIndex('tutorials', sources),
    sectionIndex('2d', sources),
    sectionIndex('reference', sources),
    sectionIndex('advanced', sources),
  ];
}

/** The Docs section, from the guides and the parity findings */
export const content: Generator = {
  name: 'content',
  outputs: ['content/docs', 'llms/docs'],
  sources: ['src', 'examples', 'package.json', FEASIBILITY, 'docs/scripts/typedoc'],
  generate: (shared) => Object.assign({}, ...shared(docsPages).map(writePage)) as GeneratedFiles,
};

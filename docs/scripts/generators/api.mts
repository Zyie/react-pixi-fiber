/**
 * The API section: an index of the package entries, an overview of each, and a page for every name an
 * entry exports, read from its barrel and the JSDoc of what it exports by docs/scripts/typedoc/api.mts.
 * Most names come from react-three-fiber's core, which react-pixi-fiber vendors unchanged, so their docs
 * are r3f's own and their pages say so. Only the one-line summary of each entry is written here;
 * `api/model.mts` lays the pages out and says where each is.
 *
 * A page has "Used in" before its members: the sections of the Docs section that link it, and the
 * examples that import it.
 */
import type { PhrasingContent } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';

import { blobUrl, editUrl, R3F_DOCS } from '../../links/index.ts';
import { listExamples } from '../../plugins/example/catalogue.mts';
import { examplePrograms } from '../../plugins/example/source.mts';
import type { ApiExampleUse, ApiGuideUse, ApiUsageProps } from '../../src/components/Api/ApiUsage.tsx';
import { ROOT } from '../paths.mts';
import type { GeneratedFiles, Generator, Shared } from '../sync.mts';
import type { ApiCallable, ApiDoc, ApiEntry, ApiMember, ApiSymbol } from '../typedoc/api.mts';
import { ENTRIES, entryFile, isVendored, MAIN, packageName } from '../typedoc/entries.mts';
import type { Entry, EntryName } from '../typedoc/entries.mts';
import { GUIDES } from '../typedoc/guides.mts';
import type { ApiModel, SymbolPage } from './api/model.mts';
import { apiModel, AUGMENTS, KINDS } from './api/model.mts';
import { ApiBadge, ApiCode, ApiEntries, ApiField, ApiFields, ApiMeta, ApiUsage } from './components.mts';
import { docsPages } from './content.mts';
import type { DocContext } from './content/mdx.mts';
import { docNodes } from './content/mdx.mts';
import { guidePage, pageUrl } from './content/sidebar.mts';
import { examplePictures } from './examples/pictures.mts';
import type { Flow, Page } from './markdown.mts';
import {
  categoryJson,
  code,
  heading as headingNode,
  inlineCode,
  link,
  list,
  paragraph,
  parseMarkdown,
  plainText,
  sectionLinks,
  table,
  text,
  writePage,
} from './markdown.mts';

const OUT = 'content/api';

/** Each entry's place in the sidebar and what it is for */
const ENTRY_INFO: Readonly<Record<EntryName, { position: number; summary: string; related?: readonly string[] }>> = {
  'react-pixi-fiber': {
    position: 1,
    summary:
      "react-three-fiber's API on pixi-3d: `Canvas`, `createRoot`, the hooks, `extend` and the JSX elements under three's names.",
  },
};

/** The names a newcomer reaches for first, listed on the index with their own summaries, when the entry exports them */
const START_HERE = ['Canvas', 'createRoot', 'useFrame', 'useThree', 'useLoader', 'extend', 'createPortal'];

/** How many examples an entry's overview shows before it links the gallery for the rest */
const ENTRY_EXAMPLES = 6;

/** Where the Docs section and the examples use each page of the section */
interface Usage {
  /** The pages of the Docs section that link a name's page, with the sections that do, by its route */
  readonly guides: ReadonlyMap<string, readonly ApiGuideUse[]>;
  /** The examples that import a name or an entry, by the route of its page or overview, in gallery order */
  readonly examples: ReadonlyMap<string, readonly ApiExampleUse[]>;
}

/** What every page of the section is written from */
interface Site extends ApiModel {
  readonly usage: Usage;
}

/** How a page links the names in its prose and code */
interface Linker {
  /** The route of a name, or null for one with no page or for the page itself */
  (name: string): string | null;
}

/**
 * The linker of a page
 * @param site - The model
 * @param entry - The entry the page belongs to
 * @param self - The route of the page, which no link points at
 */
function linkerOf(site: ApiModel, entry: Entry, self: string | null): Linker {
  return (name) => {
    const route = site.resolve(name, entry);

    return route === null || route === self ? null : route;
  };
}

/**
 * The routes of the names in a piece of code, for the `links` of `ApiCode` and `ApiField`
 * @param source - The code
 * @param linker - The page's linker
 */
function linksIn(source: string, linker: Linker): Record<string, string> | undefined {
  const links: Record<string, string> = {};

  for (const [name] of source.matchAll(/[A-Za-z_$][\w$]*/g)) {
    const route = linker(name);

    if (route) links[name] = route;
  }

  return Object.keys(links).length > 0 ? links : undefined;
}

/** A `{@link Name}`, `{@link Name | label}` or `{@link Name label}` tag of JSDoc */
const LINK_TAG = /\{@link(?:code|plain)?\s+([^}|\s]+)\s*(?:[|\s]\s*([^}]*))?\}/g;

/** What builds one page */
interface Writer {
  readonly nodes: Flow[];
  readonly link: Linker;
  /** How the guides' transform turns the page's JSDoc into nodes */
  readonly context: DocContext;
  /** A unique id for a heading, from the slug it would have */
  id(base: string): string;
}

/**
 * A writer for a page whose member anchors are taken
 * @param linker - The page's linker
 * @param source - The file its JSDoc is in, from the repo root, which relative links start from
 * @param output - The page, from `docs/`
 * @param anchors - The member anchors, which headings never take
 */
function writerOf(linker: Linker, source: string, output: string, anchors: Iterable<string> = []): Writer {
  const used = new Set(anchors);

  return {
    nodes: [],
    link: linker,
    context: { source, output, names: { get: (name) => linker(name) ?? undefined } },
    id(base) {
      let id = base;

      for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);

      return id;
    },
  };
}

/**
 * JSDoc Markdown as nodes, through the transform the guides go through: `{@link Name}` becomes a link
 * to the page of the name, or its code when it has none, and the transform links the first mention of
 * a public name in inline code. Code is kept as it is.
 * @param writer - The page
 * @param markdown - The Markdown
 */
function jsdoc(writer: Writer, markdown: string): Flow[] {
  const tree = parseMarkdown(markdown);

  findAndReplace(tree, [
    LINK_TAG,
    (_: string, name: string, label?: string) => {
      const route = writer.link(name);
      const shown = label?.trim() ? text(label.trim()) : inlineCode(name);

      return route ? link(route, shown) : shown;
    },
  ]);

  return docNodes(tree.children, writer.context);
}

/**
 * One line of JSDoc Markdown as the nodes of a line
 * @param writer - The page
 * @param markdown - The Markdown
 */
function jsdocLine(writer: Writer, markdown: string): PhrasingContent[] {
  return jsdoc(writer, markdown).flatMap((node) => (node.type === 'paragraph' ? node.children : []));
}

/**
 * The first paragraph of a doc as plain text, for a page's description and an overview's table
 * @param doc - The doc
 */
function summaryOf(doc: ApiDoc | null): string {
  const first = doc?.description.split(/\n\s*\n/)[0] ?? '';

  return first
    .replace(LINK_TAG, (_, name: string, label?: string) => (label?.trim() ? label.trim() : `\`${name}\``))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Writes a heading with an explicit id
 * @param writer - The page
 * @param depth - 2 or 3
 * @param children - Its content; a string is text
 * @param id - Its id; a fresh one from the text when omitted
 */
function heading(writer: Writer, depth: 2 | 3, children: readonly PhrasingContent[] | string, id?: string): void {
  const title = typeof children === 'string' ? children : plainText(children);

  writer.nodes.push(headingNode(depth, children, id ?? writer.id(title.toLowerCase().replace(/[^\w]+/g, '-'))));
}

/**
 * A signature, highlighted with its names linked
 * @param writer - The page
 * @param source - The signature
 */
function signature(writer: Writer, source: string): Flow {
  return ApiCode({ code: source, links: linksIn(source, writer.link) });
}

/**
 * How a const whose type is named, such as `useFrame: UseFrame`, is called: `useFrame(callback?:
 * FrameCallback): FrameNextControls`; null for anything else, whose declaration already shows it
 * @param symbol - The symbol
 */
function callSignatureOf(symbol: ApiSymbol): string | null {
  const { callable } = symbol;

  if (symbol.kind !== 'const' || !callable || /=>|\(/.test(symbol.signature)) return null;

  const parameters = callable.parameters.map(
    ({ name, type, optional }) => `${name}${optional ? '?' : ''}${type ? `: ${type}` : ''}`,
  );

  return `${symbol.name}(${parameters.join(', ')})${callable.returns ? `: ${callable.returns}` : ''}`;
}

/**
 * A field: a parameter, a property, a return value or an exception
 * @param writer - The page
 * @param shown - What the field shows
 * @param shown.id - The anchor of a property
 * @param shown.name - The name of a parameter or a property
 * @param shown.type - Its type
 * @param shown.optional - Whether it may be left out
 * @param shown.readonly - Whether it can only be read
 * @param shown.value - The value it starts with or defaults to
 * @param shown.description - Its description, as JSDoc Markdown
 */
function field(
  writer: Writer,
  shown: {
    id?: string;
    name?: string;
    type?: string | null;
    optional?: boolean;
    readonly?: boolean;
    value?: string | null;
    description?: string;
  },
): Flow {
  const { id, name, optional, readonly, description } = shown;
  const type = shown.type || undefined;

  return ApiField(
    {
      id,
      name,
      type,
      links: type ? linksIn(type, writer.link) : undefined,
      optional,
      readonly,
      value: shown.value || undefined,
    },
    description ? jsdoc(writer, description) : [],
  );
}

/**
 * Writes the parts of a doc after its description: parameters, return value, exceptions, default and
 * examples. A symbol's parts are sections; a member's are labelled blocks inside its own section.
 * @param writer - The page
 * @param doc - The doc
 * @param callable - What the declaration says of the parameters and the return value
 * @param level - 2 for a symbol, 3 for a member
 */
function docParts(writer: Writer, doc: ApiDoc | null, callable: ApiCallable | null, level: 2 | 3): void {
  if (!doc) return;

  const params = doc.tags.filter(({ tag }) => tag === 'param');
  const returns = doc.tags.find(({ tag }) => tag === 'returns' || tag === 'return');
  const throws = doc.tags.filter(({ tag }) => tag === 'throws');
  const defaults = doc.tags.find(({ tag }) => tag === 'default' || tag === 'defaultValue');
  const examples = doc.tags.filter(({ tag }) => tag === 'example');
  const group = (title: string, fields: Flow[]): void => {
    if (level === 2) heading(writer, 2, title);
    writer.nodes.push(ApiFields(level === 2 ? {} : { title }, fields));
  };

  if (params.length > 0) {
    group(
      'Parameters',
      params.map((param) => {
        const written = callable?.parameters.find(({ name }) => name === param.name);

        return field(writer, {
          name: param.name ?? param.text,
          type: written?.type ?? param.type,
          optional: written?.optional,
          description: param.description,
        });
      }),
    );
  }
  if (returns) group('Returns', [field(writer, { type: callable?.returns, description: returns.text })]);
  if (throws.length > 0) {
    group(
      'Throws',
      throws.map(({ type, description }) => field(writer, { type, description })),
    );
  }
  if (defaults) writer.nodes.push(paragraph('Default: ', inlineCode(defaults.text)));
  if (examples.length > 0) {
    if (level === 2) heading(writer, 2, examples.length > 1 ? 'Examples' : 'Example');
    // An example is code: one written without a fence, as r3f's are, is fenced here, since MDX reads a
    // paragraph that starts with `import` as a module's import
    for (const { text: example } of examples) {
      writer.nodes.push(...(example.includes('```') ? jsdoc(writer, example) : [code(example, 'tsx')]));
    }
  }
}

/**
 * Properties as one list of fields
 * @param writer - The page
 * @param page - The page they are members of
 * @param properties - The properties
 */
function propertyFields(writer: Writer, page: SymbolPage, properties: readonly ApiMember[]): Flow {
  return ApiFields(
    {},
    properties.map((member) =>
      field(writer, {
        id: page.anchors.get(member.name),
        name: member.name,
        type: member.field?.type,
        optional: member.field?.optional,
        readonly: member.field?.readonly,
        value:
          member.field?.value ?? member.doc?.tags.find(({ tag }) => tag === 'default' || tag === 'defaultValue')?.text,
        description: member.doc?.description,
      }),
    ),
  );
}

/**
 * Writes the members of a symbol: the constructor, then properties, then methods. Properties are
 * fields when none has more than a description and a default, and sections otherwise. A section's
 * heading is the member's name as code, which MDX reads as it is: as text, `:hover` is a directive.
 * @param writer - The page
 * @param page - The page
 */
function members(writer: Writer, page: SymbolPage): void {
  const { symbol, anchors } = page;
  const constructors = symbol.members.filter(({ kind }) => kind === 'constructor');
  const properties = symbol.members.filter(({ kind }) => kind === 'property');
  const methods = symbol.members.filter(({ kind }) => kind === 'method');
  const rich = (member: ApiMember): boolean =>
    member.doc?.tags.some(({ tag }) => tag !== 'default' && tag !== 'defaultValue' && tag !== 'advanced') ?? false;
  const body = (member: ApiMember): void => {
    writer.nodes.push(signature(writer, member.signature));
    if (member.doc?.description) writer.nodes.push(...jsdoc(writer, member.doc.description));
    docParts(writer, member.doc, member.callable, 3);
  };

  for (const member of constructors) {
    heading(writer, 2, 'Constructor', anchors.get(member.name));
    body(member);
  }
  if (properties.length > 0) {
    heading(writer, 2, 'Properties');
    if (properties.some(rich)) {
      for (const member of properties) {
        heading(writer, 3, [inlineCode(member.name)], anchors.get(member.name));
        body(member);
      }
    } else writer.nodes.push(propertyFields(writer, page, properties));
  }
  if (methods.length > 0) {
    heading(writer, 2, 'Methods');
    for (const member of methods) {
      heading(
        writer,
        3,
        [inlineCode(/^[\w$]+$/.test(member.name) ? `${member.name}()` : member.name)],
        anchors.get(member.name),
      );
      body(member);
    }
  }
}

/**
 * Whether a doc tags its name `@advanced`
 * @param doc - The doc
 */
const isAdvanced = (doc: ApiDoc | null): boolean => doc?.tags.some(({ tag }) => tag === 'advanced') ?? false;

/**
 * The file of a page, from `docs/`
 * @param page - The page
 */
const fileOf = (page: SymbolPage): string => `${OUT}/${page.entry.name}/${page.folder}/${page.title}.mdx`;

/**
 * Writes where the Docs section and the examples use a name or an entry, when anything does
 * @param writer - The page
 * @param title - The section's heading
 * @param guides - The pages of the Docs section, with their sections that link it
 * @param examples - The examples that import it
 * @param more - The rest of the examples, in the gallery; null when every one is listed
 */
function usedIn(
  writer: Writer,
  title: string,
  guides: readonly ApiGuideUse[],
  examples: readonly ApiExampleUse[],
  more: ApiUsageProps['more'] = null,
): void {
  if (guides.length === 0 && examples.length === 0) return;

  heading(writer, 2, title);
  writer.nodes.push(ApiUsage({ guides, examples, more }));
}

/**
 * The page of one name. Its tab and search result read `useFrame() · react-pixi-fiber`, since a bare
 * name such as `Canvas` is ambiguous; its heading and sidebar label are the name. A name r3f's core
 * declares says so, and links r3f's own docs, which describe it as it works here.
 * @param site - The model
 * @param page - The page
 * @param position - Its place in its folder
 */
function symbolPage(site: Site, page: SymbolPage, position: number): Page {
  const { entry, symbol, title, augments, route } = page;
  const [file = '', line] = symbol.source.split(':');
  const writer = writerOf(linkerOf(site, entry, route), file, fileOf(page), page.anchors.values());
  const from = packageName(entry);
  const vendored = isVendored(file);
  const summary =
    summaryOf(symbol.doc) ||
    (augments
      ? `Importing ${from} adds these members to ${title} of ${augments}.`
      : vendored
        ? `${title}, from react-three-fiber's core.`
        : `${title}, exported by ${from}.`);

  writer.nodes.push(
    headingNode(1, title),
    ApiMeta({
      kind: page.label,
      importLine: augments
        ? `import '${from}';`
        : `import ${symbol.typeOnly ? 'type ' : ''}{ ${symbol.name} } from '${from}';`,
      source: blobUrl(`${file}#L${line}`),
      sourceLabel: `${file}:${line}`,
      advanced: isAdvanced(symbol.doc),
      vendored,
    }),
    signature(writer, symbol.signature),
    ...[callSignatureOf(symbol)].flatMap((call) => (call ? [signature(writer, call)] : [])),
    ...jsdoc(writer, symbol.doc?.description || summary.replace(from, `\`${from}\``)),
  );
  if (vendored) {
    writer.nodes.push(
      paragraph(
        "react-pixi-fiber runs react-three-fiber's core unchanged, so this works as ",
        link(R3F_DOCS, "react-three-fiber's docs"),
        ' describe it, on pixi-3d objects in place of three.js ones. ',
        link(pageUrl(guidePage('differences')), 'Differences from react-three-fiber'),
        ' lists where the objects behind it differ.',
      ),
    );
  }
  docParts(writer, symbol.doc, symbol.callable, 2);
  usedIn(writer, 'Used in', site.usage.guides.get(route) ?? [], site.usage.examples.get(route) ?? []);
  members(writer, page);

  return {
    output: fileOf(page),
    route,
    fields: {
      title: augments
        ? `${title} · added by ${from}`
        : `${page.folder === 'functions' ? `${title}()` : title} · ${from}`,
      sidebar_label: title,
      sidebar_position: position,
      description: summary.replace(/`/g, ''),
      custom_edit_url: vendored ? null : editUrl(file),
    },
    children: writer.nodes,
  };
}

/**
 * Writes a list of links to names, each with its summary: `Name`, `Name.member`, and the member of
 * an augment as an instance's, `container.layout`
 * @param site - The model
 * @param writer - The page
 * @param names - The names, as `apiLinks` keys them
 */
function pointers(site: ApiModel, writer: Writer, names: readonly string[]): void {
  writer.nodes.push(
    list(
      names.map((name) => {
        const dot = name.lastIndexOf('.');
        const page = site.pages.find((each) => each.symbol.name === name);
        const owner = page ? undefined : site.pages.find((each) => each.symbol.name === name.slice(0, dot));
        const member = owner?.symbol.members.find((each) => each.name === name.slice(dot + 1));
        const doc = page ? page.symbol.doc : member?.doc;
        const route = writer.link(name);

        if (!route || doc === undefined)
          throw new Error(`api: the index or an overview names ${name}, which no entry exports`);

        const shown = owner?.augments
          ? `${owner.title[0]!.toLowerCase()}${owner.title.slice(1)}.${member!.name}`
          : name;

        return [paragraph(link(route, inlineCode(shown)), ': ', ...jsdocLine(writer, summaryOf(doc)))];
      }),
    ),
  );
}

/**
 * The overview of an entry: what it is for, how to import it, and a table per kind of the names it
 * exports, with what each is
 * @param site - The model
 * @param api - The entry's API
 */
function entryPage(site: Site, api: ApiEntry): Page {
  const { entry } = api;
  const name = packageName(entry);
  const route = `/api/${entry.name}/`;
  const file = entryFile(entry, ROOT);
  const writer = writerOf(linkerOf(site, entry, null), file, `${OUT}/${entry.name}/index.mdx`);
  const examples = site.usage.examples.get(route) ?? [];
  const guides = GUIDES.filter((guide) => guide.section !== 'reference').map((guide) => ({
    title: guide.title,
    href: pageUrl(guidePage(guide.id)),
    sections: [],
  }));
  const pages = site.pages.filter((page) => page.entry === entry);
  const { position, summary, related } = ENTRY_INFO[entry.name as EntryName];
  const values = api.symbols.filter((symbol) => !symbol.typeOnly).map((symbol) => symbol.name);
  const listed = (
    title: string,
    rows: readonly SymbolPage[],
    describe: (page: SymbolPage) => PhrasingContent[],
  ): void => {
    if (rows.length === 0) return;
    heading(writer, 2, title);
    writer.nodes.push(
      table(
        ['Name', 'Description', 'From'],
        rows.map((page) => [
          [link(page.route, inlineCode(page.title))],
          [...(isAdvanced(page.symbol.doc) ? [ApiBadge({}, [text('Advanced')]), text(' ')] : []), ...describe(page)],
          [text(isVendored(page.symbol.source) ? 'r3f' : 'react-pixi-fiber')],
        ]),
      ),
    );
  };

  const shown = START_HERE.filter((each) => values.includes(each));

  writer.nodes.push(
    ...jsdoc(writer, summary),
    code(shown.length > 0 ? `import { ${shown.join(', ')} } from '${name}';` : `import '${name}';`, 'ts'),
  );
  if (pages.length === 0) {
    writer.nodes.push(
      paragraph(
        'It exports no names: importing it is what it does. ',
        link('/api/', 'Every entry'),
        ' lists what the others export.',
      ),
    );
  }
  if (related) {
    heading(writer, 2, 'See also');
    pointers(site, writer, related);
  }
  usedIn(
    writer,
    'Guides and examples',
    guides,
    examples.slice(0, ENTRY_EXAMPLES),
    examples.length > ENTRY_EXAMPLES ? { count: examples.length, href: '/examples/' } : null,
  );
  for (const { folder, title } of KINDS) {
    listed(
      title,
      pages.filter((page) => page.folder === folder),
      (page) => jsdocLine(writer, summaryOf(page.symbol.doc)),
    );
  }

  const augmented = pages.filter((page) => page.augments !== null);
  const owners = [...new Set(augmented.map((page) => page.augments))];

  listed(owners.length === 1 ? `Added to ${owners[0]}` : 'Added to other packages', augmented, (page) =>
    page.symbol.members
      .slice(0, 12)
      .flatMap(({ name: member }, index) => [
        ...(index > 0 ? [text(', ')] : []),
        link(`${page.route}#${page.anchors.get(member)}`, inlineCode(member)),
      ]),
  );

  return {
    output: `${OUT}/${entry.name}/index.mdx`,
    route,
    fields: {
      title: name,
      sidebar_label: name,
      sidebar_position: position,
      description: summary.replace(/`/g, ''),
      custom_edit_url: editUrl(file),
    },
    children: writer.nodes,
  };
}

/**
 * The index of the section: every entry, and the names to start with
 * @param site - The model
 */
function indexPage(site: ApiModel): Page {
  const writer = writerOf(linkerOf(site, MAIN, null), entryFile(MAIN, ROOT), `${OUT}/index.mdx`);
  const info = (api: ApiEntry): (typeof ENTRY_INFO)[EntryName] => ENTRY_INFO[api.entry.name as EntryName];
  const entries = [...site.apis]
    .sort((a, b) => info(a).position - info(b).position)
    .map((api) => ({
      name: packageName(api.entry),
      href: `/api/${api.entry.name}/`,
      summary: info(api).summary,
      count:
        api.symbols.length === 0
          ? 'Side effects only'
          : `${api.symbols.length} export${api.symbols.length === 1 ? '' : 's'}`,
    }));

  const vendored = site.pages.filter((each) => isVendored(each.symbol.source)).length;

  writer.nodes.push(
    paragraph(
      'Every name ',
      inlineCode(packageName(MAIN)),
      ' exports, read from its source and JSDoc. ',
      ...(vendored > 0
        ? [
            `${vendored} of them come from react-three-fiber's core, which runs unchanged, so `,
            link(R3F_DOCS, "react-three-fiber's docs"),
            ' describe them too. ',
          ]
        : []),
      'A name marked ',
      ApiBadge({}, [text('Advanced')]),
      " is for integrations and tuning; typical code doesn't need it.",
    ),
    ApiEntries({ entries }),
  );

  const start = START_HERE.filter((name) => writer.link(name) !== null);

  if (start.length > 0) {
    heading(writer, 2, 'Where to start');
    pointers(site, writer, start);
  } else {
    heading(writer, 2, 'Where to start');
    writer.nodes.push(
      paragraph(
        'The entry exports none of the names to start with yet: ',
        ...START_HERE.flatMap((name, index) => [...(index > 0 ? [text(', ')] : []), inlineCode(name)]),
        ". Until it does, react-three-fiber's docs describe them.",
      ),
    );
  }

  return {
    output: `${OUT}/index.mdx`,
    route: '/api/',
    fields: {
      title: 'API reference',
      sidebar_label: 'Overview',
      sidebar_position: 0,
      description:
        'Every name react-pixi-fiber exports, read from its source and JSDoc: the hooks, the components and the types.',
      custom_edit_url: null,
    },
    children: writer.nodes,
  };
}

/**
 * Where the Docs section and the examples use each page of the section. A page of the Docs section
 * uses the names it links, each under the `##` the link sits in; a link above the first leaves the list
 * of sections empty, which lists the page alone. An example uses what it imports from the package.
 * @param shared - The values of the sync: the model, the pages of the Docs section and the examples
 */
async function usageOf(shared: Shared): Promise<Usage> {
  const site = shared(apiModel);
  const routes = new Set(site.pages.map(({ route }) => route));
  const guideOrder = GUIDES.map(({ id }) => pageUrl(guidePage(id)));
  const rank = (href: string): number => (guideOrder.includes(href) ? guideOrder.indexOf(href) : guideOrder.length);
  const guides = new Map<string, ApiGuideUse[]>();
  const examples = new Map<string, ApiExampleUse[]>();
  const docs = shared(docsPages);
  const pictures = await shared(examplePictures);
  const programs = shared(examplePrograms);

  for (const { route: href, fields, children } of [...docs].sort((a, b) => rank(a.route) - rank(b.route))) {
    const mentions = new Map<string, ApiGuideUse['sections'][number][]>();

    for (const { url, section } of sectionLinks(children)) {
      const [route = ''] = url.split('#');
      const sections = mentions.get(route) ?? [];
      const use = section && { title: section.title, href: `${href}#${section.id}` };

      if (!routes.has(route)) continue;
      mentions.set(route, sections);
      if (use && !sections.some((each) => each.href === use.href)) sections.push(use);
    }
    for (const [route, sections] of mentions) {
      guides.set(route, [...(guides.get(route) ?? []), { title: fields.title, href, sections }]);
    }
  }
  for (const { id } of shared(listExamples)) {
    const example = { id, thumbnail: pictures.get(id)?.thumbnail ?? null };
    const add = (route: string): void => {
      const listed = examples.get(route) ?? [];

      if (!listed.includes(example)) examples.set(route, [...listed, example]);
    };

    for (const { from, names } of programs.get(id)!.packageImports) {
      const entry = ENTRIES.find((each) => packageName(each) === from);

      if (!entry) continue;
      add(`/api/${entry.name}/`);
      for (const name of names) {
        const page = site.pages.find((each) => each.entry === entry && each.symbol.name === name);

        if (page) add(page.route);
      }
    }
  }

  return { guides, examples };
}

/** The API section: an index, an overview per entry and a page per public name */
export const api: Generator = {
  name: 'api',
  outputs: [OUT, 'llms/api'],
  sources: ['src', 'docs/scripts/typedoc', 'examples', 'tests/snapshots/docs', 'tsconfig.json'],
  generate: async (shared) => {
    const site: Site = { ...shared(apiModel), usage: await usageOf(shared) };
    const files: GeneratedFiles = writePage(indexPage(site));

    for (const entry of site.apis) {
      const folder = `${OUT}/${entry.entry.name}`;
      const pages = site.pages.filter((page) => page.entry === entry.entry);

      Object.assign(files, writePage(entryPage(site, entry)));
      [...KINDS.map(({ folder: kind, title }) => ({ kind, title })), { kind: AUGMENTS, title: '' }].forEach(
        ({ kind, title }, position) => {
          const listed = pages.filter((page) => page.folder === kind);

          if (listed.length === 0) return;
          files[`${folder}/${kind}/_category_.json`] = categoryJson(title || listed[0]!.label, position + 1);
          listed.forEach((page, index) => Object.assign(files, writePage(symbolPage(site, page, index + 1))));
        },
      );
    }

    return files;
  },
};

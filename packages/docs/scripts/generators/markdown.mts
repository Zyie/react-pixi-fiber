/**
 * How the generators read and write Markdown. A doc of the repo is parsed once, into an mdast tree
 * (`parseMarkdown`), and a page is a tree too: nodes of the docs it is made from beside nodes the
 * generator makes, the site's components among them (`component`). `writePage` writes that tree twice:
 * as the page's MDX, with the imports of the components in it, and as the plain Markdown of the page
 * that `plugins/llms` serves to language models, where each component is the Markdown of what it shows.
 */
import fs from 'node:fs';
import path from 'node:path';

import { createSlugger } from '@docusaurus/utils';
import type {
  BlockContent,
  Code,
  DefinitionContent,
  Heading,
  InlineCode,
  Link,
  List,
  Nodes,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Table,
  Text,
} from 'mdast';
import { directiveToMarkdown } from 'mdast-util-directive';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm';
import { mdxToMarkdown } from 'mdast-util-mdx';
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import { toMarkdown } from 'mdast-util-to-markdown';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';
import { SKIP, visit } from 'unist-util-visit';

import { blobUrl, SITE_URL } from '../../links/index.ts';
import { markdownFile, markdownRoute } from '../../plugins/llms/paths.mts';
import { ROOT } from '../paths.mts';
import type { GeneratedFiles } from '../sync.mts';

/** A node that stands in a page's flow: a paragraph, a list, a code block, a component */
export type Flow = BlockContent | DefinitionContent;

/** What a page's front matter can hold; a value left undefined is left out */
export type FrontMatter = Readonly<Record<string, string | number | boolean | readonly string[] | null | undefined>>;

/** A page of the site, before it is written */
export interface Page {
  /** Its MDX file, from `docs/`: `content/docs/guides/flow.mdx` */
  readonly output: string;
  /** Its URL from the site's root, with the trailing slash */
  readonly route: string;
  /** Its front matter; `title` is its heading in the Markdown for language models when its body has none */
  readonly fields: FrontMatter & { readonly title: string };
  readonly children: readonly Flow[];
}

/** A component of the site, as the generators write it */
interface Component {
  readonly name: string;
  /** The module a page imports it from; null for one every page has without an import */
  readonly from: string | null;
  /** Whether it is the module's default export */
  readonly isDefault: boolean;
  /** What it shows, as Markdown; its children when it has no form of its own */
  readonly markdown: ((props: never, children: Nodes[]) => Nodes[]) | null;
}

/** How a component reads in a page's MDX and in its Markdown */
interface ComponentOptions<Props> {
  /** The module a page imports it from; null for one every page has without an import */
  readonly from: string | null;
  /** Whether it is the module's default export */
  readonly isDefault?: boolean;
  /**
   * What it shows, as Markdown for language models; without it, its children stand in its place
   * @param props - Its props
   * @param children - Its children, as Markdown
   */
  readonly markdown?: (props: Props, children: Nodes[]) => Nodes[];
}

/** The component and props of each element a generator made */
const ELEMENTS = new WeakMap<object, { component: Component; props: object }>();

/**
 * The attributes of an element from its props: `true` as the bare name, a string as written, and any
 * other value as the JSON of it, which MDX reads as an expression. A string with a line break, a `"` or
 * an `&` is JSON too: MDX would read an entity in it, and a line break would be indented with the element.
 * @param props - The props; undefined, null and false ones are left out
 */
function attributes(props: object): MdxJsxAttribute[] {
  return Object.entries(props).flatMap(([name, value]): MdxJsxAttribute[] => {
    if (value === undefined || value === null || value === false) return [];
    if (value === true) return [{ type: 'mdxJsxAttribute', name }];
    if (typeof value === 'string' && !/["&\n]/.test(value)) return [{ type: 'mdxJsxAttribute', name, value }];

    return [
      {
        type: 'mdxJsxAttribute',
        name,
        value: { type: 'mdxJsxAttributeValueExpression', value: JSON.stringify(value) },
      },
    ];
  });
}

/**
 * The component a generator writes by a name
 * @param name - Its name in MDX
 * @param options - Where it is imported from, and how it reads as Markdown
 */
function componentOf<Props>(name: string, options: ComponentOptions<Props>): Component {
  return {
    name,
    from: options.from,
    isDefault: options.isDefault ?? false,
    markdown: (options.markdown as Component['markdown']) ?? null,
  };
}

/**
 * A component that stands in a page's flow, as a function that makes an element of it
 * @param name - Its name in MDX
 * @param options - Where it is imported from, and how it reads as Markdown
 */
export function component<Props extends object>(
  name: string,
  options: ComponentOptions<Props>,
): (props: Props, children?: readonly Flow[]) => MdxJsxFlowElement {
  const made = componentOf(name, options);

  return (props, children = []) => {
    const element: MdxJsxFlowElement = {
      type: 'mdxJsxFlowElement',
      name,
      attributes: attributes(props),
      children: [...children],
    };

    ELEMENTS.set(element, { component: made, props });

    return element;
  };
}

/**
 * A component that sits in a line of text, as a function that makes an element of it
 * @param name - Its name in MDX
 * @param options - Where it is imported from, and how it reads as Markdown
 */
export function inlineComponent<Props extends object>(
  name: string,
  options: ComponentOptions<Props>,
): (props: Props, children?: readonly PhrasingContent[]) => MdxJsxTextElement {
  const made = componentOf(name, options);

  return (props, children = []) => {
    const element: MdxJsxTextElement = {
      type: 'mdxJsxTextElement',
      name,
      attributes: attributes(props),
      children: [...children],
    };

    ELEMENTS.set(element, { component: made, props });

    return element;
  };
}

/**
 * A Markdown doc as a tree, with GitHub's tables, strikethrough and autolinks
 * @param markdown - The doc's text
 */
export function parseMarkdown(markdown: string): Root {
  return fromMarkdown(markdown, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
}

/**
 * The docs of the repo, each parsed the first time a generator of a sync asks for it. The trees are
 * shared, so a caller copies what it changes.
 * @returns The tree of a doc, by its path from the repo root
 */
export function parsedDocs(): (file: string) => Root {
  const docs = new Map<string, Root>();

  return (file) => {
    const parsed = docs.get(file) ?? parseMarkdown(fs.readFileSync(path.join(ROOT, file), 'utf8'));

    docs.set(file, parsed);

    return parsed;
  };
}

/**
 * A text node
 * @param value - The text
 */
export const text = (value: string): Text => ({ type: 'text', value });

/**
 * A code span
 * @param value - The code
 */
export const inlineCode = (value: string): InlineCode => ({ type: 'inlineCode', value });

/**
 * A paragraph
 * @param children - Its content; a string is text
 */
export function paragraph(...children: readonly (PhrasingContent | string)[]): Paragraph {
  return { type: 'paragraph', children: children.map((child) => (typeof child === 'string' ? text(child) : child)) };
}

/**
 * A link
 * @param url - Where it goes
 * @param children - Its content; a string is text
 */
export function link(url: string, ...children: readonly (Link['children'][number] | string)[]): Link {
  return { type: 'link', url, children: children.map((child) => (typeof child === 'string' ? text(child) : child)) };
}

/**
 * A heading. With an id, it ends in the comment Docusaurus reads the id from, in place of a slug of
 * its text.
 * @param depth - Its level
 * @param children - Its content; a string is text
 * @param id - Its id
 */
export function heading(depth: Heading['depth'], children: readonly PhrasingContent[] | string, id?: string): Heading {
  const content = typeof children === 'string' ? [text(children)] : [...children];

  return {
    type: 'heading',
    depth,
    children:
      id === undefined ? content : [...content, text(' '), { type: 'mdxTextExpression', value: `/* #${id} */` }],
  };
}

/**
 * A code block
 * @param value - The code
 * @param lang - Its language
 * @param meta - The rest of its info string, such as `title="a.ts"`
 */
export const code = (value: string, lang: string, meta?: string): Code => ({ type: 'code', lang, meta, value });

/**
 * A tight bullet list
 * @param items - The content of each item
 */
export function list(items: readonly (readonly Flow[])[]): List {
  return {
    type: 'list',
    ordered: false,
    spread: false,
    children: items.map((children) => ({ type: 'listItem', spread: false, children: [...children] })),
  };
}

/**
 * A table
 * @param head - The cells of its header row; a string is text
 * @param rows - The cells of each row
 */
export function table(head: readonly string[], rows: readonly (readonly PhrasingContent[][])[]): Table {
  return {
    type: 'table',
    children: [head.map((cell) => [text(cell)]), ...rows].map((cells) => ({
      type: 'tableRow',
      children: cells.map((children) => ({ type: 'tableCell', children: [...children] })),
    })),
  };
}

/**
 * Nodes under a root, for the functions that take a tree
 * @param children - The nodes
 */
const rootOf = (children: readonly Nodes[]): Root => ({ type: 'root', children: children as RootContent[] });

/**
 * The text of nodes as a reader sees it, on one line: no marks, a link by its text, an image by its
 * alt, and a space between one paragraph, list item or table cell and the next
 * @param nodes - The nodes
 */
export function plainText(nodes: Nodes | readonly Nodes[]): string {
  const blocks: string[] = [];

  visit(rootOf([nodes].flat() as Nodes[]), (node) => {
    if (node.type !== 'paragraph' && node.type !== 'heading' && node.type !== 'tableCell') return undefined;
    blocks.push(toString(node));

    return SKIP;
  });

  return (blocks.length > 0 ? blocks.join(' ') : toString(nodes)).replace(/\s+/g, ' ').trim();
}

/**
 * The id of a heading that says its own, in the comment `heading` ends it with
 * @param node - The heading
 */
function explicitId(node: Heading): string | undefined {
  const last = node.children.at(-1);

  return last?.type === 'mdxTextExpression' ? /^\/\*\s*#(\S+)\s*\*\/$/.exec(last.value)?.[1] : undefined;
}

/**
 * The title of a heading: its text, without the comment that says its id
 * @param node - The heading
 */
function headingTitle(node: Heading): string {
  return plainText(node.children.filter((child) => child.type !== 'mdxTextExpression'));
}

/** A `##` section of a page: its title, and its id as Docusaurus gives it */
interface Section {
  readonly title: string;
  readonly id: string;
}

/**
 * The id Docusaurus gives each heading of a page, in order: its own, or the slug of its text, numbered
 * when a heading before it on the page has the same
 * @param children - The page
 */
export function headingIds(children: readonly Nodes[]): Map<Heading, string> {
  const slugger = createSlugger();
  const ids = new Map<Heading, string>();

  visit(rootOf(children), 'heading', (node) => {
    ids.set(node, explicitId(node) ?? slugger.slug(headingTitle(node)));
  });

  return ids;
}

/**
 * Every link of a page outside its headings, with the `##` section it is in; null above the first
 * @param children - The page
 */
export function sectionLinks(children: readonly Nodes[]): { url: string; section: Section | null }[] {
  const ids = headingIds(children);
  const links: { url: string; section: Section | null }[] = [];
  let section: Section | null = null;

  visit(rootOf(children), (node) => {
    if (node.type === 'heading') {
      if (node.depth === 2) section = { title: headingTitle(node), id: ids.get(node)! };

      return SKIP;
    }
    if (node.type === 'link') links.push({ url: node.url, section });

    return undefined;
  });

  return links;
}

/**
 * The import lines of the components in a page, a line per module
 * @param children - The page
 */
function imports(children: readonly Nodes[]): string[] {
  const named = new Map<string, Set<string>>();
  const lines = new Set<string>();

  visit(rootOf(children), (node) => {
    const made = ELEMENTS.get(node)?.component;

    if (!made?.from) return;
    if (made.isDefault) lines.add(`import ${made.name} from '${made.from}';`);
    else named.set(made.from, (named.get(made.from) ?? new Set()).add(made.name));
  });
  for (const [from, names] of named) lines.add(`import { ${[...names].sort().join(', ')} } from '${from}';`);

  return [...lines].sort();
}

/**
 * Nodes as MDX: `{` and `<` in prose are escaped, and a link is always written out, since MDX has no
 * `<https://...>` form
 * @param children - The nodes
 */
export function writeMdx(children: readonly Nodes[]): string {
  return toMarkdown(rootOf(children), {
    extensions: [gfmToMarkdown({ tablePipeAlign: false }), mdxToMarkdown(), directiveToMarkdown()],
    bullet: '-',
    rule: '-',
    resourceLink: true,
  }).trimEnd();
}

/**
 * A link's target as an absolute URL, for a reader outside the site
 * @param url - The target as the page has it: a URL, a path of the site, an anchor of the page, or the
 *   path of a file of the repo from the page's file
 * @param page - The page it is on
 */
function absoluteUrl(url: string, page: Page): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  if (url.startsWith('#')) return `${SITE_URL}${page.route}${url}`;
  if (url.startsWith('/')) return SITE_URL + url;

  return blobUrl(path.posix.normalize(path.posix.join('docs', path.posix.dirname(page.output), url)));
}

/**
 * Nodes as plain Markdown: each component as the Markdown of what it shows, no heading ids, an
 * admonition as a quote under its label
 * @param nodes - The nodes
 */
function withoutComponents(nodes: readonly Nodes[]): Nodes[] {
  return nodes.flatMap((node): Nodes[] => {
    const element = ELEMENTS.get(node);
    const children = 'children' in node ? withoutComponents(node.children) : [];

    if (element) return element.component.markdown?.(element.props as never, children) ?? children;
    if (node.type === 'heading') {
      const content = (children as PhrasingContent[]).filter((child) => child.type !== 'mdxTextExpression');

      if (content.length < children.length && content.at(-1)?.type === 'text') content.pop();

      return [{ ...node, children: content }];
    }
    if (node.type === 'containerDirective') return [{ type: 'blockquote', children: children as BlockContent[] }];
    if (node.type === 'paragraph' && node.data && 'directiveLabel' in node.data) {
      return [paragraph({ type: 'strong', children: children as PhrasingContent[] })];
    }

    return ['children' in node ? ({ ...node, children } as Nodes) : { ...node }];
  });
}

/**
 * A page as plain Markdown for language models: its heading, its URL, then its content with every link
 * absolute
 * @param page - The page
 */
function toPlainMarkdown(page: Page): string {
  const [first, ...rest] = withoutComponents(page.children);
  const titled = first?.type === 'heading' && first.depth === 1;
  const body = titled || !first ? rest : [first, ...rest];

  visit(rootOf(body), (node) => {
    if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
      node.url = absoluteUrl(node.url, page);
    }
  });

  const title = titled ? toMarkdown(first, { extensions: [gfmToMarkdown()] }).trim() : `# ${page.fields.title}`;
  const markdown = toMarkdown(rootOf(body), {
    extensions: [gfmToMarkdown({ tablePipeAlign: false })],
    bullet: '-',
    rule: '-',
  });

  return `${title}\n\nSource: ${SITE_URL}${page.route}\n\n${markdown.trim()}\n`;
}

/** The `<head>` of a page, which Docusaurus merges into the document's */
const Head = component<object>('head', { from: null });
const HeadLink = component<{ rel: string; type: string; href: string }>('link', { from: null });

/**
 * The files of a page: its MDX, which names its Markdown in a `<link rel="alternate">`, and that
 * Markdown
 * @param page - The page
 */
export function writePage(page: Page): GeneratedFiles {
  const fields = Object.entries(page.fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  const body = [
    ...page.children,
    Head({}, [HeadLink({ rel: 'alternate', type: 'text/markdown', href: markdownRoute(page.route) })]),
  ];
  const lines = imports(body);

  return {
    [page.output]: ['---', ...fields, '---', '', ...(lines.length > 0 ? [...lines, ''] : []), writeMdx(body), ''].join(
      '\n',
    ),
    [markdownFile(page.output)]: toPlainMarkdown(page),
  };
}

/**
 * The `_category_.json` of a folder of pages
 * @param label - Its label in the sidebar
 * @param position - Its place among its siblings
 */
export function categoryJson(label: string, position: number): string {
  return `${JSON.stringify({ label, position, collapsed: true }, null, 2)}\n`;
}

/**
 * Turns a Markdown doc of the repo (a guide or a JSDoc block) into the nodes of a page of the site. The
 * doc is parsed once and the prose stays as written; what changes is how it is wired into the site:
 *
 * - A snippet's code block followed by the picture of its example becomes `<Example>`, which shows
 *   both and runs the example. A snippet with no picture after it stays a code block, titled with its
 *   file's name as `<Example>` is, and a snippet of an example links the page that runs all of it.
 * - A link to a doc that is a page of the site goes to that page, and reads as the page's title where
 *   its text is the doc's file name. A link to another file of the repo goes to GitHub, and an image to
 *   the file in the repo, which the bundler copies.
 * - The first mention of a public name in each section links its API reference, written alone, called
 *   or, for a style property, declared: `flexWrap: 'wrap'`.
 * - HTML comments go, any other HTML reads as the text it is, since MDX would take it for JSX, and a
 *   GitHub alert (`> [!NOTE]`) becomes an admonition.
 */
import path from 'node:path';

import type { Blockquote, Nodes, Paragraph, PhrasingContent, Root } from 'mdast';
import type { ContainerDirective } from 'mdast-util-directive';
import { SKIP, visitParents } from 'unist-util-visit-parents';

import { blobUrl } from '../../../links/index.ts';
import { exampleId, referencePicture } from '../../../plugins/example/catalogue.mts';
import { MARKER } from '../../typedoc/snippets.mts';
import { Example, RunExample } from '../components.mts';
import type { Flow } from '../markdown.mts';
import { link, paragraph, parseMarkdown, plainText, text } from '../markdown.mts';
import { pageOf, titleOf } from './sidebar.mts';

/** How one doc is turned into a page */
export interface DocContext {
  /** The doc's path from the repo root, which its relative links start from */
  readonly source: string;
  /** The page's path from `docs/`, which the paths of its images start from */
  readonly output: string;
  /**
   * Where the names the page may link go, such as a public name to its API reference; a map, or the
   * API reference's lookup of a name from one of its pages. A key ending in `:` links the name only
   * where a code span declares it, as in `position: 'absolute'`, for a style property whose bare name
   * may be something else, such as Pixi's `position`.
   */
  readonly names: Pick<ReadonlyMap<string, string>, 'get'>;
  /** Whether the page quotes the doc and isn't the doc's own, so a link to an anchor of the doc leaves the page */
  readonly quoted?: boolean;
}

const COMMENT = /^<!--[\s\S]*-->$/;
const ALERT = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][^\S\n]*(?:\n|$)/;
const ADMONITION: Record<string, string> = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'info',
  WARNING: 'warning',
  CAUTION: 'danger',
};
/** A code span that declares a property, `name: value`, by the property's name */
const DECLARATION = /^([\w$]+):\s*\S/;

/**
 * The path from the repo root of the file a relative link of a doc goes to, and its anchor
 * @param href - The link as written
 * @param context - The doc
 * @returns Null for a link that isn't relative
 */
function linkedFile(href: string, context: DocContext): { file: string; anchor: string } | null {
  if (href.startsWith('#') && context.quoted) return { file: context.source, anchor: href.slice(1) };
  if (/^[a-z][\w+.-]*:/i.test(href) || href.startsWith('#') || href.startsWith('/')) return null;

  const [file = '', anchor = ''] = href.split('#');

  return {
    file: path.posix.normalize(path.posix.join(path.posix.dirname(context.source), file)).replace(/\/$/, ''),
    anchor,
  };
}

/**
 * Where an image of a doc is, from the page: the file in the repo, which the bundler copies
 * @param src - The image as written
 * @param context - The doc
 */
function mapImage(src: string, context: DocContext): string {
  const linked = linkedFile(src, context);

  if (!linked) return src;

  const fromPage = path.posix.relative(path.posix.dirname(`docs/${context.output}`), linked.file);

  return fromPage.startsWith('.') ? fromPage : `./${fromPage}`;
}

/**
 * The name a code span may link by: the code itself, without `()` after a name, without the arguments
 * of a call of a plain name, as in `flushLayout(node)`, or without the value of a declaration, as in
 * `alignItems: 'center'`. A member call with arguments keeps them, since `layout.flush(container)` may
 * be the layout system's and not a node's.
 * @param code - The code span's text
 */
function nameOf(code: string): string {
  return DECLARATION.exec(code)?.[1] ?? code.replace(/\(\)$/, '').replace(/^([\w$]+)\(.*\)$/, '$1');
}

/**
 * The title of a snippet's code block: the file's name, as `<Example>` titles its example
 * @param file - The snippet's file, from the repo root
 */
function snippetTitle(file: string): string {
  return path.posix.basename(file);
}

/**
 * The alt text of the picture of an example, when a node is that picture alone: an image of the
 * reference picture of the visual test of `file`
 * @param node - The node after a snippet's code block
 * @param file - The snippet's file, from the repo root
 * @param context - The doc
 */
function pictureAlt(node: Nodes | undefined, file: string, context: DocContext): string | null {
  const image = node?.type === 'paragraph' && node.children.length === 1 ? node.children[0]! : null;
  const id = exampleId(file);

  if (image?.type !== 'image' || id === null) return null;

  return linkedFile(image.url, context)?.file === referencePicture(id) ? (image.alt ?? '') : null;
}

/**
 * A GitHub alert as an admonition
 * @param quote - A block quote
 * @returns Null when the quote isn't an alert
 */
function admonition(quote: Blockquote): ContainerDirective | null {
  const [first, ...rest] = quote.children;
  const opening = first?.type === 'paragraph' && first.children[0]?.type === 'text' ? first.children[0] : null;
  const alert = opening && ALERT.exec(opening.value);

  if (!opening || !alert || first?.type !== 'paragraph') return null;

  const body: Paragraph = {
    ...first,
    children: [text(opening.value.slice(alert[0].length)), ...first.children.slice(1)].filter(
      (child) => child.type !== 'text' || child.value,
    ),
  };

  return {
    type: 'containerDirective',
    name: ADMONITION[alert[1]!]!,
    children: [...(body.children.length > 0 ? [body] : []), ...rest],
  };
}

/**
 * The blocks of a doc as the page has them: snippets as examples or titled code, no comments, alerts
 * as admonitions
 * @param children - The blocks of the doc, or of a list item or quote of it
 * @param context - The doc
 */
function blocks(children: readonly Nodes[], context: DocContext): Nodes[] {
  const out: Nodes[] = [];
  let snippet: { file: string; region: string | undefined } | null = null;

  for (let i = 0; i < children.length; i++) {
    const node = children[i]!;

    if (node.type === 'html' && COMMENT.test(node.value.trim())) {
      const marker = MARKER.exec(node.value.trim());

      if (marker) snippet = { file: marker[1]!, region: marker[2] };
    } else if (node.type === 'code' && snippet) {
      const { file, region } = snippet;
      const alt = pictureAlt(children[i + 1], file, context);
      const title = snippetTitle(file);
      const id = exampleId(file);

      snippet = null;
      if (alt !== null) {
        out.push(Example({ file, region, alt }));
        i++;
        continue;
      }

      node.meta = [node.meta, `title="${title}"`].filter(Boolean).join(' ');
      out.push(node);
      if (id !== null) out.push(RunExample({ to: `/examples/${id}/`, file: title }));
    } else {
      if (node.type === 'html') out.push(paragraph(node.value));
      else if (node.type === 'blockquote') {
        node.children = blocks(node.children, context) as Blockquote['children'];
        out.push(admonition(node) ?? node);
      } else {
        if (node.type === 'list' || node.type === 'listItem') {
          node.children = blocks(node.children, context) as never;
        }
        out.push(node);
      }
    }
  }

  return out;
}

/**
 * Wires the prose of a doc into the site, in place: its links and images, the HTML in its lines, and
 * the names it may link
 * @param children - The blocks of the doc
 * @param context - The doc
 */
function prose(children: Nodes[], context: DocContext): void {
  /** The names linked in the current section, which aren't linked again until the next `##` */
  const linked = new Set<string>();

  visitParents({ type: 'root', children } as Root, (node, ancestors) => {
    const parent = ancestors.at(-1);

    if (!parent) return undefined;

    const index = parent.children.indexOf(node as never);

    if (node.type === 'heading' && node.depth === 2) linked.clear();
    if (node.type === 'image') node.url = mapImage(node.url, context);
    if (node.type === 'html') {
      parent.children.splice(index, 1, ...(COMMENT.test(node.value) ? [] : [text(node.value)]));

      return [SKIP, index];
    }
    if (node.type === 'link') {
      const target = linkedFile(node.url, context);
      const title = target && plainText(node) === path.posix.basename(target.file) ? titleOf(target.file) : null;

      if (target) {
        const { file, anchor } = target;

        node.url = pageOf(file, anchor) ?? blobUrl(`${file}${anchor ? `#${anchor}` : ''}`);
      }
      if (title !== null) node.children = [text(title)];
    }
    if (node.type === 'inlineCode' && !ancestors.some(({ type }) => type === 'heading' || type === 'link')) {
      const name = nameOf(node.value);
      const url = context.names.get(name) ?? (DECLARATION.test(node.value) ? context.names.get(`${name}:`) : undefined);

      if (url && !linked.has(name)) {
        linked.add(name);
        parent.children[index] = link(url, node);
      }
    }

    return undefined;
  });
}

/**
 * A doc of the repo, or some nodes of one, as the nodes of its page
 * @param source - The doc's Markdown, or nodes of it, which are left as they are
 * @param context - Where it comes from and goes, and the names it may link
 */
export function docNodes(source: string | readonly Nodes[], context: DocContext): Flow[] {
  const children = blocks(
    typeof source === 'string' ? parseMarkdown(source).children : structuredClone(source),
    context,
  );

  prose(children, context);

  return children as Flow[];
}

/**
 * One line of a doc's prose as the nodes of a line of its page
 * @param line - The line, as Markdown
 * @param context - Where it comes from and goes, and the names it may link
 * @throws When the Markdown is more than a line of prose, such as a list
 */
export function inlineNodes(line: string, context: DocContext): PhrasingContent[] {
  const children = docNodes(line, context);
  const [only] = children;

  if (children.length === 0) return [];
  if (children.length !== 1 || only?.type !== 'paragraph') {
    throw new Error(`${context.source}: "${line}" is not one line of prose`);
  }

  return only.children;
}

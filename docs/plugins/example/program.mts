/**
 * Reads an example file as the site shows and runs it. The file is the program: the reader sees it as
 * written, less its `// #region` markers, and the live frame imports it and mounts its `example` export
 * (`src/components/Live/frame/mount.tsx`). What the guides and the gallery say about an example that no
 * guide shows is read here too: the JSDoc above `export const example`, and a `title` or `description`
 * string in its object.
 */
import { parseSync } from 'rolldown/utils';

import { REGION } from '../../scripts/typedoc/snippets.mts';

/** An example file, read */
export interface Program {
  /** The file's source, TypeScript or TSX, without region markers */
  readonly code: string;
  /** For each `// #region` of the file, the lines of `code` it covers: 1-based, inclusive ranges */
  readonly regions: Readonly<Record<string, readonly (readonly [number, number])[]>>;
  /** Imports of other files the program needs at run time, as written, such as `./theme.css?raw` */
  readonly relativeImports: readonly string[];
  /** What the file imports from packages: each module, with the names it takes from it */
  readonly packageImports: readonly { readonly from: string; readonly names: readonly string[] }[];
  /** The example's title, from a `title` string in its object; null when it has none */
  readonly title: string | null;
  /** What it shows: a `description` string in its object, else the JSDoc above it; null for neither */
  readonly description: string | null;
}

/** The part of an ESTree node the reader reads */
interface Node {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

/**
 * A node's child node, or null
 * @param node - The node
 * @param key - The child's key
 */
function child(node: Node | null | undefined, key: string): Node | null {
  const value = node?.[key];

  return value && typeof value === 'object' && 'type' in value ? (value as Node) : null;
}

/**
 * A node's list of child nodes
 * @param node - The node
 * @param key - The list's key
 */
function children(node: Node | null | undefined, key: string): Node[] {
  const value = node?.[key];

  return Array.isArray(value) ? (value as Node[]) : [];
}

/**
 * The name an identifier or the text a string literal holds, or null
 * @param node - The node
 */
function nameOf(node: Node | null): string | null {
  if (node?.type === 'Identifier') return node.name as string;
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;

  return null;
}

/** An import of the examples' harness, `../example`, which is the test's and not the reader's */
const HARNESS_IMPORT = /^(?:\.\.?\/)+(?:examples\/)?example$/;

/**
 * Reads an example file
 * @param source - The file's text
 * @param file - Its path, for errors; `.tsx` parses JSX
 */
export function toProgram(source: string, file: string): Program {
  const lines = source.split('\n');
  const kept: number[] = [];
  const regionsOf: string[][] = [];
  const open: string[] = [];

  lines.forEach((text, i) => {
    const marker = REGION.exec(text);

    if (!marker) {
      kept.push(i);
      regionsOf.push([...open]);

      return;
    }
    if (marker[1] === 'region') open.push(marker[2] ?? '');
    else open.splice(marker[2] && open.includes(marker[2]) ? open.lastIndexOf(marker[2]) : open.length - 1, 1);
  });

  const regions: Record<string, [number, number][]> = {};

  regionsOf.forEach((names, i) => {
    for (const name of names) {
      const ranges = (regions[name] ??= []);
      const last = ranges.at(-1);

      if (last && last[1] === i) last[1] = i + 1;
      else ranges.push([i + 1, i + 1]);
    }
  });

  const parsed = parseSync(file, source, { lang: file.endsWith('.tsx') ? 'tsx' : 'ts', sourceType: 'module' });

  if (parsed.errors.some((error) => error.severity === 'Error')) {
    throw new Error(`${file}: ${parsed.errors[0]!.message}`);
  }

  const body = children(parsed.program as unknown as Node, 'body');
  const relativeImports: string[] = [];
  const packageImports: { from: string; names: string[] }[] = [];

  for (const declaration of body.filter((node) => node.type === 'ImportDeclaration')) {
    const from = nameOf(child(declaration, 'source'))!;
    const specifiers = children(declaration, 'specifiers');
    const typeOnly =
      declaration.importKind === 'type' ||
      (specifiers.length > 0 && specifiers.every((specifier) => specifier.importKind === 'type'));

    if (from.startsWith('.')) {
      if (!typeOnly && !HARNESS_IMPORT.test(from)) relativeImports.push(from);
      continue;
    }
    packageImports.push({
      from,
      names: specifiers.flatMap((specifier) => nameOf(child(specifier, 'imported')) ?? []),
    });
  }

  const exported = body.find(
    (node) =>
      node.type === 'ExportNamedDeclaration' &&
      nameOf(child(children(child(node, 'declaration'), 'declarations')[0], 'id')) === 'example',
  );
  const object = child(children(child(exported, 'declaration'), 'declarations')[0], 'init');
  const property = (key: string): string | null => {
    const found = children(object, 'properties').find((node) => nameOf(child(node, 'key')) === key);
    const value = child(found, 'value');

    return value?.type === 'Literal' && typeof value.value === 'string' ? value.value : null;
  };
  const jsdoc = exported
    ? parsed.comments
        .filter((comment) => comment.type === 'Block' && comment.value.startsWith('*') && comment.end <= exported.start)
        .find((comment) => !source.slice(comment.end, exported.start).trim())
    : undefined;
  const described = jsdoc?.value
    .slice(1)
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .filter((line) => !line.trimStart().startsWith('@'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    code: `${kept
      .map((i) => lines[i]!)
      .join('\n')
      .trimEnd()}\n`,
    regions,
    relativeImports,
    packageImports,
    title: property('title'),
    description: property('description') ?? (described || null),
  };
}

/**
 * Keeps the code blocks of the docs that name a source equal to it, so a snippet that stops compiling
 * or stops matching the API fails the check instead of going stale: `node docs/scripts/typedoc/snippets.mts`
 * checks, `--write` brings the blocks up to date. Paths of docs after the flags limit either to those
 * docs: `node docs/scripts/typedoc/snippets.mts --write src/__docs__/your-first-scene.md`.
 *
 * A code block in README.md or a guide (`src/**\/__docs__/*.md`) may follow a marker naming its source, a
 * path from the repo root with an optional region. With a picture of the example's visual test after
 * it, the site runs it live as `<Example>`:
 *
 * ```md
 * <!-- snippet: examples/<topic>/<name>.example.tsx#scene -->
 * ```
 *
 * A block with no marker is the guide's own; the examples are written beside the guides, so a guide
 * moves its blocks to markers as its examples land.
 *
 * A region is the lines between `// #region <name>` and `// #endregion` (`{/* #region <name> *\/}` in
 * JSX). Every region of that name in the file is taken, each dedented, and joined by a blank line, so a
 * snippet can show the imports and the body of an example without its scene plumbing. Without a region
 * the block is the whole file. Region markers never appear in a block.
 *
 * oxfmt formats the blocks of a doc too, at no indent, while the source sits indented in a function. A
 * line the source breaks that fits in 120 columns once dedented is joined by oxfmt and split again by
 * `--write`, so expand that object or reword the line instead. oxfmt's import sort moves a
 * `// #region` comment with the import under it, so a region's imports are one sorted run. After an
 * edit, run `--write` on your docs, then `oxfmt --write`, then this check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repo root; from `import.meta.url`, which jiti, the loader of the site's config, also provides */
export const ROOT = fileURLToPath(new URL('../../../..', import.meta.url)).replace(/[\\/]$/, '');

/** A problem in one doc, at a line of it */
export interface SnippetProblem {
  /** Path of the doc from the repo root */
  doc: string;
  /** 1-based line of the marker or the block */
  line: number;
  message: string;
}

/** What `syncSnippets` made of one doc */
export interface SnippetSync {
  /** The doc with every marked block equal to its source */
  text: string;
  problems: SnippetProblem[];
}

/** The comment that names a code block's source: its file, then `#` and the region */
export const MARKER = /^<!--\s*snippet:\s*([^\s#]+)(?:#([\w-]+))?\s*-->\s*$/;
const FENCE = /^(`{3,})\s*(\w*)/;
/** A line that opens or closes a region of a source: `// #region name`, or the same in a JSX comment */
export const REGION = /^\s*(?:\/\/|\{\/\*)\s*#(region|endregion)\b\s*([\w-]*)/;

/**
 * Every guide of the repo, `packages/<package>/src/**\/__docs__/*.md`, wherever in a package's `src` it sits
 * @param root - The repo root
 * @returns Their paths from the repo root, sorted
 */
export function guideFiles(root: string = ROOT): string[] {
  if (!fs.existsSync(path.join(root, 'packages'))) return [];

  return fs
    .globSync('packages/*/src/**/__docs__/*.md', { cwd: root })
    .map((file) => file.split(path.sep).join('/'))
    .sort();
}

/**
 * Every doc whose code blocks may come from files: README.md and the guides
 * @param root - The repo root
 * @returns Their paths from the repo root
 */
export function docFiles(root: string = ROOT): string[] {
  return ['README.md', ...guideFiles(root)].filter((file) => fs.existsSync(path.join(root, file)));
}

/**
 * The indentation every line that isn't blank shares, in characters; 0 for no such line
 * @param lines - The lines
 */
export function sharedIndent(lines: readonly string[]): number {
  const indents = lines.filter((line) => line.trim()).map((line) => /^\s*/.exec(line)![0].length);

  return indents.length > 0 ? Math.min(...indents) : 0;
}

/**
 * Lines with their common indentation removed, and blank lines at either end dropped
 * @param lines - The lines
 */
function dedent(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start]!.trim()) start++;
  while (end > start && !lines[end - 1]!.trim()) end--;

  const body = lines.slice(start, end);
  const indent = sharedIndent(body);

  return body.map((line) => line.slice(indent));
}

/**
 * The text of a snippet source: every region of a name, dedented and joined by a blank line, or the
 * whole file. Region markers are left out.
 * @param file - Path of the source from the repo root
 * @param region - The region's name; null for the whole file
 * @param root - The repo root
 */
export function readRegion(file: string, region: string | null, root: string = ROOT): string {
  const absolute = path.join(root, file);

  if (!fs.existsSync(absolute)) throw new Error(`${file} doesn't exist`);

  const lines = fs.readFileSync(absolute, 'utf8').split('\n');

  if (region === null) return dedent(lines.filter((line) => !REGION.test(line))).join('\n');

  const segments: string[][] = [];
  let open: string[] | null = null;
  let depth = 0;

  for (const line of lines) {
    const marker = line.match(REGION);

    if (!marker) {
      open?.push(line);
      continue;
    }
    if (open) {
      depth += marker[1] === 'region' ? 1 : -1;
      if (depth === 0) {
        segments.push(dedent(open));
        open = null;
      }
    } else if (marker[1] === 'region' && marker[2] === region) {
      open = [];
      depth = 1;
    }
  }

  if (open) throw new Error(`${file}: region ${region} has no #endregion`);
  if (segments.length === 0) throw new Error(`${file} has no region ${region}`);

  return segments.map((segment) => segment.join('\n')).join('\n\n');
}

/**
 * Sets every marked code block of a doc to its source, and lists the blocks with no source
 * @param markdown - The doc's text
 * @param doc - Path of the doc from the repo root, for the problems
 * @param root - The repo root
 */
export function syncSnippets(markdown: string, doc: string, root: string = ROOT): SnippetSync {
  const lines = markdown.split('\n');
  const out: string[] = [];
  const problems: SnippetProblem[] = [];
  let source: { file: string; region: string | null; line: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const marker = line.match(MARKER);

    out.push(line);
    if (marker) {
      if (source) problems.push({ doc, line: source.line, message: 'snippet marker with no code block after it' });
      source = { file: marker[1]!, region: marker[2] ?? null, line: i + 1 };
      continue;
    }

    const fence = line.match(FENCE);

    if (!fence) {
      if (source && line.trim()) {
        problems.push({ doc, line: source.line, message: 'snippet marker with no code block after it' });
        source = null;
      }
      continue;
    }

    let close = i + 1;

    while (close < lines.length && !lines[close]!.startsWith(fence[1]!)) close++;

    if (source) {
      try {
        out.push(readRegion(source.file, source.region, root));
      } catch (error) {
        problems.push({ doc, line: source.line, message: (error as Error).message });
        out.push(...lines.slice(i + 1, close));
      }
    } else {
      out.push(...lines.slice(i + 1, close));
    }
    if (close < lines.length) out.push(lines[close]!);
    i = close;
    source = null;
  }

  if (source) problems.push({ doc, line: source.line, message: 'snippet marker with no code block after it' });

  return { text: out.join('\n'), problems };
}

if (import.meta.main) {
  const write = process.argv.includes('--write');
  const only = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('--'))
    .map((arg) => path.relative(ROOT, path.resolve(arg)));
  const problems: SnippetProblem[] = [];
  const outputs = docFiles()
    .filter((file) => only.length === 0 || only.includes(file))
    .map((doc) => {
      const synced = syncSnippets(fs.readFileSync(path.join(ROOT, doc), 'utf8'), doc);

      problems.push(...synced.problems);

      return [doc, synced.text] as const;
    });
  let stale = 0;

  for (const [doc, text] of outputs) {
    if (fs.readFileSync(path.join(ROOT, doc), 'utf8') === text) continue;
    if (write) {
      console.log(`Updating ${doc}`);
      fs.writeFileSync(path.join(ROOT, doc), text);
    } else {
      console.error(`${doc} is out of date; run node packages/docs/scripts/typedoc/snippets.mts --write`);
      stale++;
    }
  }

  for (const { doc, line, message } of problems) console.error(`${doc}:${line}: ${message}`);
  if (problems.length > 0 || stale > 0) process.exit(1);
}

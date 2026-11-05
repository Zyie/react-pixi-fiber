/**
 * The entries of the package, each what a consumer imports by one name: the main entry, `src/index.tsx`,
 * which re-exports r3f's vendored core with the pixi-3d support; `react-pixi-fiber/three`, three's API
 * over pixi-3d, `src/three.ts`; and `react-pixi-fiber/addons`, what r3f apps import from `three/addons`,
 * `src/addons/index.ts`. Another entry is a line here; the API reference gets an overview and pages for it.
 */
import fs from 'node:fs';
import path from 'node:path';

/** One entry of the package */
export interface Entry {
  /** What the entry is called: its folder under `/api/` */
  readonly name: string;
  /** The subpath consumers import it by, which keys it in `exports` in package.json */
  readonly subpath: string;
  /** The file under `src` that fronts it, without its extension: `.tsx` or `.ts` */
  readonly file: string;
}

/** Every package entry */
export const ENTRIES = [
  { name: 'react-pixi-fiber', subpath: '.', file: 'index' },
  { name: 'three', subpath: './three', file: 'three' },
  { name: 'addons', subpath: './addons', file: 'addons/index' },
] as const satisfies readonly Entry[];

/** The name of a package entry */
export type EntryName = (typeof ENTRIES)[number]['name'];

/** The main entry */
export const MAIN: Entry = ENTRIES[0];

/**
 * The name an entry is imported by: `react-pixi-fiber`, `react-pixi-fiber/<subpath>`
 * @param entry - The entry
 */
export function packageName(entry: Entry): string {
  return `react-pixi-fiber${entry.subpath.slice(1)}`;
}

/**
 * The file that fronts an entry, from the repo root: `src/index.tsx` when there is one, else `src/index.ts`
 * @param entry - The entry
 * @param root - The repo root
 */
export function entryFile(entry: Entry, root: string): string {
  const candidates = ['.tsx', '.ts'].map((extension) => `src/${entry.file}${extension}`);

  return candidates.find((file) => fs.existsSync(path.join(root, file))) ?? candidates[1]!;
}

/**
 * Whether a source file is vendored, copied from another project byte for byte, such as r3f's core:
 * its docs are its authors' and aren't checked here. A file is vendored when a folder on its path is
 * named `r3f`, `vendor` or `vendored`.
 * @param file - Its path from the repo root
 */
export function isVendored(file: string): boolean {
  return /(^|\/)(r3f|vendor|vendored)\//.test(file);
}

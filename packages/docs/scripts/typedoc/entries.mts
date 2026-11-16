/**
 * The entries of the packages, each what a consumer imports by one name: `@react-fiber/core`, r3f's API
 * on pixi.js, and `@react-fiber/core/extension`, what packages plug into it with; `@react-fiber/2d`,
 * pixi.js's 2D elements; `@react-fiber/3d`, @pixi/3d's; and `@react-fiber/threejs-compat`, r3f's API with
 * three's names over @pixi/3d, with `/three`, what an app imports from `three`, and `/addons`, what it
 * imports from `three/addons`. Another entry is a line here; the API reference gets an overview and pages
 * for it.
 */
import fs from 'node:fs';
import path from 'node:path';

/** One entry of a package */
export interface Entry {
  /** What the entry is called: its folder under `/api/` */
  readonly name: string;
  /** The package it belongs to, its name on npm */
  readonly package: string;
  /** The subpath consumers import it by, which keys it in `exports` in the package's package.json */
  readonly subpath: string;
  /** The file that fronts it, from the repo root, without its extension: `.tsx` or `.ts` */
  readonly file: string;
}

/** Every package entry, in the order the reference lists them */
export const ENTRIES = [
  { name: 'core', package: '@react-fiber/core', subpath: '.', file: 'packages/core/src/index' },
  { name: '2d', package: '@react-fiber/2d', subpath: '.', file: 'packages/2d/src/index' },
  {
    name: 'threejs-compat',
    package: '@react-fiber/threejs-compat',
    subpath: '.',
    file: 'packages/threejs-compat/src/index',
  },
  {
    name: 'three',
    package: '@react-fiber/threejs-compat',
    subpath: './three',
    file: 'packages/threejs-compat/src/three',
  },
  {
    name: 'addons',
    package: '@react-fiber/threejs-compat',
    subpath: './addons',
    file: 'packages/threejs-compat/src/addons/index',
  },
  { name: '3d', package: '@react-fiber/3d', subpath: '.', file: 'packages/3d/src/index' },
  { name: 'extension', package: '@react-fiber/core', subpath: './extension', file: 'packages/core/src/extension' },
] as const satisfies readonly Entry[];

/** The name of a package entry */
export type EntryName = (typeof ENTRIES)[number]['name'];

/** The main entry */
export const MAIN: Entry = ENTRIES[0];

/**
 * The name an entry is imported by: `@react-fiber/core`, `@react-fiber/threejs-compat/<subpath>`
 * @param entry - The entry
 */
export function packageName(entry: Entry): string {
  return `${entry.package}${entry.subpath.slice(1)}`;
}

/** The names every entry is imported by; an import of one names another package, which isn't followed */
export const ENTRY_NAMES: ReadonlySet<string> = new Set(ENTRIES.map(packageName));

/**
 * The file that fronts an entry, from the repo root: `<file>.tsx` when there is one, else `<file>.ts`
 * @param entry - The entry
 * @param root - The repo root
 */
export function entryFile(entry: Entry, root: string): string {
  const candidates = ['.tsx', '.ts'].map((extension) => `${entry.file}${extension}`);

  return candidates.find((file) => fs.existsSync(path.join(root, file))) ?? candidates[1]!;
}

/**
 * Whether a source file is vendored, copied from another project, such as r3f's core: its docs are its
 * authors' and aren't checked here. A file is vendored when a folder on its path is named `r3f`,
 * `vendor` or `vendored`.
 * @param file - Its path from the repo root
 */
export function isVendored(file: string): boolean {
  return /(^|\/)(r3f|vendor|vendored)\//.test(file);
}

import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

/** The package's entries a scene, an example or a doc may import, by specifier */
export type FiberEntry = 'react-pixi-fiber' | 'react-pixi-fiber/three' | 'react-pixi-fiber/addons';

/**
 * What each entry of the package resolves to, for each renderer family a scene runs on. A scene, an
 * example or a doc imports only these specifiers, so pointing them at r3f's own WebGL entry and at
 * three.js renders the same file through real three.js, which is how parity is measured.
 *
 * - `pixi`: this library's entries: `src/index.tsx`, `src/three.ts` and `src/addons/index.ts`.
 * - `three`: r3f's `legacy.tsx`, which builds a three.js `WebGLRenderer`, `three` itself, and a harness
 *   file that re-exports from `three/addons` the names `react-pixi-fiber/addons` exports. r3f's entry
 *   must sit beside the same vendored core the `pixi` entry imports, so hooks a scene imports from
 *   either are the same functions.
 *
 * The one place the targets are named: vitest's `scenes` and `three` projects and the playground read
 * them from here. `tsconfig.json` names the package for the type checker separately.
 */
export const FIBER_TARGETS: Readonly<Record<'pixi' | 'three', Readonly<Record<FiberEntry, string>>>> = {
  pixi: {
    'react-pixi-fiber': path.join(root, 'src/index.tsx'),
    'react-pixi-fiber/three': path.join(root, 'src/three.ts'),
    'react-pixi-fiber/addons': path.join(root, 'src/addons/index.ts'),
  },
  three: {
    'react-pixi-fiber': path.join(root, 'src/r3f/src/legacy.tsx'),
    'react-pixi-fiber/three': 'three',
    'react-pixi-fiber/addons': path.join(root, 'tests/harness/three-addons.ts'),
  },
};

/** A renderer family: the library on pixi-3d, or r3f on three.js */
export type FiberFamily = keyof typeof FIBER_TARGETS;

/**
 * Whether a module specifier is one of the package's entries
 * @param source - The specifier
 */
export const isFiberEntry = (source: string): source is FiberEntry => source in FIBER_TARGETS.pixi;

/** Vite aliases that vitest and the playground share, apart from the package's own entries */
export const sharedAliases = [
  { find: /^~\//, replacement: `${path.join(root, 'src')}/` },
  // r3f's alias for its types folder. Every vendored `#types` import is type-only, but Vite still resolves it.
  { find: /^#types$/, replacement: path.join(root, 'src/r3f/types/index.ts') },
  { find: /^@test-scene$/, replacement: path.join(root, 'tests/harness/scene.ts') },
];

/**
 * The Vite aliases that point the package's entries at one renderer family
 * @param family - The family a project or page renders with
 */
export const fiberAliases = (family: FiberFamily): { find: RegExp; replacement: string }[] =>
  Object.entries(FIBER_TARGETS[family]).map(([specifier, replacement]) => ({
    find: new RegExp(`^${specifier.replace('/', '\\/')}$`),
    replacement,
  }));

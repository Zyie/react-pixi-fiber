import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

/** The package entries a scene, an example or a doc may import that render differently on three.js, by specifier */
export type FiberEntry =
  | '@react-fiber/core'
  | '@react-fiber/2d'
  | '@react-fiber/threejs-compat'
  | '@react-fiber/threejs-compat/three'
  | '@react-fiber/threejs-compat/addons';

/**
 * What each package entry a scene can import resolves to, for each renderer family a scene runs on. A
 * scene, an example or a doc imports r3f's API, three's classes and three's addons only by these
 * specifiers, so pointing them at r3f's own WebGL entry and at three.js renders the same file through
 * real three.js, which is how parity is measured.
 *
 * - `pixi`: the packages' sources: `@react-fiber/core` and `@react-fiber/2d`, and the three entries of
 *   `@react-fiber/threejs-compat`.
 * - `three`: r3f's `legacy.tsx`, which builds a three.js `WebGLRenderer`, for both `@react-fiber/core`
 *   and `@react-fiber/threejs-compat`; `three` itself; and a harness file that re-exports from
 *   `three/addons` the names `@react-fiber/threejs-compat/addons` exports. `@react-fiber/2d` is an empty
 *   module there: pixi.js 2D has no three.js counterpart, so no scene that runs on three.js uses it, and
 *   the harness's own import of it, which installs it on pixi, does nothing. r3f's entry must sit
 *   beside the same forked core the `pixi` entries import, so hooks a scene imports from either are the
 *   same functions.
 *
 * The one place the targets are named: vitest's `scenes` and `three` projects and the playground read
 * them from here. `tsconfig.base.json` names the packages for the type checker separately.
 */
export const FIBER_TARGETS: Readonly<Record<'pixi' | 'three', Readonly<Record<FiberEntry, string>>>> = {
  pixi: {
    '@react-fiber/core': path.join(root, 'packages/core/src/index.tsx'),
    '@react-fiber/2d': path.join(root, 'packages/2d/src/index.ts'),
    '@react-fiber/threejs-compat': path.join(root, 'packages/threejs-compat/src/index.ts'),
    '@react-fiber/threejs-compat/three': path.join(root, 'packages/threejs-compat/src/three.ts'),
    '@react-fiber/threejs-compat/addons': path.join(root, 'packages/threejs-compat/src/addons/index.ts'),
  },
  three: {
    '@react-fiber/core': path.join(root, 'packages/r3f/src/legacy.tsx'),
    '@react-fiber/2d': path.join(root, 'tests/harness/pixi-only.ts'),
    '@react-fiber/threejs-compat': path.join(root, 'packages/r3f/src/legacy.tsx'),
    '@react-fiber/threejs-compat/three': 'three',
    '@react-fiber/threejs-compat/addons': path.join(root, 'tests/harness/three-addons.ts'),
  },
};

/** A renderer family: the packages on pixi-3d, or r3f on three.js */
export type FiberFamily = keyof typeof FIBER_TARGETS;

/**
 * Whether a module specifier is one of the package entries
 * @param source - The specifier
 */
export const isFiberEntry = (source: string): source is FiberEntry => source in FIBER_TARGETS.pixi;

/** Vite aliases that vitest and the playground share, apart from the package entries above */
export const sharedAliases = [
  // The entries packages import each other through, which no scene does.
  { find: /^@react-fiber\/core\/extension$/, replacement: path.join(root, 'packages/core/src/extension.ts') },
  { find: /^@react-fiber\/3d$/, replacement: path.join(root, 'packages/3d/src/index.ts') },
  // core reaches r3f's modules by path, as its build bundles them.
  { find: /^@react-fiber\/r3f\//, replacement: `${path.join(root, 'packages/r3f')}/` },
  // r3f's alias for its types folder. Every forked `#types` import is type-only, but Vite still resolves it.
  { find: /^#types$/, replacement: path.join(root, 'packages/r3f/types/index.ts') },
  { find: /^@test-scene$/, replacement: path.join(root, 'tests/harness/scene.ts') },
];

/**
 * The Vite aliases that point the package entries at one renderer family
 * @param family - The family a project or page renders with
 */
export const fiberAliases = (family: FiberFamily): { find: RegExp; replacement: string }[] =>
  Object.entries(FIBER_TARGETS[family]).map(([specifier, replacement]) => ({
    find: new RegExp(`^${specifier.replaceAll('/', '\\/')}$`),
    replacement,
  }));

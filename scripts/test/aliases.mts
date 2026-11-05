import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const pixi3d = path.join(root, '.repos/pixi-3d/src');

/**
 * What the package name `react-pixi-fiber` resolves to, for each renderer family a scene runs on. A
 * scene, an example or a doc imports only the package name, so pointing the name at r3f's own WebGL
 * entry renders the same file through real three.js, which is how parity is measured.
 *
 * - `pixi`: this library's entry.
 * - `three`: r3f's `legacy.tsx`, which builds a three.js `WebGLRenderer`. It must sit beside the same
 *   vendored core the `pixi` entry imports, so hooks a scene imports from either are the same functions.
 *
 * The one place both targets are named: vitest's `scenes` and `three` projects and the playground read
 * them from here. `tsconfig.json` names the package for the type checker separately.
 */
export const FIBER_TARGETS = {
  pixi: path.join(root, 'src/index.tsx'),
  three: path.join(root, 'src/r3f/src/legacy.tsx'),
} as const;

/** A renderer family: the library on pixi-3d, or r3f on three.js */
export type FiberFamily = keyof typeof FIBER_TARGETS;

/** Vite aliases that vitest and the playground share, apart from the package name itself */
export const sharedAliases = [
  { find: /^~\//, replacement: `${path.join(root, 'src')}/` },
  // r3f's alias for its types folder. Every vendored `#types` import is type-only, but Vite still resolves it.
  { find: /^#types$/, replacement: path.join(root, 'src/r3f/types/index.ts') },
  { find: /^@pixi\/3d\/extras$/, replacement: path.join(pixi3d, 'extras/index.ts') },
  { find: /^@pixi\/3d$/, replacement: path.join(pixi3d, 'index.ts') },
  { find: /^@test-scene$/, replacement: path.join(root, 'tests/harness/scene.ts') },
];

/**
 * The Vite alias that points the package name at one renderer family
 * @param family - The family a project or page renders with
 */
export const fiberAlias = (family: FiberFamily): { find: RegExp; replacement: string } => ({
  find: /^react-pixi-fiber$/,
  replacement: FIBER_TARGETS[family],
});

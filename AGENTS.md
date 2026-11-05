# AGENTS.md

`react-pixi-fiber` explores porting react-three-fiber (r3f) v10 to `@pixi/3d`, keeping as much API parity with the three.js version as possible. The goal is that swapping the renderer is the only change an r3f app needs. TypeScript, React 19, WebGL + WebGPU.

## Ground rules

- **Never edit `src/r3f`.** It is r3f's `packages/fiber`, vendored byte for byte. Adapt r3f in our own layer (`src/support`, `src/compat`, `src/catalog`, `src/renderer`); `npm run vendor:r3f` resyncs the copy after `npm run sync:repos`.
- **three is not a dependency.** Nothing reachable from `src/index.tsx` imports `three`; it is a devDependency only so the vendored r3f entries can render the same scenes through three for parity.

## Read before you start

- **`CODING_STANDARDS.md`**, how code here is written: the vendored core, imports and exports, JSDoc, per-frame code and resource lifetime.
- **`docs/architecture.md`**, how the library fits together: the vendored core, the pixi-3d support, the compat layer, the catalog, the renderer facade, and how a frame flows.
- **`docs/feasibility.md`**: the findings on what ports cleanly, what needs an adapter, and what needs changes in pixi-3d.
- **`.repos/`**, read-only source checked out by `npm run sync:repos` (`scripts/repos/manifest.mts`). Repo-wide searches skip it, so search it by path.
  - `.repos/react-three-fiber`: r3f, `v10` branch. The port source. Start at its `AGENTS.md`; the fiber package is `packages/fiber/src`.
  - `.repos/pixi-3d`: `@pixi/3d`, `main` branch. The target renderer. Start at its `AGENTS.md` and `docs/architecture.md`.
  - `.repos/pixijs`: pixi.js, `dev` branch. The 2D engine pixi-3d extends.

## How `@pixi/3d` resolves

`@pixi/3d` isn't on npm. `tsconfig.json` paths and the `vitest.config.ts` aliases point it at `.repos/pixi-3d/src`, and the build leaves it external. Run `npm run sync:repos` before anything else.

## Verify

- `npm run lint` fixes lint and formatting with oxlint and oxfmt; `npm run test:lint` is the read-only check, and also fails when `src/r3f` differs from `.repos/react-three-fiber`.
- `npm run test:types` type-checks with `tsc` (TypeScript 7).
- `npm run test:unit` runs vitest in headless Chromium. Rendering tests need a real browser, so tests live in the browser runner.
- `npm run build` builds with tsdown. Declarations come from Oxc, so exported functions and values need explicit types. `npm run test:bundle` then fails if `dist` imports three.
- `npm test` runs all of the above except the build.

## Commits

Commit messages start with `feat:`, `fix:`, `chore:`, `breaking:`, or `perf:`, followed by the title.

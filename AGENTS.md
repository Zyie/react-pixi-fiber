# AGENTS.md

`react-pixi-fiber` is a React renderer for pixi.js 2D and `@pixi/3d` that keeps react-three-fiber (r3f) v10's API for both: an r3f app should only have to swap its import, and pixi.js's 2D classes are elements of the same tree (`<sprite2D>`, `<graphics2D>`, ...), with the same hooks and events. TypeScript, React 19, WebGL + WebGPU.

## Ground rules

- **Vendored r3f is never edited.** `src/r3f` is r3f's `packages/fiber`, byte for byte. Adapt r3f in our own layer (`src/root`, `src/support`, `src/compat`, `src/catalog`, `src/renderer`, `src/types`, and the area modules `src/math`, `src/events`, `src/loaders`, `src/animation`, `src/environment`, `src/addons`, `src/two-d`); `npm run vendor:r3f` resyncs the copy after `npm run sync:repos`, and `npm run test:lint` fails when it drifts.
- **Parity with three.js is the yardstick for 3D.** A scene renders through real three.js as well as pixi-3d, and the gap between the two pictures is the measure of a change: close it in our layer, or record why it can't close yet (the scene's `parity` or `fails` with the cause, `src/__docs__/differences.md` and the parity matrix of `docs/feasibility.md`). three is a devDependency for that measurement only; nothing the three entries (`src/index.tsx`, `src/three.ts`, `src/addons/index.ts`) reach imports it. 2D and mixed 2D and 3D have no external reference: their scenes (`tests/scenes/2d`, `tests/scenes/mixed`, `examples/2d`) skip three.js and are held to their own references, which pixi's WebGL and WebGPU pictures must agree on.
- **2D feels like the rest of the library.** 2D elements are pixi.js's classes under r3f's rules: the class name with a `2D` suffix in camelCase, `args` as constructor arguments, props, piercing, `attach`, `extend` (`extend({ Button2D: Button })`), r3f's hooks and r3f's event system. There is no @pixi/react API or dependency. `src/two-d` holds them, with the bridges between 2D and 3D (`<anchor2D>`, `<View3D>`, `<Layer3D>`, `<RenderTexture2D>`; `docs/architecture.md`, "pixi.js 2D" and "Bridges").
- **Three entries, one class per name.** `react-pixi-fiber` is r3f's API, `react-pixi-fiber/three` is what an app imports from `three`, and `react-pixi-fiber/addons` what it imports from `three/addons`. A class is added with one line in its area module's `index.ts` (`docs/architecture.md`, "Adding to the catalog"); two areas never export the same name. An addon also gets its line in `tests/harness/three-addons.ts` and its file in the pre-bundled lists of `vitest.config.ts` and `playground/vite.config.ts`.
- **Test with pictures first.** A visual scene is the default test: it draws the result on pixi-3d's WebGPU and WebGL renderers and on three.js, and compares each with a reference image. Write a unit test only where there is no picture to compare, such as a view the renderer releases.
- **Look at what you rendered.** Every change is verified by opening the images it produces, its references and its parity composite, and checking they show what you meant. A passing comparison only says the image didn't change, and a new reference image is correct only once you have looked at it.
- **Every resource ships with its release.** A view, proxy camera, listener or cache entry you create gets its release in the same change. `CODING_STANDARDS.md` has the `dispose()` contract.

## Read before you start

- **`CODING_STANDARDS.md`**, how code here is written: the vendored core, imports and exports, JSDoc, per-frame code and resource lifetime. Read it before you write or review code.
- **`docs/architecture.md`**, how the library fits together: the vendored core, the pixi-3d support, the compat layer, the alias catalog, the renderer facade, how a frame flows, and how parity is measured. Read it before you change anything in `src`.
- **`tests/README.md`**, the visual harness: scenes, examples, three.js parity and its composites, unit tests, the playground. Read it when you write a scene, an example or a unit test, run a single test, update reference images, or a scene fails.
- **`docs/README.md`**, the docs site, built from the guides in `src/**/__docs__`, the examples, the parity findings and the JSDoc. Read it when you write a guide, run, build or check the site, or want to see a change on it.
- **`docs/feasibility.md`**, the findings behind the design: what ports cleanly, what needs an adapter, and what needs changes in pixi-3d or r3f. Read it before you take on a parity gap.
- **`.repos/`**, read-only source checked out by `npm run sync:repos` (`scripts/repos/manifest.mts`). Run it first: `@pixi/3d` isn't on npm, so `tsconfig.json` paths and the Vite aliases resolve it to `.repos/pixi-3d/src`. Repo-wide searches skip `.repos`, so search it by path.
  - `.repos/react-three-fiber`: r3f, `v10` branch, the source of `src/r3f`. Start at its `AGENTS.md`; the fiber package is `packages/fiber`.
  - `.repos/pixi-3d`: `@pixi/3d`, `main` branch, the renderer. Start at its `AGENTS.md` and `docs/architecture.md`.
  - `.repos/pixijs`: pixi.js, `dev` branch, the 2D engine pixi-3d extends.

## Verify

- `npm run lint` fixes lint and formatting with oxlint and oxfmt; `npm run test:lint` is the read-only check, and also checks `src/r3f` against `.repos`. It type-checks `scripts/build/consumer` against `dist`, so in a fresh checkout or worktree run `npm run build` first.
- `npm test` runs lint, the type check, `test:docs` and every vitest project. While iterating, run the narrow one: `npm run test:types`, or a single scene (`tests/README.md`).
- `npm run test:visual` runs every scene and example on three.js, then on pixi-3d's WebGPU and WebGL renderers, and prints how far each is from three.js; `npm run test:update` rewrites the references a change moved. `npm start` serves the playground, every scene on pixi WebGL, pixi WebGPU and three.js side by side or as a diff.
- `npm run test:docs` checks the guides, the examples they quote and the JSDoc of the public API, and lints, type-checks and unit-tests the site's code in `docs/`. `npm run test:site` builds the site and crawls every page for errors and broken links, running examples live; `npm test` leaves it out.
- After a change to the build or the package's exports, run `npm run build`, then `npm run test:bundle`, which fails when `dist` imports three.

## Commits

Commit messages start with `feat:`, `fix:`, `chore:`, `breaking:` or `perf:`, followed by the title. Commit as you reach working states; never push.

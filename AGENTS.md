# AGENTS.md

`react-pixi-fiber` is a set of React renderers for pixi.js 2D and `@pixi/3d` that keep react-three-fiber (r3f) v10's API: an r3f app should only have to swap its imports, and pixi.js's 2D classes are elements of the same tree (`<sprite2D>`, `<graphics2D>`, ...), with the same hooks and events. TypeScript, React 19, WebGL + WebGPU, as npm workspaces under `packages/`.

## The packages

| Package                       | Folder                    | What it is                                                                                                                                                             |
| ----------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-fiber/r3f`            | `packages/r3f`            | r3f's `packages/fiber`, forked so its core calls renderer hooks (`packages/r3f/README.md`, for r3f's maintainers)                                                      |
| `@react-fiber/core`           | `packages/core`           | r3f's API on pixi.js: `Canvas`, `createRoot`, the renderer support and its registry, the renderer facade, the stage, hit order, the 2D/3D bridges. Bundles r3f's core. |
| `@react-fiber/2d`             | `packages/2d`             | pixi.js's 2D classes as elements (`<sprite2D>`), their hooks and surface; installed by importing it                                                                    |
| `@react-fiber/3d`             | `packages/3d`             | @pixi/3d's elements under pixi conventions; a skeleton for now, holding @pixi/3d's object hooks                                                                        |
| `@react-fiber/threejs-compat` | `packages/threejs-compat` | three's names and API over @pixi/3d (`<mesh>`, `Object3D`'s surface, math, loaders, environment, addons), `ThreeRenderer`; installed by importing any of its entries   |
| `@react-fiber/docs`           | `packages/docs`           | the docs site                                                                                                                                                          |

The graph is acyclic: r3f <- core <- 2d, 3d <- threejs-compat, and docs uses them all. Each package type-checks on its own against the packages it depends on, and imports another only by its entries (`@react-fiber/core`, `@react-fiber/core/extension`, ...). Only core imports `@react-fiber/r3f`, by path, and its build bundles it, so every package shares core's one copy of r3f's core.

## Ground rules

- **r3f is a fork with a checked diff.** `packages/r3f` is r3f's `packages/fiber` at the commit `scripts/repos/manifest.mts` pins, changed only where its core calls the renderer hooks. Adapt r3f in core and the packages above it. Change the fork only to add or change a hook, in r3f's own format, and record the hook, what core did before and why in its README. `npm run diff:r3f` writes `packages/r3f/fork.diff`, and `npm run test:lint` fails when it is stale.
- **Packages plug into core; core knows none of them.** A package registers with pixi.js's `extensions` (`FiberExtensionType` from `@react-fiber/core/extension`): its JSX classes, the renderer hooks for the objects it owns (`ObjectHooks`), and the renderer and targets it gives roots (`SupportParts`). core's types read the classes a package registers through `Register`; a package adds its elements to `ThreeElements`. Never import a package from one below it (`docs/architecture.md`, "The registry").
- **Parity with three.js is the yardstick for 3D.** A scene renders through real three.js as well as pixi-3d, and the gap between the two pictures is the measure of a change: close it in our layer, or record why it can't close yet (the scene's `parity` or `fails` with the cause, `packages/threejs-compat/src/__docs__/differences.md` and the parity matrix of `docs/feasibility.md`). three is a devDependency for that measurement only; nothing any package's entries reach imports it, but r3f's fork. 2D and mixed 2D and 3D have no external reference: their scenes (`tests/scenes/2d`, `tests/scenes/mixed`, `examples/2d`) skip three.js and are held to their own references, which pixi's WebGL and WebGPU pictures must agree on.
- **2D feels like the rest of the library.** 2D elements are pixi.js's classes under r3f's rules: the class name with a `2D` suffix in camelCase, `args` as constructor arguments, props, piercing, `attach`, `extend` (`extend({ Button2D: Button })`), r3f's hooks and r3f's event system. There is no @pixi/react API or dependency. `packages/2d` holds them; the bridges between 2D and 3D (`<anchor2D>`, `<View3D>`, `<Layer3D>`, `<RenderTexture2D>`) are core's, and need 2d installed (`docs/architecture.md`, "pixi.js 2D" and "Bridges").
- **threejs-compat's entries, one class per name.** `@react-fiber/threejs-compat` is r3f's API (core's, with `<Environment>`), `/three` is what an app imports from `three`, and `/addons` what it imports from `three/addons`. A class is added with one line in its area module's `index.ts` (`docs/architecture.md`, "Adding to the catalog"); two areas never export the same name. An addon also gets its line in `tests/harness/three-addons.ts` and its file in the pre-bundled lists of `vitest.config.ts` and `playground/vite.config.ts`.
- **Test with pictures first.** A visual scene is the default test: it draws the result on pixi-3d's WebGPU and WebGL renderers and on three.js, and compares each with a reference image. Write a unit test only where there is no picture to compare, such as a view the renderer releases.
- **Look at what you rendered.** Every change is verified by opening the images it produces, its references and its parity composite, and checking they show what you meant. A passing comparison only says the image didn't change, and a new reference image is correct only once you have looked at it.
- **Every resource ships with its release.** A view, proxy camera, listener or cache entry you create gets its release in the same change. `CODING_STANDARDS.md` has the `dispose()` contract.

## Read before you start

- **`CODING_STANDARDS.md`**, how code here is written: the packages and their entries, the forked core, imports and exports, JSDoc, per-frame code and resource lifetime. Read it before you write or review code.
- **`docs/architecture.md`**, how the packages fit together: the forked core and its renderer hooks, the registry, the pixi support, the renderer facade and `ThreeRenderer`, the compat layer, the alias catalog, 2D and the bridges, how a frame flows, and how parity is measured. Read it before you change anything under `packages/`.
- **`tests/README.md`**, the visual harness: scenes, examples, three.js parity and its composites, unit tests, the playground. Read it when you write a scene, an example or a unit test, run a single test, update reference images, or a scene fails.
- **`packages/docs/README.md`**, the docs site, built from the guides in `packages/*/src/**/__docs__`, the examples, the parity findings and the JSDoc of every package entry. Read it when you write a guide, run, build or check the site, or want to see a change on it.
- **`docs/feasibility.md`**, the findings behind the design: what ports cleanly, what needs an adapter, and what needs changes in pixi-3d or r3f. Read it before you take on a parity gap.
- **`.repos/`**, read-only source checked out by `npm run sync:repos` (`scripts/repos/manifest.mts`), for reading. The code builds against the npm packages; `@pixi/3d` and `pixi.js` are checked out at the commit of their installed versions. Repo-wide searches skip `.repos`, so search it by path.
  - `.repos/react-three-fiber`: r3f at the `v10` commit `packages/r3f` forks. Start at its `AGENTS.md`; the fiber package is `packages/fiber`.
  - `.repos/pixi-3d`: `@pixi/3d` (github.com/pixijs/3d) at the installed version's tag, the renderer. Start at its `AGENTS.md` and `docs/architecture.md`.
  - `.repos/pixijs`: pixi.js at the installed version's commit, the 2D engine pixi-3d extends.

## Verify

- `npm run build` builds every package with tsdown into its own `dist` (the root `tsdown.config.ts` lists them), then marks the retyped members of their declarations (`scripts/build/declarations.mts`). `npm run test:bundle` fails when a package's `dist` (core, 2d, 3d, threejs-compat) imports three or r3f's fork, and type-checks an app against every package's declarations. Run both after a change to a build, an entry or a package's exports.
- `npm run lint` fixes lint and formatting with oxlint and oxfmt; `npm run test:lint` is the read-only check, and also checks that `packages/r3f/fork.diff` is the fork's diff against `.repos`. Its type-aware pass reads `scripts/build/consumer` against the packages' `dist`, as `npm run test:docs` reads the site against it, so in a fresh checkout or worktree run `npm run build` first.
- `npm run test:types` type-checks everything together (`tsconfig.json`), then each package alone (`packages/<name>/tsconfig.json`), which catches a package that leans on one above it.
- `npm test` runs lint, the type checks, `test:docs` and every vitest project. While iterating, run the narrow one: `npm run test:types`, or a single scene (`tests/README.md`).
- `npm run test:visual` runs every scene and example on three.js, then on pixi-3d's WebGPU and WebGL renderers, and prints how far each is from three.js; `npm run test:update` rewrites the references a change moved. `npm start` serves the playground, every scene on pixi WebGL, pixi WebGPU and three.js side by side or as a diff.
- `npm run test:docs` checks the guides, the examples they quote and the JSDoc of every package entry, and lints, type-checks and unit-tests the site's code in `packages/docs`. `npm run test:site` builds the site and crawls every page for errors and broken links, running examples live; `npm test` leaves it out.

## Commits

Commit messages start with `feat:`, `fix:`, `chore:`, `breaking:` or `perf:`, followed by the title. Commit as you reach working states; never push.

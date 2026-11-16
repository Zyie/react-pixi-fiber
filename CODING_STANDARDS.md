# Coding standards

How code in `react-pixi-fiber` is written. Authors read it before writing code; reviewers check a diff against it. A line marked _(lint)_ or with a script name is checked by tooling, so it's here to get the code right the first time and a reviewer can skip it. Everything else is for the author and the reviewer to hold.

`docs/architecture.md` explains what each package and folder does; this file says how it's written.

## Packages

- The packages are npm workspaces under `packages/`, named `@react-fiber/<name>`: `r3f`, `core`, `2d`, `3d`, `threejs-compat` and `docs`. Each has its own `package.json`, `tsconfig.json` (extending `tsconfig.base.json`) and `tsdown.config.ts`, and builds into its own `dist`; the root `tsdown.config.ts` lists the ones `npm run build` builds.
- The graph is acyclic: r3f <- core <- 2d, 3d <- threejs-compat. A package imports another only through that package's entries (`@react-fiber/core`, `@react-fiber/core/extension`, `@react-fiber/3d`, ...), never by a path into its `src`. Each package type-checks alone against the packages it depends on. _(`npm run test:types`)_
- Only core imports `@react-fiber/r3f`, by path (`@react-fiber/r3f/src/core/...`), and its build bundles it. Every other package reaches r3f's core through core's entries, so an app has one copy of it.
- A package plugs into core by registering with pixi.js's `extensions` under `FiberExtensionType` (`docs/architecture.md`, "The registry"), when its entry is imported. Prototype patches wait for the `install` of its `SupportParts`, which runs when the first root loads the support. core never imports a package above it; where core needs a class, it reads the root's support (`classesOf`), and where its types need one, `Registered<'...'>`. core registers its own defaults (`packages/core/src/defaults`) at priority -1, so a root works with no package above it.
- No package but threejs-compat imports it, names three's classes or puts three's members on @pixi/3d's or pixi.js's classes. `@react-fiber/3d`'s elements are @pixi/3d's classes as they are; what r3f's core calls on a root's camera, scene and raycaster lives on core's own classes (`RootCamera`, `RootScene`, `RootRaycaster`), not on @pixi/3d's prototypes.
- `@react-fiber/core/extension` is for packages that build on core: the registry and the stage, hit order and renderer parts their objects join. Apps import `@react-fiber/core`. A name goes into `extension` only when a package above core imports it.

## The forked r3f core

- `packages/r3f` is react-three-fiber's `packages/fiber` (`src`, `types`) at the commit `scripts/repos/manifest.mts` pins, with its core calling the renderer hooks. Its whole change is `packages/r3f/fork.diff`. _(`npm run test:lint` runs `scripts/r3f/fork.mts --check`)_
- Change it only where core reaches into three.js-shaped objects, through a hook on the support or, where no renderer is needed (an object's key, a walk up `parent`), in core itself, and keep the diff minimal: upstream's file layout, r3f's format (no semicolons, prettier), no drive-by edits. Each hook gets a row in `packages/r3f/README.md`: what core did before and why it's needed. Then run `npm run diff:r3f`, and r3f's own test suite on the fork (the README says how).
- three's supports implement every hook with what core did before (`packages/r3f/src/support/threeHooks.ts`), so three.js apps behave as they did.
- To take a new r3f commit, follow the README's last section, then run the full test suite.
- Our only files inside `packages/r3f` outside the diff are the ones `EXTRAS` in `scripts/r3f/fork.mts` lists: `README.md`, `fork.diff`, `package.json` (upstream's, renamed `@react-fiber/r3f`), the `tsconfig.json` and `tsdown.config.ts` its build reads, and the `react-reconciler` shims at the path r3f's core imports. A new file of ours there needs an entry in `EXTRAS` and a reason in that script's header.
- oxlint and oxfmt skip `packages/r3f`, and `tsconfig.json` excludes it as a root, so it's type-checked only through what core imports from it. r3f's own entries (`index.tsx`, `legacy.tsx`, `webgpu/`) declare three's JSX elements; no package imports them. `legacy.tsx` and `support/webgl.ts` stay loadable, because the parity harness renders scenes through them.
- Code that adapts a forked file copies it into our tree under its own name and keeps r3f's notice in a `/*!` comment, as `packages/core/src/root/Canvas.tsx` does.
- Something r3f's core should do differently goes in our layer (core's support and renderer, or a package's hooks), a renderer hook, or an upstream request recorded in `docs/architecture.md`.

## Three is not a dependency

- Nothing reachable from any entry of core, 2d, 3d or threejs-compat imports `three`, a `three/...` subpath or `@types/three`, as a value or as a type. three is a devDependency only so r3f's own entries can render the same scenes through three. _(`npm run test:bundle` on the built packages)_
- core's entry doesn't re-export a forked module with `export *` or `export { x } from`: the declarations would name three's types, and a module like `core/components/Environment` would pull three's addons into the bundle. Each value is re-declared in `packages/core/src/index.tsx` with a type from `packages/core/src/types`.
- Public types are ours, in `packages/core/src/types`, typed against pixi-3d, pixi.js and the classes a package registers (`Register`). A type from `#types` (r3f's) appears only in files the declaration bundle never reaches: the provider and the wrappers around core calls.
- A name a package's augmentation of `@react-fiber/core` uses is imported under a name core doesn't export, since inside `declare module` a name resolves in core's scope first (`ThreeScene`, not `Scene`).

## Classes and files

- Each class gets its own file beside the files of its kind: catalog aliases in their area's folder of `packages/threejs-compat/src/catalog` (`objects`, `scene`, `lights`, `geometries`, `materials`, ...), three's math in `packages/threejs-compat/src/math`, picking in `packages/threejs-compat/src/compat`, the renderer in `packages/core/src/renderer`, a root's default classes in `packages/core/src/defaults`. `docs/architecture.md` lists the area modules.
- Every class member has an explicit `public`, `protected`, or `private`, except constructors. Private members are named `_camelCase`, and members that are never reassigned are `readonly`.
- Class fields typed `number` get an initializer even when the constructor assigns the real value: `public aspect: number = 1;`.
- A catalog alias keeps three's class name, constructor signature and defaults, and maps them onto the pixi-3d class it extends. Where pixi-3d's default differs from three's (a mesh's shadows, a material's metalness), the alias passes three's.
- A catalog node class re-declares `rotation` as an `Euler` and `lookAt` with three's arguments, and a colour field is a three `Color` handed to pixi-3d with `toPixiColor`; `docs/architecture.md` ("Adding to the catalog") has the recipe.
- A three math class extends pixi-3d's class of the same kind and adds only what pixi-3d's lacks, so pixi-3d takes it wherever it takes its own. A member the support copies onto pixi-3d's prototypes is listed in the class's `*_MEMBERS` list, typed in `packages/threejs-compat/src/compat/threeMembers.ts`, and calls pixi-3d's own methods through references kept at load, never through `super`.
- core's renderer (`PixiRenderer`) draws what any 3D package draws; three's settings live in threejs-compat's `ThreeRenderer`, through the protected methods `PixiRenderer` leaves for a subclass.
- Casts name a precise type rather than `any`. `any` is for the rare place a type truly can't be written; say why in a disable comment. _(lint)_

## Imports and exports

- Files inside a package import each other by relative path. Tests, examples and docs import the packages by name: `@react-fiber/threejs-compat`, `/three` and `/addons` for three's API, `@react-fiber/core` and `@react-fiber/2d` for 2D. `tsconfig.base.json` and the Vite aliases resolve those names to the packages' sources, and that is what lets the harness render the same scene through three.
- Type-only imports use `import type` on their own line. _(lint)_ `tsconfig.base.json` leaves out `verbatimModuleSyntax` because the forked code imports types without it; the lint rule holds our files to it instead.
- Each package's entries are written by hand and export the public API by name (`index.ts`, core's `extension.ts`, threejs-compat's `three.ts` and `addons/index.ts`). A name an entry lets out is published, so nothing `@internal` goes through it. threejs-compat's main entry re-exports core whole (`export * from '@react-fiber/core'`), so an r3f app swaps one import.
- Each area module's `index.ts` exports its public classes by name. threejs-compat's `three.ts`, `addons/index.ts` and `catalog/catalog.ts` take every area module whole (`export *`, `import * as`), so a class is added to all three with one line in its area's `index.ts`, and an area module never exports anything `@internal`.
- Export an `@internal` declaration only when another file imports it.
- pixi-3d's prototypes are patched from one place, `installObject3DSurface` in `packages/threejs-compat/src/compat/installObject3DSurface.ts` (which calls `installRaycasting` in `src/compat/Raycaster.ts`), and only when a root loads the support. Nothing patches pixi.js's classes: what 2D needs beyond pixi's own members is 2d's hooks (`objects2D`, `applyProp2D`), and `tests/unit/pixi-prototypes.test.tsx` fails when a package changes a prototype of pixi.js. Importing a package registers it with core and changes no prototype, so core is `"sideEffects": false`; 2d, 3d and threejs-compat register on import.

## Comments and JSDoc

- Every public export has a JSDoc block: what it is and why it exists, as the code stands. The docs' API reference is generated from it, entry by entry. _(lint, for the tags)_
- Each public export carries a `@category` (`core`, `hooks`, `events`, `math`, `catalog`, `renderer`, `types`, `compat`, `constants`) and a tier: `@standard` for what typical apps use, `@advanced` for the rest. Internal declarations carry `@internal`. _(lint)_
- A catalog alias's JSDoc says what differs from three. That is what someone porting an r3f app needs to know.
- `@standard` API carries an `@example` where one helps.
- Comments in code are JSDoc blocks plus tool directives (lint suppressions with a reason, formatter ignores). An explanation that would be a comment goes into a name, a type, a test, or the JSDoc of an extracted declaration. No comments that repeat the code.
- JSDoc prose punctuates with commas, semicolons, colons and full stops, never em or en dashes, and writes a range as "0 to 1". A file's header names its entry in backticks (`` `@react-fiber/core`: ... ``), since a bare `@` reads as a tag.
- The story of how code got its shape (the bug, the alternatives) goes in the commit message, not the JSDoc.

## Per-frame code

- Code the renderer or r3f's core runs every frame doesn't allocate: the renderer's `render`, the camera matrices, `Raycaster.setFromCamera`, `Frustum.intersectsObject`, the hook dispatch. It reuses module-level scratch objects and per-object caches (`WeakMap`s keyed by the camera or node).
- Getters three exposes as fields (`camera.projectionMatrix`, `object.matrixWorld`) work their value out when read, into a cached matrix, so the value is fresh between frames.
- A change that adds work to a per-frame path brings a `benchy` result.

## Resource lifetime

- Whatever you create (a view, a proxy camera, a listener, a cache entry) gets its release in the owner's `dispose()` or `destroy()`. `PixiRenderer.dispose()` frees every view it made and leaves the scenes' children in place; a subclass frees what its settings made in `_releaseSettings` and `_disposeSettings`.
- Caches keyed by scene objects are `WeakMap`s, so a node that's gone isn't held.
- `dispose()` and `destroy()` are idempotent.

## Tests

- Test with pictures first: a visual scene is the default test, drawn through pixi-3d and compared with a reference image (`tests/README.md`). Write a unit test only where there's no picture to compare.
- Look at what you rendered. Open every image you produce and check it shows what you meant; a passing comparison only says it didn't change.
- Parity is measured by rendering the same scene through three: a parity scene imports only `@react-fiber/threejs-compat`, its `/three` and `/addons`, and uses r3f's and three's API, so the harness can point those names at r3f's legacy entry, `three` and three's addons.
- A scene of `@react-fiber/3d`'s elements goes in `tests/scenes/3d`, and an example of a 3d or core guide in `examples/3d` or `examples/core`, which the `native` project runs without threejs-compat: it imports `@react-fiber/core`, `@pixi/3d`, `pixi.js` and, for 2D, `@react-fiber/2d`, and never `@react-fiber/threejs-compat`.
- Every code block of a guide that shows a scene is a snippet of an example (`<!-- snippet: examples/<topic>/<name>.example.tsx#region -->`), so it runs as a scene and `npm run test:docs` holds the block to the file.
- A scene in `tests/scenes/2d` or an example in `examples/2d` runs in the `2d` project, on core and 2d alone, as a 2D app does: it imports neither `@react-fiber/3d` nor threejs-compat, and uses no 3D element.
- A unit test that renders 2D imports `@react-fiber/2d`, as an app does; the scene harness installs it for every scene.

## Commits

- Commit messages start with `feat:`, `fix:`, `chore:`, `breaking:` or `perf:`. Commit as you reach working states. Never push.

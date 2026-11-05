# Coding standards

How code in `react-pixi-fiber` is written. Authors read it before writing code; reviewers check a diff against it. A line marked _(lint)_ or with a script name is checked by tooling, so it's here to get the code right the first time and a reviewer can skip it. Everything else is for the author and the reviewer to hold.

`docs/architecture.md` explains what each part of `src` does; this file says how it's written.

## The vendored r3f core

- `src/r3f` is a byte-for-byte copy of react-three-fiber's `packages/fiber` (`src`, `types`, `package.json`). Never edit it, not even to format it or fix a type. _(`npm run test:lint` runs `scripts/r3f/vendor.mts --check`)_
- To take a new r3f commit, run `npm run sync:repos`, then `npm run vendor:r3f`, then the full test suite. Anything that breaks is fixed in our code, outside `src/r3f`.
- Our only files inside `src/r3f` are the ones `EXTRAS` in `scripts/r3f/vendor.mts` lists: the generated `README.md` and the `react-reconciler` shims at the path r3f's core imports. A new file there needs an entry in `EXTRAS` and a reason in that script's header.
- oxlint and oxfmt skip `src/r3f`, and `tsconfig.json` excludes it as a root, so it's type-checked only through what `src` imports from it. r3f's own entries (`index.tsx`, `legacy.tsx`, `webgpu/`) declare three's JSX elements; no file in `src` imports them. `legacy.tsx` and `support/webgl.ts` stay loadable, because the parity harness renders scenes through them.
- Code in `src` that adapts a vendored file copies it into our tree under its own name and keeps r3f's notice in a `/*!` comment, as `src/root/Canvas.tsx` does.
- Something r3f's core should do differently goes in our layer (support, compat, catalog, renderer) or into an upstream request recorded in `docs/architecture.md`, never into the copy.

## Three is not a dependency

- Nothing reachable from `src/index.tsx` imports `three`, a `three/...` subpath or `@types/three`, as a value or as a type. three is a devDependency only so the vendored entries can render the same scenes through three. _(`npm run test:bundle` on the built package)_
- The entry doesn't re-export a vendored module with `export *` or `export { x } from`: the declarations would name three's types, and a module like `core/components/Environment` would pull three's addons into the bundle. Each value is re-declared in `src/index.tsx` with a type from `src/types`, which names pixi-3d.
- Public types are ours, in `src/types`, typed against pixi-3d and the catalog. A type from `#types` (r3f's) appears only in files the declaration bundle never reaches: the provider and the wrappers around core calls.

## Classes and files

- Each class gets its own file beside the files of its kind: catalog aliases in `src/catalog`, three-shaped math and picking in `src/compat`, the renderer in `src/renderer`.
- Every class member has an explicit `public`, `protected`, or `private`, except constructors. Private members are named `_camelCase`, and members that are never reassigned are `readonly`.
- Class fields typed `number` get an initializer even when the constructor assigns the real value: `public aspect: number = 1;`.
- A catalog alias keeps three's class name, constructor signature and defaults, and maps them onto the pixi-3d class it extends. Where pixi-3d's default differs from three's (a mesh's shadows, a material's metalness), the alias passes three's.
- Casts name a precise type rather than `any`. `any` is for the rare place a type truly can't be written; say why in a disable comment. _(lint)_

## Imports and exports

- Files in `src` import each other by relative path. Tests, examples and docs import the library as `react-pixi-fiber`, which `tsconfig.json` and the Vite aliases resolve to `src/index.tsx`. That name is what lets the harness render the same scene through three.
- Type-only imports use `import type` on their own line. _(lint)_ `tsconfig.json` leaves out `verbatimModuleSyntax` because the vendored code imports types without it; the lint rule holds our files to it instead.
- `src/index.tsx` is written by hand and exports the public API by name. A name it lets out is published, so nothing `@internal` goes through it.
- Export an `@internal` declaration only when another file imports it.
- pixi-3d's prototypes are patched in one place, `src/compat/installObject3DSurface.ts`, and only when a root loads the support (`loadPixiSupport`). Importing the package changes nothing on its own, which is what `"sideEffects": false` promises.

## Comments and JSDoc

- Every public export has a JSDoc block: what it is and why it exists, as the code stands. The docs' API reference is generated from it. _(lint, for the tags)_
- Each public export carries a `@category` (`core`, `hooks`, `events`, `math`, `catalog`, `renderer`, `types`, `compat`, `constants`) and a tier: `@standard` for what typical apps use, `@advanced` for the rest. Internal declarations carry `@internal`. _(lint)_
- A catalog alias's JSDoc says what differs from three. That is what someone porting an r3f app needs to know.
- `@standard` API carries an `@example` where one helps.
- Comments in `src` are JSDoc blocks plus tool directives (lint suppressions with a reason, formatter ignores). An explanation that would be a comment goes into a name, a type, a test, or the JSDoc of an extracted declaration. No comments that repeat the code.
- JSDoc prose punctuates with commas, semicolons, colons and full stops, never em or en dashes, and writes a range as "0 to 1".
- The story of how code got its shape (the bug, the alternatives) goes in the commit message, not the JSDoc.

## Per-frame code

- Code the renderer or r3f's core runs every frame doesn't allocate: the renderer's `render`, the camera matrices, `Raycaster.setFromCamera`, `Frustum.intersectsObject`. It reuses module-level scratch objects and per-object caches (`WeakMap`s keyed by the camera or node).
- Getters three exposes as fields (`camera.projectionMatrix`, `object.matrixWorld`) work their value out when read, into a cached matrix, so the value is fresh between frames.
- A change that adds work to a per-frame path brings a `benchy` result.

## Resource lifetime

- Whatever you create (a view, a proxy camera, a listener, a cache entry) gets its release in the owner's `dispose()` or `destroy()`. `PixiRenderer.dispose()` frees every view it made and leaves the scenes' children in place.
- Caches keyed by scene objects are `WeakMap`s, so a node that's gone isn't held.
- `dispose()` and `destroy()` are idempotent.

## Tests

- Test with pictures first: a visual scene is the default test, drawn through pixi-3d and compared with a reference image (`tests/README.md`). Write a unit test only where there's no picture to compare.
- Look at what you rendered. Open every image you produce and check it shows what you meant; a passing comparison only says it didn't change.
- Parity is measured by rendering the same scene through three: a scene imports only `react-pixi-fiber` and uses r3f's API, so the harness can point that name at the vendored legacy entry.

## Commits

- Commit messages start with `feat:`, `fix:`, `chore:`, `breaking:` or `perf:`. Commit as you reach working states. Never push.

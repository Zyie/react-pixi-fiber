# react-three-fiber with renderer hooks

A fork of [react-three-fiber](https://github.com/pmndrs/react-three-fiber)'s `packages/fiber` (`src`,
`types`) at `v10` commit `58acabc0fc996bac5a25320ca3a8670bdd209db7`, published in this repo as
`@react-fiber/r3f`. Core keeps React's
tree, props, events and the frame loop. Where it reached into three.js objects, it now asks the root's
renderer support through eight hooks. three's two supports implement them with the code core ran before,
so three.js apps behave as they did, and r3f's own test suite passes unchanged.

react-pixi-fiber runs pixi.js 2D and `@pixi/3d` on this core with a support of its own: its
`@react-fiber/core` package bundles this core and gives roots a renderer support that the 2D and 3D
packages fill.

The whole change is [`fork.diff`](./fork.diff): <!-- diff-size -->16 files changed, 267 lines added, 127 lines removed<!-- /diff-size -->.
`npm run diff:r3f` writes it, and `npm run test:lint` fails when it is stale.

## The interface

From `types/provider.d.ts`, without the doc comments:

```ts
export interface Hit {
  object: object
  index?: number
  instanceId?: number
}

export interface RendererHooks {
  add(parent: object, child: object, before?: object): void
  remove(parent: object, child: object): void
  isInteractive(object: object): boolean
  defaultAttach(object: object): string | undefined
  applyProp(object: object, key: string, value: unknown): boolean
  hitTest(object: object, event: DomEvent, state: object): Hit[]
  compareHits(a: Hit, b: Hit): number
  dispose(object: object): void
}

export interface RendererSupport extends RendererHooks {
  kind: string
  three: object
  catalog: object
  Renderer: new (parameters: any) => object
}

export interface WebGLSupport extends RendererSupport {
  kind: 'webgl'
  three: typeof ThreeLegacy
  catalog: typeof ThreeLegacy
  // Renderer, RenderTarget, CubeRenderTarget as before
}

export interface WebGPUSupport extends RendererSupport {
  kind: 'webgpu'
  three: typeof ThreeWebGPU
  catalog: typeof ThreeWebGPU
  // Renderer, RenderTarget, CubeRenderTarget, CanvasTarget, occlusion as before
}

export interface RendererProvider {
  webgl?: () => RendererSupport | Promise<RendererSupport>
  webgpu?: () => RendererSupport | Promise<RendererSupport>
}
```

`Hit` is what core reads of a hit to dedupe and bubble it; three's `Intersection` is one. `hitTest` takes
the object's root state as `object` because each renderer types its own state; three's hook declares it
as `RootState`.

three's hooks are in `src/support/threeHooks.ts`, which both `support/webgl.ts` and `support/webgpu.ts`
spread. It imports nothing from three.

## The hooks

| Hook                            | What core did before                                                                                                                                                                                                                                                                     | Where core calls it                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add(parent, child, before?)`   | `parent.add(child)`; to insert before a sibling, it spliced `parent.children`, set `child.parent` and dispatched `added` and `childadded`                                                                                                                                                | `handleContainerEffects` (append, insert, keyed move), `swapReconstructedInstances`, a portal's injected scene, the default camera joining the root's scene           |
| `remove(parent, child)`         | `parent.remove(child)`                                                                                                                                                                                                                                                                   | `removeChild`, `swapReconstructedInstances`, a portal's injected scene                                                                                                |
| `isInteractive(object)`         | `isObject3D(object)`                                                                                                                                                                                                                                                                     | the add and remove gates, `hideInstance` and `unhideInstance`, handler and visibility registration in `applyProps`                                                    |
| `defaultAttach(object)`         | `isBufferGeometry` attached to `geometry`, `isMaterial` to `material`                                                                                                                                                                                                                    | `applyProps`, for an element with no `attach`                                                                                                                         |
| `applyProp(object, key, value)` | assigned a prop that no value rule (`set`, `copy`, `fromArray`, ...) took; reset a prop an update removed to the value a fresh instance holds; attached a child with `parent[key] = child`, into an array for `foo-0`, and on detach wrote back the value it replaced or deleted the key | `applyProps`, for each prop before it is resolved; `diffProps`, with `undefined` for each removed prop before its reset; `attach` and `detach`, for a string `attach` |
| `hitTest(object, event, state)` | `object.updateWorldMatrix(true, true)`, then `state.raycaster.intersectObject(object, true)`                                                                                                                                                                                             | `intersect` in `core/events.ts`, for each object in `internal.interaction`                                                                                            |
| `compareHits(a, b)`             | `a.distance - b.distance`                                                                                                                                                                                                                                                                | the hit sort in `intersect`, after `interactivePriority` and the roots' event priority                                                                                |
| `dispose(object)`               | `object.dispose()` when it has one and isn't a `Scene`                                                                                                                                                                                                                                   | `removeChild`, `swapReconstructedInstances`                                                                                                                           |

Why each one is needed:

- **`add`, `remove`.** The insert spliced three's `children` array and set `parent` by hand. A renderer
  whose containers do more on insertion can't take that: pixi-3d's `addChildAt` attaches the node to the
  view that draws it, and a 2D object added to a 3D scene goes on a 2D layer, not into `children` at all.
  Before the hook, react-pixi-fiber listened for the `added` event to undo the splice and insert again.
- **`isInteractive`.** `isObject3D` is three's flag. It decides which objects are nodes: core adds them to
  their parent, hides them through `visible` and registers their handlers. A renderer answers it for its
  own classes instead of setting the flag on them.
- **`defaultAttach`.** `isBufferGeometry` and `isMaterial` are three's flags. Another renderer's geometry
  and material classes attach the same way when the hook names them.
- **`applyProp`.** Assignment is how three takes a prop, but not every renderer's fields are written
  that way. pixi.js's `filters` hands out a frozen copy, so `attach="filters-0"` can't write into it; its
  `mask` reads `undefined` when unset, so a detach's `delete` leaves the mask on; and some of what an
  element sets is a method, such as `cacheAsTexture`, or behind a read-only getter, such as an
  `AnimatedSprite`'s `playing`. Before the hook, react-pixi-fiber patched those members on pixi.js's
  prototypes, for every app on the page. The hook lets a renderer take the keys it handles and returns
  `false` for the rest, which core writes as before; three's takes none. A prop an update removes comes
  to the hook as `undefined` first: core's reset writes what a fresh instance holds, and pixi's `mask` and
  `filters` read `undefined` on a fresh instance, which `applyProps` skips, so without the call a removed
  `mask` stayed on.
- **`hitTest`.** Casting the ray is the renderer's. Core keeps everything around it: `events.compute` and
  the per-layer `raycaster.camera` protocol, `events.enabled`, `userData.interactivePriority`, the roots'
  event priority, dedupe, `events.filter`, bubbling through `parent`, and pointer capture.
- **`compareHits`.** Distance along the ray orders three's hits, but not hits that aren't on a ray: 2D
  drawn over or under the 3D, or a scene drawn inside a 2D panel or into a texture. Before the hook,
  react-pixi-fiber gave 2D hits fake distances (`-1e9` and `1e15` plus their draw order) and squeezed a
  nested layer's hits into a range of distances. Its support now orders hits by where they are drawn and
  leaves `distance` as the ray's.
- **`dispose`.** How an object is freed is the renderer's: pixi frees with `destroy`. Core keeps when: at
  idle priority, at once in an `act` environment, never for a primitive or under `dispose={null}`. Core
  can't tell whether an object has anything to free, so it now schedules the hook for every removed
  object, where it used to schedule only objects with a `dispose` method.

## Other changes

- **`kind` is open.** `RendererSupport` is the interface every support implements, no longer the union of
  three's two. `WebGLSupport` and `WebGPUSupport` extend it, and `R3FRendererSupport`, the type of
  `state.internal.support`, stays their union. The provider's slots take any support; one that isn't
  three's goes in `webgpu`, whose path awaits the renderer's `init()`.
- **`catalog` is split from `three`.** JSX names resolve in `support.catalog` (`resolveConstructor` in
  `core/extend.ts`). `three` stays what `registerThree` takes: the classes core builds its own raycaster,
  default scene and camera, pointer and frustum from. three passes its namespace for both. Another
  renderer can keep core's classes out of its JSX names.
- **Supports written before the hooks keep working.** `initializeRenderer` fills a missing hook with
  three's and a missing `catalog` with `three`, so a support without them, such as the hand-built mock in
  `tests/webgl2-fallback-multicanvas.test.tsx`, runs as it did.
- **Core keys objects itself.** Hover and capture entries, the visibility registry and a portal's key
  were keyed by `object.uuid`; they are now keyed by `getObjectId(object)` (`core/utils/objectId.ts`), a
  string core keeps per object in a `WeakMap`. three's keys were unique per object and so are these, so
  nothing changes for three, and a scene graph without `uuid` (pixi.js's 2D, @pixi/3d's nodes) gets
  distinct keys. It isn't exported, so the public API is unchanged.
- **`getRootState` walks `parent`.** For a hit on an object with no element (a node inside a
  `<primitive>`), core found the root through `traverseAncestors`, three's method. It now walks
  `parent` itself and keeps the outermost ancestor with a root, as three's `traverseAncestors` did, since
  it ignores the callback's `return false`. Behavior inside portals is the same.
- **The default camera joins the scene through `add`.** `configure()` and the store added the default
  camera to the root's scene with `scene.add(camera)`; they now call the support's `add` hook, as every
  other tree change does, so the root's scene needs no `add` method of its own.

## What core still reads on objects

Each place below assumes three's shape and has no hook, because three's support and a renderer's own
classes answer it:

- **Core's own objects** (`configuration.ts`, `store.ts`, `portal.tsx`, `renderer.ts`, `events.ts`): the
  default raycaster, camera and scene, `pointer` and `frustum`, built from `Raycaster`,
  `PerspectiveCamera`, `OrthographicCamera`, `Scene`, `Vector2`, `Vector3` and `Frustum` in
  `support.three`, and `useTexture`'s loader, `TextureLoader`. Core calls `raycaster.camera`,
  `setFromCamera` and `ray`; a camera's `isCamera`, `position`, `lookAt(x, y, z)`, `aspect` or bounds,
  `zoom`, `fov`, `manual`, `updateProjectionMatrix`, `getWorldPosition`, `projectionMatrix` and
  `matrixWorldInverse`; a scene's `isScene`; a vector's `isVector3`, `copy` and `unproject`; and the
  frustum's `setFromProjectionMatrix`, `clone` and `intersectsObject`. The support already hands over
  these classes, and a renderer giving classes with these members is a smaller contract than a hook per
  object. react-pixi-fiber's `@react-fiber/core` gives @pixi/3d's camera, scene, vector and frustum
  classes with these members, and a raycaster that picks with @pixi/3d's hit volumes, so a root needs
  nothing three-shaped.
- **`applyProps` value writes**: `set`, `copy`, `fromArray`, `setScalar`, `isColor`, a layers `mask` and
  `ShaderMaterial` uniforms, else plain assignment. They are duck typed: a value no rule matches is
  assigned, and the renderer's own setters take it, unless its `applyProp` took the key first.
- **Visibility** (`onFramed`, `onOccluded`, `onVisible`): `frustum.intersectsObject(object)` and
  `object.visible`, with occlusion only when `kind` is `'webgpu'`. It runs only for objects with those
  handlers, through the support's `Frustum`.
- **Color management and renderer setup**: `outputColorSpace`, `toneMapping` and `shadowMap` on the
  renderer, and a texture's `colorSpace` for three's textures. They are written on the renderer the
  support constructed, which takes or ignores them.
- **Events and hiding**: `parent` (bubbling, and `getRootState` for a hit object with no element),
  `visible`, `userData.interactivePriority` and `raycast !== null` (the opt-out). Most scene graphs
  have them.

## Running r3f's tests on the fork

Upstream at this commit and the fork give the same result: 62 test files, 754 tests passed and 4 todo.
`pnpm typecheck`, `prettier --check` and `eslint` are as clean as upstream's, which has one unused-import
warning in `src/webgpu/index.tsx`.

```sh
git clone https://github.com/pmndrs/react-three-fiber && cd react-three-fiber
git checkout 58acabc0fc996bac5a25320ca3a8670bdd209db7
git apply /path/to/fork.diff
pnpm install && pnpm typecheck && pnpm vitest run packages/fiber
```

The diff's paths start at the repository's root (`packages/fiber/src/...`), so apply it there: git skips,
without an error, every path outside the folder it runs in. `npm run test:lint` applies it in a fresh git
checkout of upstream's files and fails unless that gives the fork's files exactly.

## Our files

- `fork.diff` and this README.
- `package.json`: upstream's, under the name `@react-fiber/r3f`. Upstream's workspace depends on the
  package as `@react-three/fiber`, so the rename stays out of the diff.
- `tsconfig.json` and `tsdown.config.ts`: the build of upstream's four entries (`index`, `legacy`,
  `webgpu`, `extension`) into `dist`, in place of upstream's `build.config.ts`, which isn't copied.
- `react-reconciler/`: re-exports of the npm package at the path core imports. Upstream generates an ESM
  build there at install time; ours names each constant, because `export *` from its CommonJS `constants`
  module loses exports under Vite.

To move to a newer upstream commit: in a full clone of r3f at that commit, apply `fork.diff` at the
clone's root with `git apply -3 /path/to/fork.diff` (the clone has this commit's files for the 3-way
merge) and resolve what conflicts. Copy its `src` and `types` over these, and its `package.json` with our name, pin the commit in
`scripts/repos/manifest.mts`, run `npm run sync:repos react-three-fiber`, then `npm run diff:r3f` and the
full test suite.

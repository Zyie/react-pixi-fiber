# react-three-fiber with renderer hooks

A fork of [react-three-fiber](https://github.com/pmndrs/react-three-fiber)'s `packages/fiber` (`src`,
`types`) at `v10` commit `58acabc0fc996bac5a25320ca3a8670bdd209db7`, published in this repo as
`@react-fiber/r3f`. Core keeps React's
tree, props, events and the frame loop. Where it reached into three.js objects, it now asks the root's
renderer support through seven hooks. three's two supports implement them with the code core ran before,
so three.js apps behave as they did, and r3f's own test suite passes unchanged.

react-pixi-fiber runs pixi.js 2D and `@pixi/3d` on this core with a support of its own: its
`@react-fiber/core` package bundles this core and gives roots a renderer support that the 2D and 3D
packages fill.

The whole change is [`fork.diff`](./fork.diff): <!-- diff-size -->12 files changed, 201 lines added, 102 lines removed<!-- /diff-size -->.
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

| Hook                            | What core did before                                                                                                                 | Where core calls it                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `add(parent, child, before?)`   | `parent.add(child)`; to insert before a sibling, it spliced `parent.children`, set `child.parent` and dispatched `added` and `childadded` | `handleContainerEffects` (append, insert, keyed move), `swapReconstructedInstances`, a portal's injected scene |
| `remove(parent, child)`         | `parent.remove(child)`                                                                                                               | `removeChild`, `swapReconstructedInstances`, a portal's injected scene                                        |
| `isInteractive(object)`         | `isObject3D(object)`                                                                                                                 | the add and remove gates, `hideInstance` and `unhideInstance`, handler and visibility registration in `applyProps` |
| `defaultAttach(object)`         | `isBufferGeometry` attached to `geometry`, `isMaterial` to `material`                                                                | `applyProps`, for an element with no `attach`                                                                  |
| `hitTest(object, event, state)` | `object.updateWorldMatrix(true, true)`, then `state.raycaster.intersectObject(object, true)`                                         | `intersect` in `core/events.ts`, for each object in `internal.interaction`                                    |
| `compareHits(a, b)`             | `a.distance - b.distance`                                                                                                            | the hit sort in `intersect`, after `interactivePriority` and the roots' event priority                         |
| `dispose(object)`               | `object.dispose()` when it has one and isn't a `Scene`                                                                               | `removeChild`, `swapReconstructedInstances`                                                                    |

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

## What core still reads on objects

Each place below assumes three's shape and has no hook, because three's support and a renderer's own
classes answer it:

- **Core's own objects** (`configuration.ts`, `store.ts`, `portal.tsx`, `renderer.ts`, `events.ts`): the
  default raycaster, camera and scene, `pointer` and `frustum`, built from `Raycaster`,
  `PerspectiveCamera`, `OrthographicCamera`, `Scene`, `Vector2`, `Vector3` and `Frustum` in
  `support.three`. Core calls `raycaster.camera`, `setFromCamera` and `ray`; a camera's `position`,
  `lookAt`, `aspect` or bounds, `zoom`, `fov`, `manual`, `updateProjectionMatrix`, `getWorldPosition`,
  `projectionMatrix` and `matrixWorldInverse`; `scene.add(camera)`; `Vector3.unproject`; and
  `Frustum.setFromProjectionMatrix`. The support already hands over these classes, and a renderer giving
  classes with these members is a smaller contract than a hook per object.
- **`applyProps` value writes**: `set`, `copy`, `fromArray`, `setScalar`, `isColor`, a layers `mask` and
  `ShaderMaterial` uniforms, else plain assignment. They are duck typed: a value no rule matches is
  assigned, and the renderer's own setters take it.
- **Visibility** (`onFramed`, `onOccluded`, `onVisible`): `frustum.intersectsObject(object)` and
  `object.visible`, with occlusion only when `kind` is `'webgpu'`. It runs only for objects with those
  handlers, through the support's `Frustum`.
- **Color management and renderer setup**: `outputColorSpace`, `toneMapping` and `shadowMap` on the
  renderer, and a texture's `colorSpace` for three's textures. They are written on the renderer the
  support constructed, which takes or ignores them.
- **Events and hiding**: `uuid` (dedupe and hover keys, the visibility registry), `traverseAncestors`
  (`getRootState`, for a hit object with no element), `parent` (bubbling), `visible`,
  `userData.interactivePriority` and `raycast !== null` (the opt-out). Most scene graphs have them. A
  renderer without `uuid` or `traverseAncestors` would need core to keep an id of its own and walk
  `parent`. Walking `parent` to the nearest managed ancestor changes three's behavior inside a portal:
  three's `traverseAncestors` ignores the callback's `return false`, so the outermost managed ancestor
  wins today. That is left for a separate change.

## Running r3f's tests on the fork

Upstream at this commit and the fork give the same result: 62 test files, 754 tests passed and 4 todo.
`pnpm typecheck`, `prettier --check` and `eslint` are as clean as upstream's, which has one unused-import
warning in `src/webgpu/index.tsx`.

```sh
git clone https://github.com/pmndrs/react-three-fiber && cd react-three-fiber
git checkout 58acabc0fc996bac5a25320ca3a8670bdd209db7
(cd packages/fiber && git apply /path/to/fork.diff)
pnpm install && pnpm typecheck && pnpm vitest run packages/fiber
```

## Our files

- `fork.diff` and this README.
- `package.json`: upstream's, under the name `@react-fiber/r3f`. Upstream's workspace depends on the
  package as `@react-three/fiber`, so the rename stays out of the diff.
- `tsconfig.json` and `tsdown.config.ts`: the build of upstream's four entries (`index`, `legacy`,
  `webgpu`, `extension`) into `dist`, in place of upstream's `build.config.ts`, which isn't copied.
- `react-reconciler/`: re-exports of the npm package at the path core imports. Upstream generates an ESM
  build there at install time; ours names each constant, because `export *` from its CommonJS `constants`
  module loses exports under Vite.

To move to a newer upstream commit: in a full clone of r3f at that commit, apply `fork.diff` in
`packages/fiber` with `git apply -3` (the clone has this commit's files for the 3-way merge) and resolve
what conflicts. Copy its `src` and `types` over these, and its `package.json` with our name, pin the commit in
`scripts/repos/manifest.mts`, run `npm run sync:repos react-three-fiber`, then `npm run diff:r3f` and the
full test suite.

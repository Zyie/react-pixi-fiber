# Architecture

react-pixi-fiber renders react-three-fiber (r3f) v10 with pixi-3d. r3f's own core runs unchanged; pixi-3d plugs into it as a renderer support, and a thin layer gives pixi-3d the three.js surface that core and r3f apps reach for. The goal is that an r3f app only swaps its import.

`docs/feasibility.md` has the findings this design rests on. `CODING_STANDARDS.md` says how the code is written.

```
src/index.tsx           the public entry: r3f's API, typed against pixi-3d
  src/root/             createRoot and <Canvas>, bound to the pixi provider
  src/support/          pixi-3d as an r3f renderer support (kind 'pixi')
  src/renderer/         PixiRenderer: three's renderer surface over pixi.js and View3Ds
  src/catalog/          classes under three's names (<mesh>, <boxGeometry>, ...) and three's constants
  src/compat/           three's members on pixi-3d classes; Vector3, Raycaster, Frustum
  src/types/            RootState, ThreeElements, events, props: our types, naming pixi-3d
  src/r3f/              r3f's packages/fiber, vendored byte for byte; never edited
```

## The vendored core

`src/r3f` mirrors `packages/fiber` of react-three-fiber's `v10` branch: `src`, `types` and `package.json`, so `diff -r` against `.repos/react-three-fiber/packages/fiber` works. `scripts/r3f/vendor.mts --check` fails on any difference and runs in `npm run test:lint`; `npm run vendor:r3f` resyncs after `npm run sync:repos`. The generated `README.md` names the upstream commit.

We add two kinds of file, listed in the script's `EXTRAS`:

- `react-reconciler/{index,constants}.{js,d.ts}`, at the relative path core imports. Upstream generates an ESM build of react-reconciler there at install time; ours re-exports the npm package, naming each constant, because `export *` from its CommonJS `constants` module loses exports under Vite.
- `README.md`, written by the script.

Core never imports `three` for a value. It reaches three through three seams, and each is ours to fill:

- `getThree()` (`core/three.ts`): the namespace the first root's support registers. Core builds `Raycaster`, `Vector3`, `Scene`, `PerspectiveCamera`, `Frustum` and reads a few constants from it.
- `resolveConstructor()` (`core/extend.ts`): an element name resolves through `extend()` registrations, then `support.three` of the root's renderer.
- Duck typing: `isObject3D`, `isCamera`, `isScene`, `isBufferGeometry`, `isMaterial`, `uuid`, `add`/`remove`, `raycast`, `dispose`. Core never uses `instanceof`.

We use core's modules (root, reconciler, store, loop, events, portal, hooks) through `src/index.tsx`. We don't use `core/components/Environment` or `core/hooks/useEnvironment` (three's addons), r3f's entries (`index.tsx`, `legacy.tsx`, `webgpu/`), `web/Canvas.tsx` (it imports Environment) or `support/*` (three's renderers). They stay in the copy, unedited. `legacy.tsx` and `support/webgl.ts` matter: the parity harness renders scenes through them.

## The support

`src/support/pixiSupport.ts` is the object r3f's core loads when a root is configured, with the same shape as r3f's `support/webgpu.ts`:

| Field                                                           | Value                                                                                                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                                                          | `'pixi'`. Core's only branch on it tests for `'webgl'` (`core/renderer.ts`), so a pixi root takes the path that awaits the renderer's async `init()`, and the WebGL-only occlusion gate stays off. |
| `three`                                                         | The catalog (below).                                                                                                                                                                               |
| `Renderer`                                                      | `PixiRenderer`.                                                                                                                                                                                    |
| `RenderTarget`, `CubeRenderTarget`, `CanvasTarget`, `occlusion` | Not available yet.                                                                                                                                                                                 |

`src/support/provider.ts` offers it in the provider's `webgpu` slot, the one whose path awaits `init()`. The loader, `loadPixiSupport()`, first runs `installObject3DSurface()`, so the prototype patches happen when the first root configures and never on import.

`src/root/createRoot.ts` wraps core's `createRoot(canvas, provider)`. Its `configure` reads `gl` as `renderer`, so code written for `@react-three/fiber/legacy` runs, and forces `share: false`: pixi.js can't draw one renderer into several canvases, so every canvas gets its own and `primary` is ignored.

`src/root/Canvas.tsx` is r3f's `web/Canvas.tsx`, adapted: same measuring, Suspense blocking, error boundary, event wiring and teardown, without three's `<Environment>`. `background` takes a colour, which it puts on `scene.background`.

## The compat layer

`src/compat/installObject3DSurface.ts` patches pixi-3d's prototypes once, so every node answers core's duck-typed checks, including nodes pixi-3d builds itself (glTF nodes passed to `<primitive>`):

- `Container3D`: `isObject3D`, `uuid` (from `uid`), `name` (over `label`), `userData`, `matrixWorld`, `add`, `remove`, `traverse`, `traverseVisible`, `traverseAncestors`, `getWorldPosition`, `lookAt(x, y, z)`, `updateWorldMatrix` and `updateMatrixWorld` (no-ops, since world transforms are worked out when read), `raycast` (a no-op) and `dispose` (`destroy`).
- `dispatchEvent('added')`: core inserts before a sibling by splicing `parent.children` and setting `parent` itself. On that event the child is spliced back out and re-added through the public `addChildAt`, so the view attaches it and pixi-3d's own events fire.
- `Mesh3D.raycast`: three's `Mesh.raycast` over pixi-3d's `intersectRayGeometry`.
- `Camera3D`: `isCamera`, `isPerspectiveCamera`, `isOrthographicCamera`, and `projectionMatrix`, `projectionMatrixInverse`, `matrixWorldInverse` worked out when read (`cameraMatrices.ts`). pixi-3d fills `camera.projection` and `camera.view` only while drawing, so they're a frame old between frames and identity before the first one.
- `Geometry3D.isBufferGeometry`, `BaseMaterial3D.isMaterial`, and `dispose` on both, so `<boxGeometry>` attaches to `geometry` and unmounting frees it.
- `Mesh3D.defaultOptions` gets a placeholder geometry and material, because core constructs `<mesh3D>` with no arguments and attaches them afterwards. The placeholder geometry is a zero-size box, which draws and picks nothing, like three's empty `BufferGeometry`.

The patches are typed: `PixiMixins.Container3D` and the `@pixi/3d` module are augmented with `Object3DMembers` and `CameraMembers`.

Three-shaped classes core builds by name:

- `Vector3`, `Vector2`: pixi-3d's vectors plus `copy`, `setScalar`, `sub`, `lerp`, `length`, `project`, `unproject`, `isVector3`.
- `Frustum`: pixi-3d's plus `intersectsObject`, for `onFramed` and `onVisible`. A mesh is tested by the sphere around its geometry's bounds in world space.
- `Raycaster`: builds its ray from the camera's own matrices (any camera picks, not only one a view draws with), walks objects through their `raycast` method as three does, and returns three's intersection shape: `distance`, `point`, `object`, `face` (`a`, `b`, `c`, `normal`), `faceIndex`, `uv`, `normal`. As in three, hidden objects are hit, and a single-sided material isn't hit from behind.

## The catalog

`src/catalog/catalog.ts` builds the namespace core reads as `getThree()` and resolves element names in: pixi-3d's exports, then the three-named classes, then three's constants.

- pixi-3d's own names stay reachable: `<mesh3D>`, `<cubeGeometry>`, `<material3D>`, `<flatMaterial>`, with pixi-3d's options-object constructors.
- Three-named aliases win over pixi-3d classes of the same name (`SphereGeometry`, `AmbientLight`, `DirectionalLight`, `PointLight`, `PlaneGeometry`), whose options-object constructors would ignore three's positional `args`. Each alias extends the pixi-3d class, takes three's constructor and defaults, and renames fields (`color` over `baseColor`, `metalness` over `metallic`, `opacity` over `alpha`, `transparent` over `alphaMode`).
- Today: `Scene`, `Object3D`, `Group`, `Mesh`, `PerspectiveCamera`, `OrthographicCamera`, `BoxGeometry`, `SphereGeometry`, `PlaneGeometry`, `MeshStandardMaterial`, `MeshBasicMaterial`, `AmbientLight`, `DirectionalLight`, `PointLight`, `TextureLoader`, plus `Vector2`, `Vector3`, `Frustum`, `Raycaster`.
- `DirectionalLight` starts one unit up and shines at its `target`, as three's does; the renderer turns it toward the target before each frame, since pixi-3d's light shines along its local -Z.
- `OrthographicCamera` turns three's frustum bounds into pixi-3d's `orthographicSize` (half the width) in `updateProjectionMatrix`, which core calls on every resize.

`ThreeElements` in `src/index.tsx` is the JSX element map over the catalog's type, and augments React's `JSX.IntrinsicElements`. A catalog class whose name HTML already uses is reachable with a `three` prefix: pixi-3d's `Track` is `<threeTrack>`.

## The renderer facade

`src/renderer/PixiRenderer.ts` answers what core calls on a renderer:

- `init()` creates the pixi.js renderer on the canvas (`autoDetectRenderer`, WebGL first unless `preference: 'webgpu'`), with a transparent background unless `alpha: false`, as three's. `backend.isWebGPUBackend` is set when pixi.js picks WebGPU.
- `setSize`, `setPixelRatio`, `getSize`, `getPixelRatio`, `setClearColor`, `setClearAlpha`, `clear`, `autoClear`, `domElement`.
- `render(scene, camera)` keeps a `Map<scene, View3D>`, making a view (and a pixi container holding it) the first time a scene is drawn. A HUD, portal or offscreen scene gets its own view instead of rebuilding one view every frame. When the camera is in the scene, the view draws with it; any other camera is copied each frame onto a proxy camera the facade adds to the scene (settings, and the transform relative to the scene).
- `releaseView(scene)` frees a scene's view and leaves its children in place. `dispose()` frees every view and the pixi.js renderer.
- `getView(scene)` hands out the view for pixi-3d settings with no three counterpart: passes, environment, fog, culling.

three's renderer settings reach each view as it draws:

| three                                                                                  | pixi-3d                                                                   |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `toneMapping`: `NoToneMapping`, `LinearToneMapping`                                    | `view.toneMapping = 'none'`                                               |
| `ReinhardToneMapping`                                                                  | `'reinhard'`                                                              |
| `CineonToneMapping`                                                                    | `'uncharted2'` (closest filmic curve)                                     |
| `ACESFilmicToneMapping` (r3f's default)                                                | `'aces'`                                                                  |
| `AgXToneMapping`, `NeutralToneMapping`                                                 | `'aces'` (pixi-3d has neither)                                            |
| `toneMappingExposure`                                                                  | `view.exposure`                                                           |
| `shadowMap.type`: `BasicShadowMap`, `PCFShadowMap`, `PCFSoftShadowMap`, `VSMShadowMap` | `view.shadowFilter`: `'hard'`, `'pcf'`, `'pcf-high'`, `'pcf-high'`        |
| `shadowMap.enabled`                                                                    | Lights cast shadows only while it's on (`DirectionalLight.canCastShadow`) |
| `scene.background` (a colour)                                                          | `view.background`                                                         |
| `outputColorSpace`                                                                     | Kept, inert: pixi-3d always writes sRGB                                   |

## The entry and its types

`src/index.tsx` mirrors r3f's `index.tsx` export list: `Canvas`, `createRoot`, `events`, `extend`, `useThree`, `useFrame`, `useLoader`, `useTexture`, `useGraph`, `useInstanceHandle`, `useStore`, `createPortal`, `invalidate`, `advance`, `flushSync`, `act`, `applyProps`, `dispose`, `getRootState`, `context`, `getThree`, `registerRootExtension`, `setRenderOverride`, `getScheduler`, and the rest. Each value is core's own function, re-declared with a type from `src/types`, which names pixi-3d. Nothing is `export *`'d from the copy, so the declaration bundle never names three, and modules like Environment never enter the bundle. `npm run test:bundle` checks the built package.

Left out until they work on pixi-3d: `Environment`, `useEnvironment`, `useRenderTarget` (no render targets yet), `useTextures` (its `dispose` calls three's `Texture.dispose`), and the multi-canvas registry (`registerPrimary`, ...).

## How a frame flows

1. `<Canvas>` measures its container and calls `createRoot(canvas).configure(props)`. The first configure loads the support (`loadPixiSupport`, which installs the compat patches), registers the catalog as `getThree()`, constructs `PixiRenderer` with `{ canvas, antialias }` plus the `renderer` prop, sizes it and awaits `init()`. Core then creates the default `Raycaster`, camera (`PerspectiveCamera(50, 0, 0.1, 1000)` at z = 5, looking at the origin) and `Scene` from the catalog, adds the camera to the scene, sets ACES tone mapping and applies `shadows`.
2. `root.render(children)` mounts the tree with r3f's reconciler. Each element resolves to a catalog class, is constructed with `args`, gets its props through core's `applyProps`, and joins its parent through `add` (or `dispatchEvent('added')` when inserted before a sibling). Children with `isBufferGeometry` or `isMaterial` attach to the parent's `geometry` or `material`.
3. Every frame, `@pmndrs/scheduler` runs the root's jobs: deferred pointer raycasts, `useFrame` callbacks by phase, then the frustum job (`updateFrustum`, reading the camera's fresh matrices) and the visibility job (`Frustum.intersectsObject` for `onFramed` and `onVisible`), then the render job.
4. The render job calls `renderer.render(state.scene, state.camera)`. The facade finds or makes the scene's view, points it at the camera (or the proxy), copies the tone mapping, exposure, shadow settings and background onto it, aims each `DirectionalLight` at its target, and calls `pixi.render()` on the view's container. pixi-3d's `View3D` runs its transform pass and draws.
5. A pointer event on the canvas reaches core's event layer, which sets `state.pointer`, calls `raycaster.setFromCamera(pointer, camera)`, and asks the raycaster to intersect each object that has a handler. Hits are sorted, bubbled up the tree and handed to the handlers as `ThreeEvent`s.
6. Unmounting removes each element through `remove` and calls `dispose` on it (`destroy` for nodes, geometries and materials). Unmounting the root releases the renderer, whose `dispose()` frees every view and the pixi.js renderer.

## Measuring parity against three

Scenes, examples and docs import the library only as `react-pixi-fiber`. `tsconfig.json` and the Vite aliases resolve that name to `src/index.tsx`. Pointing the alias at `src/r3f/src/legacy.tsx` instead renders the same scene file through r3f's own WebGL entry and real three.js. That is how parity is measured.

Two rules follow:

- A parity scene uses only names both entries export: r3f's API (`Canvas`, `useFrame`, `useThree`, ...) and JSX elements. The catalog classes, constants and `PixiRenderer` are exports of this package only.
- One renderer per page. Core keeps the registered namespace (`getThree()`) in a module variable, and the `extend()` registry and React context on `globalThis` under `Symbol.for` keys, so a pixi root and a three root in the same page would share them. Render each side in its own page or iframe: the harness runs the three.js pictures in a vitest project of their own and the playground builds each renderer in its own frame, both reading the two targets from `FIBER_TARGETS` in `scripts/test/aliases.mts` (`tests/README.md`).

## Upstream asks

None of these block us; each would let the library run on published `@react-three/fiber` instead of a copy.

- A `/core` export of `createRoot(canvas, provider)` and `Canvas` with a `provider` prop.
- An open `kind` union in the support types.
- `Environment` loaded lazily or provided by the support, so `Canvas` doesn't pull three's addons.
- `insertBefore` through a host hook in the shape of `addChildAt`.
- `getThree()` resolved per root from `state.internal.support`, so different renderers can share a page.
- A generic `RootState`, so a support can type it without re-declaring the hooks.

# Architecture

react-pixi-fiber renders react-three-fiber (r3f) v10 with pixi-3d. r3f's own core runs unchanged; pixi-3d plugs into it as a renderer support, and a thin layer gives pixi-3d the three.js surface that core and r3f apps reach for. The goal is that an r3f app only swaps its import.

`docs/feasibility.md` has the findings this design rests on. `CODING_STANDARDS.md` says how the code is written.

```
src/index.tsx           react-pixi-fiber: r3f's API, typed against pixi-3d
src/three.ts            react-pixi-fiber/three: three's API (math, classes, constants) over pixi-3d
src/addons/index.ts     react-pixi-fiber/addons: what r3f apps import from three/addons
  src/root/             createRoot and <Canvas>, bound to the pixi provider
  src/support/          pixi-3d as an r3f renderer support (kind 'pixi')
  src/renderer/         PixiRenderer: three's renderer surface over pixi.js and View3Ds
  src/catalog/          the namespace JSX names resolve in, built from the area modules below
    objects/ scene/ lights/ geometries/ materials/ drawables/ instancing/ textures/
                        classes under three's names (<mesh>, <boxGeometry>, ...), one module per area
    constants.ts        three's constants
  src/math/             three's math: Vector3, Euler, Quaternion, Matrix4, Color, ...
  src/events/ src/loaders/ src/animation/ src/environment/
                        more area modules: Raycaster, TextureLoader, and the places for the rest
  src/compat/           three's members on pixi-3d's prototypes; the Raycaster
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

We use core's modules (root, reconciler, store, loop, events, portal, hooks) through `src/index.tsx`. We don't use `core/components/Environment`, `core/hooks/useEnvironment` (three's addons) or `core/hooks/useRenderTarget` (it never disposes its target); `src/environment` has adapted copies of all three, r3f's entries (`index.tsx`, `legacy.tsx`, `webgpu/`), `web/Canvas.tsx` (it imports Environment) or `support/*` (three's renderers). They stay in the copy, unedited. `legacy.tsx` and `support/webgl.ts` matter: the parity harness renders scenes through them.

## The support

`src/support/pixiSupport.ts` is the object r3f's core loads when a root is configured, with the same shape as r3f's `support/webgpu.ts`:

| Field                              | Value                                                                                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`                             | `'pixi'`. Core's only branch on it tests for `'webgl'` (`core/renderer.ts`), so a pixi root takes the path that awaits the renderer's async `init()`, and the WebGL-only occlusion gate stays off. |
| `three`                            | The catalog (below).                                                                                                                                                                               |
| `Renderer`                         | `PixiRenderer`.                                                                                                                                                                                    |
| `RenderTarget`, `CubeRenderTarget` | `WebGLRenderTarget` and `WebGLCubeRenderTarget` (`src/environment`), which `useRenderTarget` and `<Environment>` make.                                                                             |
| `CanvasTarget`, `occlusion`        | Not available: pixi.js can't share a renderer between canvases, and pixi-3d has no occlusion queries.                                                                                              |

`src/support/provider.ts` offers it in the provider's `webgpu` slot, the one whose path awaits `init()`. The loader, `loadPixiSupport()`, first runs `installObject3DSurface()`, so the prototype patches happen when the first root configures and never on import.

`src/root/createRoot.ts` wraps core's `createRoot(canvas, provider)`. Its `configure` reads `gl` as `renderer`, so code written for `@react-three/fiber/legacy` runs, and forces `share: false`: pixi.js can't draw one renderer into several canvases, so every canvas gets its own and `primary` is ignored.

`src/root/Canvas.tsx` is r3f's `web/Canvas.tsx`, adapted: same measuring, Suspense blocking, error boundary, event wiring and teardown, without three's `<Environment>`. `background` takes a colour, which it puts on `scene.background`.

## The compat layer

`src/compat/installObject3DSurface.ts` patches pixi-3d's prototypes once, so every node answers core's duck-typed checks and three's API, including nodes pixi-3d builds itself (glTF nodes passed to `<primitive>`):

- `Container3D` gets three's `Object3D` surface (`Object3DMembers`): `isObject3D`, `id` and `uuid` (from `uid`), `name` (over `label`), `type`, `userData`, `up`, `add`, `remove`, `clear`, `attach` (pixi-3d's `reparentChild`), `traverse`, `traverseVisible`, `traverseAncestors`, `getObjectByName`, `getObjectById`, `getObjectByProperty`, `getWorldPosition`, `getWorldQuaternion`, `getWorldScale`, `getWorldDirection`, `localToWorld`, `worldToLocal`, `rotateX`/`Y`/`Z`/`OnAxis`/`OnWorldAxis`, `translateX`/`Y`/`Z`/`OnAxis`, `applyMatrix4`, `applyQuaternion`, the `setRotationFrom*` methods, `lookAt(x, y, z)` (keeping `up`; cameras and lights face it with -Z, as pixi-3d's do), `raycast` (a no-op) and `dispose` (`destroy`). `renderOrder` and `frustumCulled` are kept and inert.
- `rotation` is replaced with an `Euler` (`src/math/Euler.ts`) per node, made on first read from the quaternion. Writing it writes the quaternion through its order; any change to the quaternion (`set`, `slerp`, `lookAt`, an animation) writes the angles back, through a wrapper on `Container3D._onUpdate`, the callback a node's vectors call when they change. pixi-3d's own XYZ `rotation` is never written. `angle` is a degree view over the same `Euler`.
- `matrix` is pixi-3d's `localTransform`, built from the components when read. `matrixAutoUpdate = false` gives the node an own `updateLocalTransform` that does nothing, so the transform pass keeps the matrix as set; reading `matrix` marks the node's transform changed (`_onUpdate()`), so an edit through it shows next frame. `updateMatrix` builds it from the components on demand. `matrixWorld` is worked out when read; `updateMatrixWorld` and `updateWorldMatrix` are no-ops.
- `ObservableVector3` (a node's `position` and `scale`), `ObservableQuaternion` and pixi-3d's `Matrix4` get the members three's classes have and pixi-3d's lack, copied from the classes in `src/math` (the `*_MEMBERS` lists beside them), and typed by the interfaces in `src/compat/threeMembers.ts`. `ObservableQuaternion.setFromEuler` reads an Euler's order. The matrix members that take other arguments in three (`setPosition(x, y, z)`, `makeTranslation(vector)`, `toArray(array, offset)`) fall back to pixi-3d's for pixi-3d's arguments.
- `dispatchEvent('added')`: core inserts before a sibling by splicing `parent.children` and setting `parent` itself. On that event the child is spliced back out and re-added through the public `addChildAt`, so the view attaches it and pixi-3d's own events fire.
- `Mesh3D.raycast`: three's `Mesh.raycast` over pixi-3d's `intersectRayGeometry`, installed by `installRaycasting` in `src/compat/Raycaster.ts`.
- `Camera3D`: `isCamera`, `isPerspectiveCamera`, `isOrthographicCamera`, `type`, a `getWorldDirection` along -Z, and `projectionMatrix`, `projectionMatrixInverse`, `matrixWorldInverse` worked out when read (`cameraMatrices.ts`). pixi-3d fills `camera.projection` and `camera.view` only while drawing, so they're a frame old between frames and identity before the first one.
- `Mesh3D`, `Sprite3D`, `Model3D` and `Light` get three's `is*` flags and `type`; pixi-3d's lights keep their own `type`, which their shaders read.
- `Geometry3D.isBufferGeometry`, `BaseMaterial3D.isMaterial`, and `dispose` on both, so `<boxGeometry>` attaches to `geometry` and unmounting frees it.
- `Mesh3D.defaultOptions` gets a placeholder geometry and material, because core constructs `<mesh3D>` with no arguments and attaches them afterwards. The placeholder geometry is a zero-size box, which draws and picks nothing, like three's empty `BufferGeometry`.

The patches are typed: `PixiMixins.Container3D` and the `@pixi/3d` module are augmented with `Object3DMembers`, `CameraMembers` and the `Three*Members` interfaces. A type can't narrow what pixi-3d's classes declare, so the catalog's node classes re-declare `rotation` as an `Euler` and `lookAt` with three's arguments (`lookAtPoint`); on pixi-3d's own classes the types stay pixi-3d's and the values are the same.

The patches reach a few of pixi-3d's internals: `_onUpdate` (to mark a node changed and to follow its quaternion), `_localTransformDirty` and `rotationDirty`. Each is a candidate for a public pixi-3d API (`docs/feasibility.md`, section 6).

The `Raycaster` (`src/compat/Raycaster.ts`) builds its ray from the camera's own matrices (any camera picks, not only one a view draws with), walks objects through their `raycast` method as three does, and returns three's intersection shape: `distance`, `point`, `object`, `face` (`a`, `b`, `c`, `normal`), `faceIndex`, `uv`, `normal`. As in three, hidden objects are hit, and a single-sided material isn't hit from behind.

## The math

`src/math` has three's math classes, which `react-pixi-fiber/three` exports and the catalog registers under the names core builds by (`Vector3`, `Frustum`, ...). Each extends pixi-3d's class of the same kind (`Vector3`, `Quaternion`, `Matrix4`, `Box` as `Box3`, `Sphere`, `Ray`, `Plane`, `Spherical`, `Frustum`) and adds what three has and pixi-3d lacks, so pixi-3d takes them wherever it takes its own; pixi-3d's methods already take three's arguments, with an optional `out` last. `Euler` extends `ObservableVector3`, so a node's `rotation` can be one. `Color` is three's, with three's colour management (`ColorManagement`): channels in linear sRGB, CSS colours and hex numbers read as sRGB. `toPixiColor` hands a `Color` to pixi-3d as the sRGB `ColorSource` pixi-3d decodes back to the same linear values. `MathUtils` and `Clock` are three's.

## The catalog

`src/catalog/catalog.ts` builds the namespace core reads as `getThree()` and resolves element names in: pixi-3d's exports, then the three-named classes of every area module, then three's constants.

- pixi-3d's own names stay reachable: `<mesh3D>`, `<cubeGeometry>`, `<material3D>`, `<flatMaterial>`, with pixi-3d's options-object constructors.
- Three-named aliases win over pixi-3d classes of the same name (`SphereGeometry`, `AmbientLight`, `DirectionalLight`, `PointLight`, `PlaneGeometry`, `Vector3`, ...), whose options-object constructors would ignore three's positional `args`. Each alias extends the pixi-3d class, takes three's constructor and defaults, and renames fields (`color` over `baseColor`, `metalness` over `metallic`, `opacity` over `alpha`, `transparent` over `alphaMode`).
- A material's `color` and `emissive` are three `Color`s that write pixi-3d's `baseColor` and emissive colour on every change. `MeshStandardMaterial` is built with pixi-3d's emissive feature on, black until set, since pixi-3d can't turn it on later.
- `DirectionalLight` starts one unit up and shines at its `target`, as three's does; the renderer turns it toward the target before each frame, since pixi-3d's light shines along its local -Z.
- `OrthographicCamera` turns three's frustum bounds into pixi-3d's `orthographicSize` (half the width) in `updateProjectionMatrix`, which core calls on every resize.

The classes live in area modules, each a folder with an `index.ts` that exports its classes by name. `catalog.ts` spreads every area module into the namespace, and `src/three.ts` re-exports each with `export *`, so a class an area module exports is in the catalog, has a JSX element and is exported from `react-pixi-fiber/three` at once:

| Area module                                                                | Holds                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/math`                                                                 | three's math                                                                                                                                                                           |
| `src/catalog/objects`                                                      | `Object3D`, `Group`, `Mesh`                                                                                                                                                            |
| `src/catalog/scene`                                                        | `Scene` and the cameras; fog and backgrounds                                                                                                                                           |
| `src/catalog/lights`                                                       | lights                                                                                                                                                                                 |
| `src/catalog/geometries`, `src/catalog/materials`, `src/catalog/drawables` | geometries, materials; lines, points and sprites                                                                                                                                       |
| `src/catalog/instancing`                                                   | `InstancedMesh`                                                                                                                                                                        |
| `src/catalog/textures`, `src/loaders`, `src/animation`                     | textures, loaders (`TextureLoader`), animation                                                                                                                                         |
| `src/events`                                                               | the `Raycaster` (from `src/compat/Raycaster.ts`)                                                                                                                                       |
| `src/environment`                                                          | render targets, `CubeCamera`, `CubeTextureLoader`, `Controls` and `EventDispatcher`; the `<Environment>` components and the hooks live beside it and are exported from `src/index.tsx` |
| `src/addons/loaders`, `src/addons/controls`, `src/addons/environment`      | `react-pixi-fiber/addons` only: `GLTFLoader`, `OrbitControls`, `MapControls`, `HDRLoader`                                                                                              |

`ThreeElements` in `src/index.tsx` is the JSX element map over the catalog's type, and augments React's `JSX.IntrinsicElements`. A catalog class whose name HTML already uses is reachable with a `three` prefix: pixi-3d's `Track` is `<threeTrack>`.

### Adding to the catalog

1. **The class.** Write it in its own file in its area's folder (`src/catalog/lights/SpotLight.ts`), under three's name, with three's constructor and defaults, extending the pixi-3d class it maps to. Its JSDoc says what differs from three. A node class (one that extends a pixi-3d `Container3D`) re-declares `rotation` as an `Euler` and `lookAt` with three's arguments, as `src/catalog/objects/Mesh.ts` does. Colour fields are three `Color`s handed to pixi-3d with `toPixiColor`, as `src/catalog/materials/MeshStandardMaterial.ts` does.
2. **Its export.** Add one line to the area's `index.ts`: `export { SpotLight } from './SpotLight';`. That puts it in the catalog, gives it an element (`<spotLight>`) typed from its class, and exports it from `react-pixi-fiber/three`. Nothing else is shared: `catalog.ts`, `src/three.ts` and `src/index.tsx` don't change. A class for `react-pixi-fiber/addons` goes in `src/addons/loaders` or `src/addons/controls` the same way.
3. **Its three counterpart.** A scene that uses the element or imports the class from `react-pixi-fiber/three` renders through three's class of the same name, so parity is measured with nothing more. An addon is re-exported from `three/addons` by `tests/harness/three-addons.ts`, which already has `GLTFLoader` and `OrbitControls`; another addon needs its line there.
4. **Constants** three has are all in `src/catalog/constants.ts` already; map the ones the class reads.

## The renderer facade

`src/renderer/PixiRenderer.ts` answers what core calls on a renderer:

- `init()` creates the pixi.js renderer on the canvas (`autoDetectRenderer`, WebGL first unless `preference: 'webgpu'`), with a transparent background unless `alpha: false`, as three's. `backend.isWebGPUBackend` is set when pixi.js picks WebGPU.
- `setSize`, `setPixelRatio`, `getSize`, `getPixelRatio`, `setClearColor`, `setClearAlpha`, `clear`, `autoClear`, `domElement`.
- `render(scene, camera)` keeps a `Map<scene, View3D>`, making a view (and a pixi container holding it) the first time a scene is drawn. A HUD, portal or offscreen scene gets its own view instead of rebuilding one view every frame. When the camera is in the scene, the view draws with it; any other camera is copied each frame onto a proxy camera the facade adds to the scene (settings, and the transform relative to the scene).
- A view is freed when its scene is destroyed (the scene's `destroyed` event), or once the scene has gone `viewMaxIdleFrames` frames (120) undrawn, and made again if the scene is drawn later. A frame ends when some scene is drawn a second time, so a HUD component that owns a `new Scene()` stops holding a view after it unmounts while the main scene keeps drawing.
- `releaseView(scene)` frees a scene's view and leaves its children in place. `dispose()` frees every view and the pixi.js renderer.
- `getView(scene)` hands out the view for pixi-3d settings with no three counterpart: passes, environment, fog, culling.
- `setRenderTarget(target, face, mip)` points renders at a `WebGLRenderTarget`'s texture, or a face of a `WebGLCubeRenderTarget`, and `setViewport`, `setScissor` and `setScissorTest` take three's rects from the bottom-left corner. A view is placed on the viewport of the canvas or the target and sized to it. A clear covers the whole surface, or only the scissor rect while the scissor test is on, which two rects drawn before the scene (`ClearRect`) erase and fill, since pixi clears a whole surface or nothing. Into a target, tone mapping is off and exposure 1, as three draws a target in linear light; a camera whose `aspect` differs from the viewport's draws through the proxy, which projects with that aspect (`ProxyCamera`). pixi-3d's passes rebind a view's target at layer 0, so a cube face is drawn into a 2D texture and copied in upside down, the way cube faces are stored (`CubeFaceWriter`, `src/renderer/renderTargets.ts`). `readRenderTargetPixels` reads through pixi's extract on WebGL; `readRenderTargetPixelsAsync` maps a GPU buffer on WebGPU. Both decode pixi-3d's display encoding back to three's linear bytes.
- A scene whose `environment` or `background` is a texture goes through `EnvironmentMaps` (`src/environment/EnvironmentMaps.ts`), which the facade makes on first use and frees in `dispose()`. It bakes each source on the GPU, once per source and per picture of a cube target, into the linear cube three makes of it (an image cube mirrored in x, an equirectangular map wrapped onto faces), and draws that cube behind the view as a pixi 2D mesh, with three's background rotation, intensity, PMREM blur and tone-mapping rules. For `environment` it bakes the source again, turned and scaled, into the 2.2-gamma cube pixi-3d's view prefilters. Its cubes are freed when the source is destroyed, after 120 frames unused, or with the facade.

three's renderer settings reach each view as it draws:

| three                                                                                  | pixi-3d                                                                                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `toneMapping`: `NoToneMapping`, `LinearToneMapping`                                    | `view.toneMapping = 'none'`                                                                                                                |
| `ReinhardToneMapping`                                                                  | `'reinhard'`                                                                                                                               |
| `CineonToneMapping`                                                                    | `'uncharted2'` (closest filmic curve)                                                                                                      |
| `ACESFilmicToneMapping` (r3f's default)                                                | `'aces'`                                                                                                                                   |
| `AgXToneMapping`, `NeutralToneMapping`                                                 | `'aces'` (pixi-3d has neither)                                                                                                             |
| `toneMappingExposure`                                                                  | `view.exposure`                                                                                                                            |
| `shadowMap.type`: `BasicShadowMap`, `PCFShadowMap`, `PCFSoftShadowMap`, `VSMShadowMap` | `view.shadowFilter`: `'hard'`, `'pcf'`, `'pcf-high'`, `'pcf-high'`                                                                         |
| `shadowMap.enabled`                                                                    | Lights cast shadows only while it's on (`DirectionalLight.canCastShadow`)                                                                  |
| `scene.background`: a three `Color` or a colour                                        | The canvas clears to it before the scene draws, untouched by tone mapping, as three's does; any other background goes to `view.background` |
| `outputColorSpace`                                                                     | Kept, inert: pixi-3d always writes sRGB                                                                                                    |

## The entries and their types

The package has three entries, each a file of `src` that `package.json`, `tsdown.config.ts`, `tsconfig.json` and the Vite aliases name:

- `react-pixi-fiber`, `src/index.tsx`, mirrors the export list of r3f v10's `index.tsx`, which is everything `core/index.tsx` exports plus the entry's own `Canvas`, `createRoot`, `events`, `ThreeElements`, the build flags and the `ReactThreeFiber` namespace. Each value is core's own function, re-declared with a type from `src/types`, which names pixi-3d. Nothing is `export *`'d from the copy, so the declaration bundle never names three, and modules like Environment never enter the bundle. It adds the pixi-3d side: `PixiRenderer`, `pixiSupport`, `catalog` and the compat types.
- `react-pixi-fiber/three`, `src/three.ts`, is what an r3f app imports from `three`: it re-exports every area module with `export *`. An app can alias `three` to it.
- `react-pixi-fiber/addons`, `src/addons/index.ts`, is what an r3f app imports from `three/addons`, re-exporting `src/addons/loaders`, `src/addons/controls` (`OrbitControls`, `MapControls`) and `src/addons/environment` (`HDRLoader`, `RGBELoader`).

`npm run test:bundle` checks every entry's built files for three.

The math-prop types keep r3f's names: `Vector2`, `Vector3`, `Vector4`, `Euler`, `Quaternion`, `Matrix3`, `Matrix4` and `Color` are what a prop of that kind takes (`const position: Vector3 = [0, 1, 0]`), as in r3f, and `ReactThreeFiber` carries them with the element types. three's classes of those names come from `react-pixi-fiber/three`, as they come from `three` in r3f. `act` is an extra: React's `act`, which r3f v10's entry doesn't export.

Left out, because they need what pixi-3d doesn't have yet or are typed against three's renderers:

| Left out                                                                                                                                                                                                                                                                         | Why                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `BackgroundConfig`                                                                                                                                                                                                                                                               | `<Canvas background>` takes only colours                                                                          |
| `useTextures`, and `TextureInput`, `TextureResult`, `DisposeOptions`, `UseTexturesReturn`                                                                                                                                                                                        | Its `dispose` calls three's `Texture.dispose`                                                                     |
| `registerPrimary`, `getPrimary`, `waitForPrimary`, `hasPrimary`, `unregisterPrimary`, `getPrimaryIds`, and `PrimaryCanvasEntry`                                                                                                                                                  | The multi-canvas registry shares one three renderer between canvases                                              |
| `Renderer`, `RendererFactory`, `BaseRendererProps`, `DefaultRendererProps`, `DefaultGLProps`, `GLProps`, `RendererConfigExtended`, `RendererSettingsConfig`, `ColorManagementConfig`, `CanvasSchedulerConfig`                                                                    | three's renderer settings; this package's are `PixiRenderer`, `PixiRendererParameters` and `RendererSettings`     |
| `LegacyRenderer`, `LegacyRootState`, `LegacyInternalState`, `WebGLProps`, `WebGLDefaultProps`, `WebGLShadowConfig`, `WebGPURootState`, `WebGPUInternalState`, `WebGPUR3FRenderer`, `WebGPUProps`, `WebGPUDefaultProps`, `WebGPUShadowConfig`, `UseThreeWebGPU`, `UseFrameWebGPU` | Narrowed to one of three's renderers; `RootState`, `useThree` and `useFrame` are typed with `PixiRenderer`        |
| `Register`, `RegisteredRenderer`, `ForRegisteredRenderer`, `R3FRenderer`, `R3FRendererSupport`                                                                                                                                                                                   | Picks between three's renderers                                                                                   |
| `RendererProvider`, `RendererSupport`, `WebGLSupport`, `WebGPUSupport`, `OcclusionSupport`, `ThreeCore`, `ThreeNamespace`                                                                                                                                                        | three's support modules; this package's are `PixiSupport` and `PixiCatalog`                                       |
| `Layers`, `RaycastableRepresentation`, `GeometryTransformProps`, `GeometryProps`, `TSLNodeInput`, `NodeProps`, `Object3DMethod`                                                                                                                                                  | Element types over three classes with no pixi-3d counterpart: layers, `BufferGeometry` transforms, node materials |

## How a frame flows

1. `<Canvas>` measures its container and calls `createRoot(canvas).configure(props)`. The first configure loads the support (`loadPixiSupport`, which installs the compat patches, three's `Object3D` surface among them), registers the catalog as `getThree()`, constructs `PixiRenderer` with `{ canvas, antialias }` plus the `renderer` prop, sizes it and awaits `init()`. Core then creates the default `Raycaster`, camera (`PerspectiveCamera(50, 0, 0.1, 1000)` at z = 5, looking at the origin) and `Scene` from the catalog, adds the camera to the scene, sets ACES tone mapping and applies `shadows`.
2. `root.render(children)` mounts the tree with r3f's reconciler. Each element resolves to a catalog class, is constructed with `args`, gets its props through core's `applyProps`, and joins its parent through `add` (or `dispatchEvent('added')` when inserted before a sibling). Children with `isBufferGeometry` or `isMaterial` attach to the parent's `geometry` or `material`.
3. Every frame, `@pmndrs/scheduler` runs the root's jobs: deferred pointer raycasts, `useFrame` callbacks by phase, then the frustum job (`updateFrustum`, reading the camera's fresh matrices) and the visibility job (`Frustum.intersectsObject` for `onFramed` and `onVisible`), then the render job.
4. The render job calls `renderer.render(state.scene, state.camera)`. The facade finds or makes the scene's view, points it at the camera (or the proxy), puts a colour background on the canvas's clear colour, copies the tone mapping, exposure, shadow settings and any other background onto the view, aims each `DirectionalLight` at its target, and calls `pixi.render()` on the view's container. pixi-3d's `View3D` runs its transform pass and draws.
5. A pointer event on the canvas reaches core's event layer, which sets `state.pointer`, calls `raycaster.setFromCamera(pointer, camera)`, and asks the raycaster to intersect each object that has a handler. Hits are sorted, bubbled up the tree and handed to the handlers as `ThreeEvent`s.
6. Unmounting removes each element through `remove` and calls `dispose` on it (`destroy` for nodes, geometries and materials). Unmounting the root releases the renderer, whose `dispose()` frees every view and the pixi.js renderer.

## Measuring parity against three

Scenes, examples and docs import the library only as `react-pixi-fiber`, `react-pixi-fiber/three` and `react-pixi-fiber/addons`. `tsconfig.json` and the Vite aliases resolve those names to the entries in `src`. Pointing them at `src/r3f/src/legacy.tsx`, `three` and `tests/harness/three-addons.ts` instead renders the same scene file through r3f's own WebGL entry and real three.js. That is how parity is measured.

Two rules follow:

- A parity scene uses only names both sides export: r3f's API (`Canvas`, `useFrame`, `useThree`, ...), JSX elements, and the classes `react-pixi-fiber/three` shares with `three`. `PixiRenderer`, the catalog and pixi-3d's own names are exports of this package only.
- One renderer per page. Core keeps the registered namespace (`getThree()`) in a module variable, and the `extend()` registry and React context on `globalThis` under `Symbol.for` keys, so a pixi root and a three root in the same page would share them. Render each side in its own page or iframe: the harness runs the three.js pictures in a vitest project of their own and the playground builds each renderer in its own frame, both reading the two targets from `FIBER_TARGETS` in `scripts/test/aliases.mts` (`tests/README.md`).

## Upstream asks

None of these block us; each would let the library run on published `@react-three/fiber` instead of a copy.

- A `/core` export of `createRoot(canvas, provider)` and `Canvas` with a `provider` prop.
- An open `kind` union in the support types.
- `Environment` loaded lazily or provided by the support, so `Canvas` doesn't pull three's addons.
- `insertBefore` through a host hook in the shape of `addChildAt`.
- `getThree()` resolved per root from `state.internal.support`, so different renderers can share a page.
- A generic `RootState`, so a support can type it without re-declaring the hooks.

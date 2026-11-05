# Differences from react-three-fiber

react-pixi-fiber runs react-three-fiber v10's core unchanged, so the React side of r3f works as r3f documents it. The differences are in what that core drives: pixi-3d objects in place of three.js ones. This page lists them, item by item, from the findings of the port.

## What is the same

Everything r3f does in React: `<Canvas>`, `createRoot`, `useFrame` and its phases, `useThree`, `useLoader` and Suspense, `invalidate` and `advance`, `frameloop`, `extend`, `createPortal`, the event system with bubbling, capture and `onPointerMissed`, and how props, `args` and `attach` reach objects. All of it is r3f's own code.

## What differs

The objects behind the elements are pixi-3d's. Declarative props work as in r3f, since the elements keep three's names and map them. What reaches past the props needs care:

- **Imperative math and colours.** `position={[1, 2, 3]}`, `scale={2}` and `rotation={[x, y, z, 'YXZ']}` work, and so do three's methods on a node in a `useFrame`: `position.lerp()`, `rotation.order`, `quaternion.slerp()`, `lookAt()`, `getWorldPosition()`, `matrixAutoUpdate`, `material.color.set()`. Every node has three's `Object3D` surface, and the classes and math come from `react-pixi-fiber/three` (see [The three entry](three-entry.md)).
- **three.js itself.** Code that imports `three` builds three.js objects, and so does `@react-three/drei`. A pixi-3d scene can't hold them. Pointing `three` at `react-pixi-fiber/three` covers an app's own imports of the classes that entry has.
- **Sheared transforms.** A mesh turned inside an unevenly scaled parent is lit as if its surface weren't sheared. pixi-3d turns normals with the world transform, dividing each axis by its squared length, which is three's normal matrix only while the axes stay at right angles. Where they don't, a face can be lit at the wrong angle: about a quarter of a sheared box's pixels differ from three's picture. Uniform scales, and uneven scales on the mesh itself, match.
- **`renderOrder` and `frustumCulled`.** Kept and inert: pixi-3d orders draws by pipeline and depth, and its view culls every mesh by its own `cull` setting.
- **Lighting.** The catalog has `ambientLight`, `directionalLight` and `pointLight`, with three's intensities. A directional light aims at its `target` as in three, and a point light's `distance` is where its light stops, so scenes lit by them match three.js's pictures. A point light's `decay` is always three's default of 2. `spotLight` and `hemisphereLight` aren't in the catalog yet.
- **Metal with no environment map.** With `metalness` above 0 and no environment map, pixi-3d shades metal differently from three.js: faces the light hits come out darker and less saturated, and faces lit mostly by the ambient light come out lighter. pixi-3d's PBR has neither three's multi-scatter energy compensation on direct light nor its energy-conserving cut of ambient light on metal. A half-metal box differs from three's picture on about a third of its pixels; with `metalness` 0 it matches.
- **Shaders.** `shaderMaterial` and node materials have no pixi-3d equivalent. pixi-3d extends its materials with shader bits instead.
- **Events.** r3f's event system runs unchanged on this package's `Raycaster`, which ports three's `Mesh.raycast`: every triangle the ray crosses is a hit, with the material's `side`, `face`, `barycoord`, `uv` and the blended vertex `normal`. One difference is a fix: `onDoubleClick` fires. r3f v10 matches a click to its pointerdown by `pointerId`, and Chrome's `dblclick` has none, so r3f's own build never fires `onDoubleClick`; this package's event layer gives it the pointerdown's. The raycaster has no `layers`, picks triangles only, and picks a skinned or morphed mesh in its rest pose. As in r3f, an object's `onPointerCancel` and `onLostPointerCapture` are typed but never called.
- **Instancing.** `instancedMesh` draws its instances as slots of pixi-3d's `BatchedMesh3D`, with three's API and `instanceId` on events. `frustumCulled` culls each instance rather than the whole mesh, `setMatrixAt` and `setColorAt` take effect without `needsUpdate`, and instance colours draw with a copy of the material that multiplies them in, so set `transparent` and `side` before the first `setColorAt`.
- **Small shapes on WebGPU.** WebGPU's multisampling covers the edges of shapes a few pixels across differently from WebGL and three.js. A cloud of boxes 3 px wide differs from three's picture on about 6% of its pixels on WebGPU, and not at all on WebGL.

## What the package exports

The package exports what r3f v10 does, under the same names, typed against pixi-3d. `Vector3`, `Euler`, `Color` and the other math types are what a prop takes, as in r3f. three's classes, with the same names, come from `react-pixi-fiber/three` (see [The three entry](three-entry.md)). Left out until they work on pixi-3d:

- `Environment`, `EnvironmentMap`, `EnvironmentCube`, `EnvironmentPortal`, `presetsObj` and `useEnvironment`, which load three's HDR environments.
- `useRenderTarget`, since there are no render targets for r3f to make yet.
- `useTextures`, whose `dispose` calls three's `Texture.dispose`.
- The multi-canvas registry: `registerPrimary`, `getPrimary`, `waitForPrimary`, `hasPrimary`, `unregisterPrimary` and `getPrimaryIds`.
- The types of three's WebGL and WebGPU renderers and of choosing between them, such as `WebGPURootState` and `LegacyRenderer`. `RootState`, `useThree` and `useFrame` are typed with `PixiRenderer`.
- The element types over three classes pixi-3d doesn't have: `Layers`, `GeometryTransformProps`, `GeometryProps`, `NodeProps`, `TSLNodeInput`, `Object3DMethod` and `RaycastableRepresentation`.

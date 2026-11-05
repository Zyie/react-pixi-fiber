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
- **Lighting.** The catalog has `ambientLight`, `hemisphereLight`, `directionalLight`, `pointLight` and `spotLight`, with three's arguments, intensities and `Color`s, and lit scenes match three.js's pictures. Directional and spot lights aim at their `target` as in three, including three's habit of aiming at the origin while the default target is outside the scene. What pixi-3d lacks: `decay` is always three's default of 2, point lights cast no shadows, a spot light projects no `map`, and there is no `RectAreaLight` or `LightProbe`. A hemisphere light is the view's environment, so it gives way to a scene `environment`, and only the first one lights; it also adds a little to glossy highlights, which three's doesn't.
- **Shadows.** `renderer={{ shadows }}`, `castShadow`, `receiveShadow` and the shadow camera, map size and bias work as in three. pixi-3d keeps one shadow resolution per view, the largest any light asks for, and takes its softness from the `shadows` setting, so `shadow-radius`, `shadow-blurSamples` and `shadow-intensity` change nothing. A spot light's shadow covers its whole cone from 1 unit out, whatever its shadow camera says.
- **Fog and backgrounds.** `<fog>` and `<fogExp2>` match three's, mixed in after the tone curve, except on a material whose `toneMapped` is off, which takes no fog. A texture background is stretched over the canvas as in three; pixi.js filters it in display space, so its sharp edges blend a little differently, and `backgroundIntensity` only dims. A cube background goes through the tone curve where three leaves an sRGB one as it is, and has no blur, intensity or rotation; three's equirectangular backgrounds aren't drawn.
- **Tone mapping and output.** Materials end with three's own tone curves, AgX and Neutral included, and three's sRGB transfer function, or none for `LinearSRGBColorSpace`, in place of pixi-3d's curves and 2.2 power.
- **Cameras.** Cameras project as three's do, from the settings `updateProjectionMatrix` last saw: their own `aspect`, `zoom`, film offset, off-centre orthographic bounds and `setViewOffset`. `camera.view` is pixi-3d's view matrix, so the view offset isn't readable there.
- **Occlusion.** pixi-3d has no occlusion queries, so `onOccluded` never fires and `onVisible` counts every object in the frustum as unoccluded, as r3f does on WebGL. `Layers` aren't there either: objects and cameras have no `layers` to filter by.
- **Metal with no environment map.** With `metalness` above 0 and no environment map, pixi-3d shades metal differently from three.js: faces the light hits come out darker and less saturated, and faces lit mostly by the ambient light come out lighter. pixi-3d's PBR has neither three's multi-scatter energy compensation on direct light nor its energy-conserving cut of ambient light on metal. A half-metal box differs from three's picture on about a third of its pixels; with `metalness` 0 it matches.
- **Shaders.** `shaderMaterial` and node materials have no pixi-3d equivalent. pixi-3d extends its materials with shader bits instead.

## What the package exports

The package exports what r3f v10 does, under the same names, typed against pixi-3d. `Vector3`, `Euler`, `Color` and the other math types are what a prop takes, as in r3f. three's classes, with the same names, come from `react-pixi-fiber/three` (see [The three entry](three-entry.md)). Left out until they work on pixi-3d:

- `Environment`, `EnvironmentMap`, `EnvironmentCube`, `EnvironmentPortal`, `presetsObj` and `useEnvironment`, which load three's HDR environments.
- `useRenderTarget`, since there are no render targets for r3f to make yet.
- `useTextures`, whose `dispose` calls three's `Texture.dispose`.
- The multi-canvas registry: `registerPrimary`, `getPrimary`, `waitForPrimary`, `hasPrimary`, `unregisterPrimary` and `getPrimaryIds`.
- The types of three's WebGL and WebGPU renderers and of choosing between them, such as `WebGPURootState` and `LegacyRenderer`. `RootState`, `useThree` and `useFrame` are typed with `PixiRenderer`.
- The element types over three classes pixi-3d doesn't have: `Layers`, `GeometryTransformProps`, `GeometryProps`, `NodeProps`, `TSLNodeInput`, `Object3DMethod` and `RaycastableRepresentation`.

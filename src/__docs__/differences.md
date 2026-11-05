# Differences from react-three-fiber

react-pixi-fiber runs react-three-fiber v10's core unchanged, so the React side of r3f works as r3f documents it. The differences are in what that core drives: pixi-3d objects in place of three.js ones. This page lists them, item by item, from the findings of the port.

## What is the same

Everything r3f does in React: `<Canvas>`, `createRoot`, `useFrame` and its phases, `useThree`, `useLoader` and Suspense, `invalidate` and `advance`, `frameloop`, `extend`, `createPortal`, the event system with bubbling, capture and `onPointerMissed`, and how props, `args` and `attach` reach objects. All of it is r3f's own code.

## What differs

The objects behind the elements are pixi-3d's. Declarative props work as in r3f, since the elements keep three's names and map them. What reaches past the props needs care:

- **Imperative math and colours.** `position={[1, 2, 3]}` works, and so does `scale={2}`. Calling three's vector and colour methods in a `useFrame`, such as `copy`, `lerp` or `material.color.set()`, depends on pixi-3d growing the same methods.
- **three.js itself.** Code that imports `three` builds three.js objects, and so does `@react-three/drei`. A pixi-3d scene can't hold them.
- **Lighting.** The catalog has `ambientLight`, `directionalLight` and `pointLight`, with three's intensities. A directional light aims at its `target` as in three, and a point light's `distance` is where its light stops, so scenes lit by them match three.js's pictures. A point light's `decay` is always three's default of 2. `spotLight` and `hemisphereLight` aren't in the catalog yet.
- **Metal with no environment map.** With `metalness` above 0 and no environment map, pixi-3d shades metal differently from three.js: faces the light hits come out darker and less saturated, and faces lit mostly by the ambient light come out lighter. pixi-3d's PBR has neither three's multi-scatter energy compensation on direct light nor its energy-conserving cut of ambient light on metal. A half-metal box differs from three's picture on about a third of its pixels; with `metalness` 0 it matches.
- **Shaders.** `shaderMaterial` and node materials have no pixi-3d equivalent. pixi-3d extends its materials with shader bits instead.

## What the package exports

The package exports what r3f v10 does, under the same names, typed against pixi-3d. `Vector3`, `Euler`, `Color` and the other math types are what a prop takes, as in r3f, so three's vector classes are exported as `ThreeVector2` and `ThreeVector3`. Left out until they work on pixi-3d:

- `Environment`, `EnvironmentMap`, `EnvironmentCube`, `EnvironmentPortal`, `presetsObj` and `useEnvironment`, which load three's HDR environments.
- `useRenderTarget`, since there are no render targets for r3f to make yet.
- `useTextures`, whose `dispose` calls three's `Texture.dispose`.
- The multi-canvas registry: `registerPrimary`, `getPrimary`, `waitForPrimary`, `hasPrimary`, `unregisterPrimary` and `getPrimaryIds`.
- The types of three's WebGL and WebGPU renderers and of choosing between them, such as `WebGPURootState` and `LegacyRenderer`. `RootState`, `useThree` and `useFrame` are typed with `PixiRenderer`.
- The element types over three classes pixi-3d doesn't have: `Layers`, `GeometryTransformProps`, `GeometryProps`, `NodeProps`, `TSLNodeInput`, `Object3DMethod` and `RaycastableRepresentation`.

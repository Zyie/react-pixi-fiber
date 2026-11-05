# Differences from react-three-fiber

react-pixi-fiber runs react-three-fiber v10's core unchanged, so the React side of r3f works as r3f documents it. The differences are in what that core drives: pixi-3d objects in place of three.js ones. This page lists them, item by item, from the findings of the port.

## What is the same

Everything r3f does in React: `<Canvas>`, `createRoot`, `useFrame` and its phases, `useThree`, `useLoader` and Suspense, `invalidate` and `advance`, `frameloop`, `extend`, `createPortal`, the event system with bubbling, capture and `onPointerMissed`, and how props, `args` and `attach` reach objects. All of it is r3f's own code.

## What differs

The objects behind the elements are pixi-3d's. Declarative props work as in r3f, since the elements keep three's names and map them. What reaches past the props needs care:

- **Imperative math and colours.** `position={[1, 2, 3]}` works, and so does `scale={2}`. Calling three's vector and colour methods in a `useFrame`, such as `copy`, `lerp` or `material.color.set()`, depends on pixi-3d growing the same methods.
- **three.js itself.** Code that imports `three` builds three.js objects, and so does `@react-three/drei`. A pixi-3d scene can't hold them.
- **Lighting.** Light units and falloff differ, so the same lights look different until they're calibrated. Directional and spot lights aim at a `target` in three, and by rotation in pixi-3d.
- **Shaders.** `shaderMaterial` and node materials have no pixi-3d equivalent. pixi-3d extends its materials with shader bits instead.

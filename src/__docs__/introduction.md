# Introduction

react-pixi-fiber is a React renderer for [pixi.js](https://pixijs.com) 2D and [pixi-3d](https://github.com/pixijs/pixi-3d) that keeps [react-three-fiber](https://r3f.docs.pmnd.rs)'s API for both. You build the scene with the same `<Canvas>`, the same hooks and the same JSX elements, and pixi-3d draws it. An r3f scene should only have to change its import. pixi.js's sprites, graphics, text, filters and masks are elements of the same tree (`<sprite2D>`, `<graphics2D>`, `<text2D>`), drawn over or under the 3D, with the same hooks and events; [Your first 2D scene](../two-d/__docs__/your-first-2d-scene.md) starts there.

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
+ import { Canvas, useFrame } from 'react-pixi-fiber';
```

## What does it look like?

A component with its own state that reacts to the pointer and takes part in the render loop, written exactly as react-three-fiber's introduction writes it:

```tsx
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from 'react-pixi-fiber';

function Box(props) {
  const ref = useRef(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);

  useFrame((state, delta) => (ref.current.rotation.x += delta));

  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={() => click(!clicked)}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

createRoot(document.getElementById('root')).render(
  <Canvas>
    <ambientLight intensity={Math.PI / 2} />
    <pointLight position={[10, 10, 10]} decay={0} intensity={Math.PI} />
    <Box position={[-1.2, 0, 0]} />
    <Box position={[1.2, 0, 0]} />
  </Canvas>,
);
```

## How does it work?

react-three-fiber v10 splits its core from the renderer it drives. react-pixi-fiber keeps that core as it is: the reconciler, the store, the frame loop, the event system, `<Canvas>` and the Suspense loaders are r3f's own code, copied byte for byte and never edited. A script checks the copy against r3f's repository, so a fix in r3f reaches react-pixi-fiber by copying it again.

What changes is underneath:

- **A renderer support for pixi-3d.** r3f hands its renderer seam a support module; react-pixi-fiber's creates a PixiJS renderer and a pixi-3d `View3D` behind three's `render(scene, camera)` surface.
- **A three-compat layer.** r3f's core reads objects through duck-typed flags such as `isObject3D` and methods such as `traverse`, never `instanceof`. pixi-3d's containers, geometries and materials get that surface, so r3f can attach, update and dispose them.
- **An alias catalog under three's names.** `<mesh>`, `<boxGeometry>` and `<meshStandardMaterial>` are pixi-3d classes with three's constructor arguments and prop names, so `color`, `metalness` and `args` mean what they mean in three.js.

## Is it the same as three.js?

That is the yardstick, and it is measured. Examples and tests name the library only by its package name, so the same scene file can be rendered through real three.js by pointing the `react-pixi-fiber` import at r3f's own WebGL entry. Each example's picture comes from that harness.

Where it isn't the same yet, [Differences from react-three-fiber](differences.md) lists every part of r3f's surface and how it carries over, from what runs unchanged to what pixi-3d has no equivalent for.

## Where next

- [Installation](installation.md) sets it up, beside React and PixiJS.
- [Your first scene](your-first-scene.md) builds a lit cube and explains `<Canvas>`, elements, `args` and props.
- [Basic animations](basic-animations.md), [Events and interaction](events-and-interaction.md), [Loading models](loading-models.md) and [Loading textures](loading-textures.md) follow r3f's tutorials.

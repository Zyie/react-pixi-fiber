# Swap your three.js imports

`@react-fiber/threejs-compat` runs a react-three-fiber app on pixi.js and @pixi/3d with its imports changed and little else. It gives @pixi/3d's objects three.js's names and API: `<mesh>`, `<boxGeometry>` and `<meshStandardMaterial>` with three's constructor arguments and props, three's `Object3D` members on every node, and three's math, loaders, animation, environment and addons.

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
- import { Color, Vector3 } from 'three';
- import { GLTFLoader } from 'three/addons';
+ import { Canvas, useFrame } from '@react-fiber/threejs-compat';
+ import { Color, Vector3 } from '@react-fiber/threejs-compat/three';
+ import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
```

Most scenes look as they do on three.js; [Differences from react-three-fiber](differences.md) lists what doesn't. The one an r3f app meets first is light `decay`: @pixi/3d's lights always fall off with the square of their distance, three's default `decay` of 2, so `decay={0}` changes nothing. react-three-fiber's README demo lights its two boxes with a spot light and a point light ten units away, both with `decay={0}`; after the swap they add almost nothing, and the boxes show the ambient light alone. Until @pixi/3d has a decay exponent, raise such a light's `intensity` by the square of its distance (`Math.PI * 300` for those two), or move it closer.

## Opting in

The package is optional, and importing any of its three entries installs it:

| Entry                                | Stands in for        | What it is                                                                                          |
| ------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------- |
| `@react-fiber/threejs-compat`        | `@react-three/fiber` | react-three-fiber's API: everything `@react-fiber/core` exports, with `<Environment>` and its hooks |
| `@react-fiber/threejs-compat/three`  | `three`              | three's classes, math and constants over @pixi/3d                                                   |
| `@react-fiber/threejs-compat/addons` | `three/addons`       | `GLTFLoader`, `DRACOLoader`, `OrbitControls`, `MapControls`, `HDRLoader`, `RGBELoader`, ...         |

Once installed, every root on the page gets three's scene, camera and raycaster in place of @pixi/3d's, and three's renderer settings (tone mapping, shadows, fog, environment) are drawn. An app that never imports it has nothing of three's on the page or in its bundle. A bundler alias from `three` to `@react-fiber/threejs-compat/three` lets code that imports `three` itself run unchanged.

```sh
npm install @react-fiber/core @react-fiber/3d @react-fiber/threejs-compat react react-dom pixi.js @pixi/3d
```

## A scene, unchanged

react-three-fiber's first scene, with nothing changed but the import:

<!-- snippet: examples/your-first-scene/first-scene.example.tsx#result -->

```tsx
import { Canvas } from '@react-fiber/threejs-compat';

function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhongMaterial />
      </mesh>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
    </>
  );
}

export function App() {
  return (
    <div id="canvas-container">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
```

![A red-lit cube facing the camera](../../../../tests/snapshots/docs/your-first-scene/first-scene.webgl.png)

The objects behind three's names are @pixi/3d's: a `<mesh>` is a `Mesh3D` with three's constructor and fields, so `@react-fiber/3d`'s elements (`<mesh3D>`, `<sphereGeometry3D>`) work in the same tree, and so does 2D once `@react-fiber/2d` is imported.

## Is it the same as three.js?

That is the yardstick, and it is measured. Every scene and example of these docs names the package only by its entries, so the same file renders through real three.js when they point at react-three-fiber's own WebGL entry, `three` and `three/addons`. Each picture is checked against three's, and the share of pixels that differ is reported. [Differences from react-three-fiber](differences.md) lists every part of r3f's surface and how it carries over.

## Moving an app

Change every import of `@react-three/fiber` to `@react-fiber/threejs-compat`, of `three` to `@react-fiber/threejs-compat/three`, and of `three/addons` to `@react-fiber/threejs-compat/addons`. Then look for what doesn't come from r3f:

- Code that imports `three` without the alias runs against three.js objects that a @pixi/3d scene can't hold. `THREE.Mesh` in a type becomes the package's `Mesh`, a `Mesh3D`.
- `@react-three/drei` builds three.js objects, so its components don't carry over.
- `shaderMaterial` and node materials have no @pixi/3d equivalent.

The guides that follow are react-three-fiber's own, run on @pixi/3d: [Your first scene](your-first-scene.md), then the tutorials and the reference.

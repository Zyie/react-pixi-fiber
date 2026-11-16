# react-pixi-fiber

React renderers for [pixi.js](https://pixijs.com) 2D and [`@pixi/3d`](https://github.com/pixijs/3d) with [react-three-fiber](https://github.com/pmndrs/react-three-fiber) v10's API: `<Canvas>`, `useFrame`, `useThree`, `useLoader`, the pointer events, `args`, props and `attach`. 2D and 3D are elements of one tree, in one canvas, with one event system. The React side is react-three-fiber's own core, forked so that it asks its renderer through eight hooks where it reached into three.js objects; pixi.js and @pixi/3d answer them.

This repo is a monorepo of npm workspaces under `packages/`.

## Packages

| Package                       | What it is                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-fiber/core`           | r3f's API on pixi.js: `<Canvas>`, `createRoot`, the hooks, the events, the stage that draws 2D over and under 3D, a root's @pixi/3d scene and camera, and the bridges between 2D and 3D |
| `@react-fiber/2d`             | pixi.js's 2D classes as elements under pixi's conventions: `<sprite2D>`, `<graphics2D>`, `<text2D>`, `<blurFilter2D attach="filters-0">`                                                |
| `@react-fiber/3d`             | @pixi/3d's classes as elements under pixi's conventions: `<mesh3D>`, `<sphereGeometry3D>`, `<phongMaterial3D>`, `<pointLight3D>`                                                        |
| `@react-fiber/threejs-compat` | Optional: three.js's names and API over @pixi/3d, so an r3f app swaps its imports; `/three` and `/addons` stand in for `three` and `three/addons`                                       |
| `@react-fiber/r3f`            | react-three-fiber's `packages/fiber`, forked so its core calls renderer hooks ([`packages/r3f/README.md`](packages/r3f/README.md), for r3f's maintainers)                               |
| `@react-fiber/docs`           | The docs site                                                                                                                                                                           |

How they fit: `@react-fiber/r3f` <- `@react-fiber/core` <- `@react-fiber/2d`, `@react-fiber/3d` <- `@react-fiber/threejs-compat`. core bundles the fork's core and gives every root a renderer support. The packages above it register with core through pixi.js's `extensions` when they are imported: their elements, and the hooks core calls on the objects they own. core orders pointer hits across 2D and 3D by where they are drawn. threejs-compat gives the same @pixi/3d objects three's names and members; without it, nothing of three.js is installed or bundled.

## 2D and 3D

```sh
npm install @react-fiber/core @react-fiber/2d @react-fiber/3d react react-dom pixi.js @pixi/3d
```

<!-- snippet: examples/core/hello.example.tsx#result -->

```tsx
import type { Mesh3D } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import { useRef, useState } from 'react';

function Box() {
  const mesh = useRef<Mesh3D>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <mesh3D ref={mesh} rotation-x={0.4} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
      <phongMaterial3D baseColor={hovered ? 'hotpink' : 'orange'} />
    </mesh3D>
  );
}

function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Box />
      <text2D text="Hello, 2D and 3D" x={16} y={16} style={{ fill: 'white', fontSize: 24, fontFamily: 'Arial' }} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
```

Elements are pixi's classes with a `2D` or `3D` suffix, `args` are their constructors' arguments (@pixi/3d's options objects) and props their fields. 2D draws in screen space over the 3D, or behind it with a negative `zIndex`. `<anchor2D>` keeps 2D on a 3D object, `<View3D>` draws 3D inside 2D, `<Layer3D>` gives the canvas's 3D a 2D node's transform and filters, and `<RenderTexture2D>` draws 2D onto a material, with its events.

## A react-three-fiber app

```sh
npm install @react-fiber/core @react-fiber/3d @react-fiber/threejs-compat react react-dom pixi.js @pixi/3d
```

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
- import { Color, Vector3 } from 'three';
+ import { Canvas, useFrame } from '@react-fiber/threejs-compat';
+ import { Color, Vector3 } from '@react-fiber/threejs-compat/three';
```

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

Importing any of its entries installs threejs-compat for every root. Parity is measured, not assumed: every three.js scene and example renders through @pixi/3d on WebGL and WebGPU and through real three.js, and the tests report how far apart the pictures are. What still differs is in [`docs/feasibility.md`](docs/feasibility.md) and on the docs site's Differences page.

## Status

Unreleased, built on pixi.js 8.23 and `@pixi/3d` 0.1. Every pixi.js display class, filter, graphics context and particle is a 2D element, and every @pixi/3d node, light, geometry and material a 3D one; neither package changes a pixi class. threejs-compat covers three's geometries (but tube, extrude and shape), its standard, physical, basic, Phong, Lambert, toon, normal and matcap materials with their maps, lines, points, sprites, `instancedMesh`, every light but area lights and probes, shadows, fog, cameras, render targets, cube cameras, three's math and loaders, `AnimationMixer`, `<Environment>`, and the `GLTFLoader`, `OrbitControls`, `MapControls`, `HDRLoader` and `RGBELoader` addons. A root without threejs-compat draws with @pixi/3d's defaults: @pixi/3d's own `castShadow` and `receiveShadow` work, but there is no way yet to set its view's tone mapping, fog or environment from React. A root's scene, camera and renderer are @pixi/3d's whatever packages it has, so a 2D app ships `@pixi/3d` too, about 550 KB minified and 165 KB gzipped beside pixi.js.

## Develop

```sh
npm install
npm run sync:repos   # clones r3f v10 and the installed pixi-3d and pixi.js into .repos/, for reading
npm run build        # builds every package into its dist
npm test             # lint, types, docs checks and every visual and unit test
npm start            # the playground: every scene on pixi WebGL, pixi WebGPU and three.js
npm run docs:dev     # the docs site on http://127.0.0.1:3000
```

- `packages/r3f/README.md` is the fork's interface, each hook and why, and how r3f's own tests run on it; `npm run diff:r3f` writes its diff against upstream.
- `docs/architecture.md` explains how the packages fit together, and `AGENTS.md` has the ground rules and the checks to run.
- `tests/scenes/` and `examples/` are the visual tests and the docs' examples of every package; `tests/README.md` explains the harness.
- `packages/docs` is the Docusaurus site, generated from the guides in `packages/*/src/**/__docs__`, the r3f fork's README and diff, the examples, their pictures and the JSDoc; `packages/docs/README.md` explains it.

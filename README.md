# react-pixi-fiber

React renderers for [pixi.js](https://pixijs.com) 2D and [`@pixi/3d`](https://github.com/pixijs/3d) with [react-three-fiber](https://github.com/pmndrs/react-three-fiber) v10's API for both. r3f's own core runs as a fork that asks its renderer through hooks; pixi.js and pixi-3d plug in behind it as a renderer support, which packages fill: `@react-fiber/threejs-compat` maps three's element names (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`, ...) and API onto pixi-3d classes, and `@react-fiber/2d` adds pixi.js's 2D classes. An r3f scene should only have to swap its imports:

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
- import { Color, Vector3 } from 'three';
+ import { Canvas, useFrame } from '@react-fiber/threejs-compat';
+ import { Color, Vector3 } from '@react-fiber/threejs-compat/three';
```

```tsx
import { Canvas } from '@react-fiber/threejs-compat';

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.1} />
      <directionalLight position={[0, 0, 5]} color="red" />
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  );
}
```

pixi.js's 2D classes are elements too, once `@react-fiber/2d` is imported, named after the class with a `2D` suffix (`<sprite2D>`, `<graphics2D>`, `<text2D>`, `<blurFilter2D attach="filters-0" />`), in the same `<Canvas>`, with the same `args`, props, `attach`, hooks and events. They draw in screen space, over the 3D or, with a negative `zIndex`, behind it:

```tsx
import '@react-fiber/2d';
import { Canvas } from '@react-fiber/threejs-compat';
import { Texture } from 'pixi.js';

export function App() {
  return (
    <Canvas>
      <mesh>
        <boxGeometry />
        <meshNormalMaterial />
      </mesh>
      <sprite2D
        texture={Texture.WHITE}
        tint="orange"
        width={80}
        height={40}
        x={20}
        y={20}
        onClick={() => alert('2D')}
      />
      <text2D text="Score: 10" x={20} y={70} style={{ fill: 'white' }} />
    </Canvas>
  );
}
```

2D and 3D also cross: `<anchor2D>` (or any 2D element inside a 3D object) follows that object on screen, for labels and health bars; `<View3D>` draws a 3D scene inside 2D, as a card or a minimap; `<Layer3D>` gives the canvas's 3D a 2D node's transform, alpha, filters and mask, for screen shake or a post filter; and `<RenderTexture2D>` draws 2D into a material's texture, with its events, for screens in the world.

Parity is measured, not assumed: every scene and example is a visual test that renders through pixi-3d on WebGL and WebGPU and through real three.js, and reports how far apart the pictures are. What still differs is listed in [`docs/feasibility.md`](docs/feasibility.md) and on the docs site's Differences page.

## Packages

| Package                       | What it is                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-fiber/core`           | r3f's API on pixi.js: `<Canvas>`, `createRoot`, the hooks, events, the renderer, and the 2D/3D bridges; what the other packages plug into |
| `@react-fiber/threejs-compat` | three's names and API over @pixi/3d, for 1-1 swaps of r3f scenes; `/three` and `/addons` stand in for `three` and `three/addons`          |
| `@react-fiber/2d`             | pixi.js's 2D classes as elements                                                                                                          |
| `@react-fiber/3d`             | @pixi/3d's classes as elements under pixi's conventions; a skeleton for now                                                               |
| `@react-fiber/r3f`            | react-three-fiber's `packages/fiber`, forked so its core calls renderer hooks                                                             |

## Status

Unreleased and local, built on pixi.js 8.23 and `@pixi/3d` 0.1. The catalog has three's geometries (but tube, extrude and shape), its standard, physical, basic, Phong, Lambert, toon, normal and matcap materials with their maps, lines, points, sprites, `instancedMesh`, every light but area lights and probes, shadows, fog, cameras, render targets and cube cameras. `@react-fiber/threejs-compat/three` has three's math, `Color` with its colour management, the catalog's classes, its loaders, `AnimationMixer` and three's constants, and `/addons` has `GLTFLoader`, `OrbitControls`, `MapControls`, `HDRLoader` and `RGBELoader`. `<Environment>`, `useTexture` and `useRenderTarget` are r3f's API on pixi-3d. Every node has three's `Object3D` surface and three's picking. Events, `useFrame`, `useThree`, portals and Suspense are r3f's own. Every pixi.js display class, the filters, graphics contexts and particles are 2D elements, on a screen layer over and under the 3D, in r3f's event system, with animated sprites on the root's clock, pixi's culling and pixi-filters through `extend`; `useTexture` and `useAsset` load their textures, spritesheets, bitmap fonts and video. `<anchor2D>`, `<View3D>`, `<Layer3D>` and `<RenderTexture2D>` bridge 2D and 3D. 2D has no three.js counterpart, so its scenes are held to their own WebGL and WebGPU pictures.

## Develop

```sh
npm install
npm run sync:repos   # clones r3f v10 and the installed pixi-3d and pixi.js into .repos/, for reading
npm run build        # builds every package into its dist
npm test             # lint, types, docs checks and every visual and unit test
npm start            # the playground: every scene on pixi WebGL, pixi WebGPU and three.js
npm run docs:dev     # the docs site on http://127.0.0.1:3000
```

- `packages/` holds the npm workspaces. `packages/r3f` is r3f's fiber package, forked so its core calls the renderer hooks (`packages/r3f/README.md`); `docs/architecture.md` explains the rest.
- `tests/scenes/` and `examples/` are the visual tests and the docs' examples of every package; `tests/README.md` explains the harness.
- `packages/docs` is the Docusaurus site, generated from the guides in `packages/*/src/**/__docs__`, the examples, their pictures and the JSDoc; `packages/docs/README.md` explains it.
- `AGENTS.md` has the ground rules and the checks to run.

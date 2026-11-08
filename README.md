# react-pixi-fiber

A React renderer for [pixi.js](https://pixijs.com) 2D and [`@pixi/3d`](https://github.com/pixijs/pixi-3d) with [react-three-fiber](https://github.com/pmndrs/react-three-fiber) v10's API for both. r3f's own core runs unchanged; pixi-3d plugs in behind it as a renderer support, with three's element names (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`, ...) mapped onto pixi-3d classes. An r3f scene should only have to swap its import:

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
- import { Color, Vector3 } from 'three';
+ import { Canvas, useFrame } from 'react-pixi-fiber';
+ import { Color, Vector3 } from 'react-pixi-fiber/three';
```

```tsx
import { Canvas } from 'react-pixi-fiber';

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

pixi.js's 2D classes are elements too, named after the class with a `2D` suffix (`<sprite2D>`, `<graphics2D>`, `<text2D>`, `<blurFilter2D attach="filters-0" />`), in the same `<Canvas>`, with the same `args`, props, `attach`, hooks and events. They draw in screen space, over the 3D or, with a negative `zIndex`, behind it:

```tsx
import { Texture } from 'pixi.js';
import { Canvas } from 'react-pixi-fiber';

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

Parity is measured, not assumed: every scene and example is a visual test that renders through pixi-3d on WebGL and WebGPU and through real three.js, and reports how far apart the pictures are. What still differs is listed in [`docs/feasibility.md`](docs/feasibility.md) and on the docs site's Differences page.

## Status

Unreleased and local. `@pixi/3d` isn't on npm yet, so the library builds against its source in `.repos/pixi-3d`. The catalog has three's geometries (but tube, extrude and shape), its standard, physical, basic, Phong, Lambert, toon, normal and matcap materials with their maps, lines, points, sprites, `instancedMesh`, every light but area lights and probes, shadows, fog, cameras, render targets and cube cameras. `react-pixi-fiber/three` has three's math, `Color` with its colour management, the catalog's classes, its loaders, `AnimationMixer` and three's constants, and `react-pixi-fiber/addons` has `GLTFLoader`, `OrbitControls`, `MapControls`, `HDRLoader` and `RGBELoader`. `<Environment>`, `useTexture` and `useRenderTarget` are r3f's API on pixi-3d. Every node has three's `Object3D` surface and three's picking. Events, `useFrame`, `useThree`, portals and Suspense are r3f's own. Every pixi.js display class, the filters, graphics contexts and particles are 2D elements, on a screen layer over and under the 3D, in r3f's event system; `useTexture` and `useAsset` load their textures, spritesheets and bitmap fonts. 2D has no three.js counterpart, so its scenes are held to their own WebGL and WebGPU pictures.

## Develop

```sh
npm install
npm run sync:repos   # clones r3f v10, pixi-3d main and pixi.js dev into .repos/
npm test             # lint, types, docs checks and every visual and unit test
npm start            # the playground: every scene on pixi WebGL, pixi WebGPU and three.js
npm run docs:dev     # the docs site on http://127.0.0.1:3000
```

- `src/` is the library. `src/r3f` is r3f's fiber package, vendored and never edited; `docs/architecture.md` explains the rest.
- `tests/scenes/` and `examples/` are the visual tests and the docs' examples; `tests/README.md` explains the harness.
- `docs/` is the Docusaurus site, generated from the guides in `src/**/__docs__`, the examples, their pictures and the JSDoc; `docs/README.md` explains it.
- `AGENTS.md` has the ground rules and the checks to run.

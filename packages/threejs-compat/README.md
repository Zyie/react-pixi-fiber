# @react-fiber/threejs-compat

three.js's names and API over @pixi/3d, so a react-three-fiber app runs on pixi.js by swapping its imports: `<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`, three's `Object3D` members, math, loaders, animation, `<Environment>` and the common addons. It is optional: importing any of its entries installs it, and an app that doesn't import it bundles nothing of three's.

```sh
npm install @react-fiber/core @react-fiber/3d @react-fiber/threejs-compat react react-dom pixi.js @pixi/3d
```

```diff
- import { Canvas, useFrame } from '@react-three/fiber';
- import { Color } from 'three';
- import { GLTFLoader } from 'three/addons';
+ import { Canvas, useFrame } from '@react-fiber/threejs-compat';
+ import { Color } from '@react-fiber/threejs-compat/three';
+ import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
```

Docs: https://react-pixi-fiber.pixijs.io/docs/threejs-compat/

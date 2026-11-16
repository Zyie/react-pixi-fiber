# @react-fiber/core

react-three-fiber v10's API on pixi.js: `<Canvas>`, `createRoot`, `useFrame`, `useThree`, `useLoader`, the pointer events, and the bridges that draw 2D and 3D in one canvas. A root's scene, camera and raycaster are @pixi/3d's; the elements come from the packages you install beside it.

```sh
npm install @react-fiber/core @react-fiber/2d @react-fiber/3d react react-dom pixi.js @pixi/3d
```

```tsx
import { Canvas } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';

<Canvas>
  <ambientLight3D intensity={0.4} />
  <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
  <mesh3D>
    <cubeGeometry3D />
    <material3D baseColor="orange" />
  </mesh3D>
  <text2D text="Hello" x={20} y={20} style={{ fill: 'white' }} />
</Canvas>;
```

Docs: https://react-pixi-fiber.pixijs.io/docs/core/

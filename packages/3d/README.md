# @react-fiber/3d

@pixi/3d's classes as elements of a `@react-fiber/core` canvas, under pixi's conventions: each class name in camelCase with a `3D` suffix, not doubled (`<mesh3D>`, `<container3D>`, `<sphereGeometry3D>`, `<phongMaterial3D>`, `<pointLight3D>`), with @pixi/3d's own options as `args` and its fields as props, and `<OrbitCamera3D>` for camera controls. Importing it installs the elements.

```sh
npm install @react-fiber/core @react-fiber/3d react react-dom pixi.js @pixi/3d
```

```tsx
import { OrbitCamera3D } from '@react-fiber/3d';
import { Canvas } from '@react-fiber/core';

<Canvas camera={{ position: [0, 2, 6] }}>
  <OrbitCamera3D />
  <ambientLight3D intensity={0.4} />
  <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} castShadow />
  <mesh3D castShadow>
    <sphereGeometry3D args={[{ radius: 1 }]} />
    <material3D baseColor="tomato" />
  </mesh3D>
</Canvas>;
```

Docs: https://react-pixi-fiber.pixijs.io/docs/3d/

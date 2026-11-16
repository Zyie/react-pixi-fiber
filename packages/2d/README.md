# @react-fiber/2d

pixi.js's 2D classes as elements of a `@react-fiber/core` canvas: each class name in camelCase with a `2D` suffix (`<sprite2D>`, `<graphics2D>`, `<text2D>`, `<blurFilter2D attach="filters-0">`), with pixi's own props and constructor arguments and react-three-fiber's hooks and events. Importing it installs the elements; it changes no pixi.js class.

```sh
npm install @react-fiber/core @react-fiber/2d react react-dom pixi.js @pixi/3d
```

```tsx
import { Canvas } from '@react-fiber/core';
import '@react-fiber/2d';
import { Texture } from 'pixi.js';

<Canvas>
  <sprite2D texture={Texture.WHITE} tint="orange" width={80} height={80} x={40} y={40} onClick={() => {}} />
</Canvas>;
```

Docs: https://react-pixi-fiber.pixijs.io/docs/2d/

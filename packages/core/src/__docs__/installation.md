# Installation

react-pixi-fiber's packages are installed beside React, pixi.js and @pixi/3d. Every app needs `@react-fiber/core`, which has `<Canvas>` and the hooks; the packages for the elements you use go beside it.

For 2D and 3D under pixi's conventions:

```sh
npm install @react-fiber/core @react-fiber/2d @react-fiber/3d react react-dom pixi.js @pixi/3d
```

For a react-three-fiber app, with three.js's names:

```sh
npm install @react-fiber/core @react-fiber/3d @react-fiber/threejs-compat react react-dom pixi.js @pixi/3d
```

Leave out what you don't use: `@react-fiber/2d` for an app with no 2D, `@react-fiber/3d` for one with no 3D (threejs-compat builds on it, so it stays with compat). `@pixi/3d` stays either way, since a root's scene, camera and renderer are @pixi/3d's: a 2D app ships it too, about 550 KB minified and 165 KB gzipped beside pixi.js.

The packages take `@react-fiber/core`, and threejs-compat `@react-fiber/3d`, as peer dependencies, as pixi.js plugins take pixi.js, so an app has one copy of each: core keeps its registry on pixi.js's one `extensions` object, and a second copy can't register. Install them beside each other, at versions that match.

## Installing a package

A package installs its elements when it is imported, as a pixi.js plugin does. Import it once, anywhere in the program, before the first `<Canvas>` that uses it renders; one imported later, by a code-split route, installs as it loads:

```tsx
import { Canvas } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
```

- `@react-fiber/core` is `<Canvas>`, `createRoot`, the hooks (`useFrame`, `useThree`, `useLoader`, `useAsset`), the events and the bridges between 2D and 3D (`<View3D>`, `<Layer3D>`, `<RenderTexture2D>`, `<anchor2D>`). Importing it changes nothing.
- `@react-fiber/2d` adds pixi.js's classes as elements named after the class with a `2D` suffix: `<sprite2D>`, `<graphics2D>`. It changes no pixi.js class.
- `@react-fiber/3d` adds @pixi/3d's classes the same way, with a `3D` suffix that isn't doubled: `<mesh3D>`, `<container3D>`, `<sphereGeometry3D>`.
- `@react-fiber/threejs-compat` adds three.js's names and API over @pixi/3d's objects. Importing any of its entries, `@react-fiber/threejs-compat`, `/three` or `/addons`, installs it. [Swap your three.js imports](../../../threejs-compat/src/__docs__/swap-imports.md) covers it.

## What it needs

- **React 19**, from 19.0 to 19.3. A React renderer pairs with one major version of React, as react-dom does, and react-pixi-fiber pairs with the same versions as react-three-fiber v10.
- **pixi.js 8.23** or later.
- **@pixi/3d 0.1**.

`three` isn't a dependency of any package. Nothing from three.js runs in a react-pixi-fiber scene, threejs-compat's included.

## With TypeScript

The elements are typed from the classes each package registers, mapped the way react-three-fiber maps three's: importing a package declares its JSX elements, so `<sprite2D>`, `<mesh3D>` and their props are checked. A ref holds the object behind the element, which is pixi's own class, so type it with the class from `pixi.js` or `@pixi/3d`:

```tsx
import type { Mesh3D } from '@pixi/3d';
import type { Sprite } from 'pixi.js';
import { useRef } from 'react';

const mesh = useRef<Mesh3D>(null);
const sprite = useRef<Sprite>(null);
```

# Installation

react-pixi-fiber is a set of packages, installed beside React and PixiJS. React DOM renders `<Canvas>` into the page, and pixi.js is the 2D engine pixi-3d draws through.

```sh
npm install @react-fiber/threejs-compat @react-fiber/2d @react-fiber/core react react-dom pixi.js @pixi/3d
```

- `@react-fiber/core` is react-three-fiber's API on pixi.js: `<Canvas>`, `createRoot`, the hooks, events, and the bridges between 2D and 3D.
- `@react-fiber/threejs-compat` gives pixi-3d three's names and API, so an r3f scene runs as written. Its main entry is r3f's API, everything core exports and `<Environment>`; `@react-fiber/threejs-compat/three` is what an app imports from `three`, and `@react-fiber/threejs-compat/addons` what it imports from `three/addons`. Importing any of them installs it. A root needs it for now, since it gives each root its default scene, camera and raycaster.
- `@react-fiber/2d` adds pixi.js's 2D classes as elements (`<sprite2D>`, `<graphics2D>`, ...). Import it once, anywhere in the program, to install them: `import '@react-fiber/2d';`.

## What it needs

- **React 19**, from 19.0 to 19.3. A React renderer pairs with one major version of React, as react-dom does, and react-pixi-fiber pairs with the same versions as react-three-fiber v10.
- **pixi.js 8.23** or later, which pixi-3d extends.
- **@pixi/3d 0.1**, the renderer.

`three` isn't a dependency. Nothing from three.js runs in a react-pixi-fiber scene.

## With TypeScript

The elements are typed from the classes each package registers, mapped the way r3f maps three's, so `<mesh>`, `<boxGeometry>` and their props are checked as in r3f. Import a package once, anywhere in the program, and its JSX elements are declared: three's names with `@react-fiber/threejs-compat`, the 2D ones with `@react-fiber/2d`.

A ref holds the object behind the element, which is a pixi-3d object. Type it by the element's name, which works with r3f too:

```tsx
import { useRef } from 'react';
import type { ElementRef } from 'react';

const ref = useRef<ElementRef<'mesh'>>(null);
```

`<mesh>` is react-pixi-fiber's `Mesh`, a pixi-3d `Mesh3D` with three's constructor and fields.

## Moving an r3f app

Change every import of `@react-three/fiber` to `@react-fiber/threejs-compat`, of `three` to `@react-fiber/threejs-compat/three`, and of `three/addons` to `@react-fiber/threejs-compat/addons`. Then look for what doesn't come from r3f:

- Code that imports `three` directly, for math or types, runs against three.js objects that a pixi-3d scene can't hold. `THREE.Mesh` in a type becomes pixi-3d's `Mesh3D`.
- `@react-three/drei` builds three.js objects too, so its components don't carry over.
- `shaderMaterial` and node materials have no pixi-3d equivalent.

[Differences from react-three-fiber](differences.md) has the full list, item by item.

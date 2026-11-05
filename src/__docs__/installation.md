# Installation

react-pixi-fiber is installed beside React and PixiJS. React DOM renders `<Canvas>` into the page, and pixi.js is the 2D engine pixi-3d draws through.

```sh
npm install react-pixi-fiber react react-dom pixi.js
```

## What it needs

- **React 19**, from 19.0 to 19.3. A React renderer pairs with one major version of React, as react-dom does, and react-pixi-fiber pairs with the same versions as react-three-fiber v10.
- **pixi.js 8.22** or later, which pixi-3d extends.
- **@pixi/3d**, the renderer. It isn't on npm yet, so a project builds against its source. Resolve `@pixi/3d` to its `src/index.ts` with a path in `tsconfig.json` and an alias in your bundler, as this repository does.

`three` isn't a dependency. Nothing from three.js runs in a react-pixi-fiber scene.

## With TypeScript

The elements are typed from the catalog react-pixi-fiber renders, with r3f's own `ThreeElementsOf` mapping, so `<mesh>`, `<boxGeometry>` and their props are checked as in r3f. Import the package once, anywhere in the program, and its JSX elements are declared.

A ref holds the object behind the element, which is a pixi-3d object, so type it with pixi-3d's class. `<mesh>` is a `Mesh3D`:

```tsx
import type { Mesh3D } from '@pixi/3d';
import { useRef } from 'react';

const ref = useRef<Mesh3D>(null);
```

## Moving an r3f app

Change every import of `@react-three/fiber` to `react-pixi-fiber`. Then look for what doesn't come from r3f:

- Code that imports `three` directly, for math or types, runs against three.js objects that a pixi-3d scene can't hold. `THREE.Mesh` in a type becomes pixi-3d's `Mesh3D`.
- `@react-three/drei` builds three.js objects too, so its components don't carry over.
- `shaderMaterial` and node materials have no pixi-3d equivalent.

[Differences from react-three-fiber](differences.md) has the full list, item by item.

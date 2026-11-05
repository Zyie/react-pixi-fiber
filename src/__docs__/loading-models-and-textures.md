# Loading models and textures

react-three-fiber loads assets with `useLoader`, which suspends while they load and caches them for the next component that asks. react-pixi-fiber runs that hook unchanged. What changes is the loader: three's loaders build three.js objects, so react-pixi-fiber's load through PixiJS's `Assets` and make pixi-3d ones.

## Textures with `useLoader`

Pass the loader and the address of the texture, and use what comes back as a map:

```tsx
import { Suspense } from 'react';
import { Canvas, TextureLoader, useLoader } from 'react-pixi-fiber';

function Crate() {
  const colorMap = useLoader(TextureLoader, 'crate.png');

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={colorMap} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 5]} />
      <Suspense fallback={null}>
        <Crate />
      </Suspense>
    </Canvas>
  );
}
```

`TextureLoader` comes from `react-pixi-fiber`, not from three. The component suspends until the texture has loaded, so it sits under a `<Suspense>`.

Load several at once by passing an array, and get them back in the same order:

```tsx
const [colorMap, normalMap, roughnessMap] = useLoader(TextureLoader, ['color.jpg', 'normal.jpg', 'roughness.jpg']);
```

## Textures with `useTexture`

r3f v10 has `useTexture` built in, and so does react-pixi-fiber:

```tsx
const [colorMap, normalMap] = useTexture(['color.jpg', 'normal.jpg']);
```

Pass an object and get an object back, keyed as you named them, ready to spread on a material:

```tsx
const props = useTexture({ map: 'color.jpg', normalMap: 'normal.jpg' });

return <meshStandardMaterial {...props} />;
```

> [!NOTE]
> A pixi-3d texture's `destroy()` can't be undone, where three's `dispose()` lets a texture be used again. Free a texture only when nothing will draw it again.

## Models

pixi-3d loads glTF through PixiJS's `Assets` and builds the scene it holds as a `Model3D`. Put it in the tree with `<primitive>`, which adds an object you made yourself:

```tsx
import { Model3D } from '@pixi/3d';
import type { Scene3DSource } from '@pixi/3d';
import { Assets } from 'pixi.js';
import { use, useMemo } from 'react';

const robot = Assets.load<Scene3DSource>('robot.glb');

function Robot() {
  const source = use(robot);
  const model = useMemo(() => new Model3D({ source }), [source]);

  return <primitive object={model} position={[0, -1, 0]} />;
}
```

React's `use` suspends until the file has loaded, as `useLoader` does, so `<Robot>` goes under a `<Suspense>` too.

`useLoader(GLTFLoader, url)` with three's `GLTFLoader` doesn't carry over: it builds three.js objects. A glTF loader with the shape of three's, whose result has `nodes` and `materials` as gltfjsx expects, needs bone nodes that pixi-3d doesn't build yet. [Differences from react-three-fiber](differences.md) tracks it under assets.

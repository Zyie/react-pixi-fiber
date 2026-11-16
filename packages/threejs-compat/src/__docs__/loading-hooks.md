# Loading hooks

The hooks that load assets are r3f v10's own, running unchanged: `useLoader`, `useTexture`, `useTextures` and `useGraph`. What they load is pixi-3d's, through loaders with three's API from `@react-fiber/threejs-compat/three` and `@react-fiber/threejs-compat/addons`.

## `useLoader`

`useLoader` loads assets with a loader and suspends while they load, so fallbacks and errors are handled by the `<Suspense>` and the error boundary above it. It takes any loader with three's `load(url, onLoad, onProgress, onError)`: `TextureLoader`, `CubeTextureLoader`, `FileLoader`, `GLTFLoader`, or one of your own that extends `Loader`.

```tsx
import { useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Suspense } from 'react';

function Model() {
  const gltf = useLoader(GLTFLoader, '/model.glb');
  return <primitive object={gltf.scene} />;
}

function App() {
  return (
    <Suspense fallback={null}>
      <Model />
    </Suspense>
  );
}
```

What it loads is cached by URL, so every component that asks for the same URL gets the same object. Be careful changing or disposing of a loaded asset that other components use.

### Loader extensions

The third argument configures the loader before it loads:

```tsx
useLoader(GLTFLoader, url, (loader) => {
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
});
```

### Loading several assets at once

A list of URLs loads in parallel and returns the results in the same order:

```tsx
const [bumpMap, specMap, normalMap] = useLoader(TextureLoader, [url1, url2, url3]);
```

### Loading status

The fourth argument is called with the download's `ProgressEvent`s, for loaders that report them, as `GLTFLoader` and `FileLoader` do:

```tsx
useLoader(GLTFLoader, url, undefined, (event) => console.log((event.loaded / event.total) * 100 + '% loaded'));
```

`DefaultLoadingManager` counts the files of every loader made without a manager of its own.

### Custom cache keys

A URL that changes on every request, such as a signed one, would load again every time. The fifth argument caches it under a key that stays the same:

```tsx
const model = useLoader(GLTFLoader, signedUrl, undefined, undefined, '/model.glb');
useLoader.preload(GLTFLoader, signedUrl, undefined, undefined, '/model.glb');
useLoader.clear(GLTFLoader, signedUrl, '/model.glb');
```

### Loaders that return a scene

When the result has a `scene`, as a glTF has, `useLoader` adds `nodes`, `materials` and `meshes`, every one of the scene's by name, which [gltfjsx](https://gltf.pmnd.rs/) code reads:

```tsx
const { nodes, materials } = useLoader(GLTFLoader, url);
```

### Preloading, clearing and aborting

`useLoader.preload` loads into the cache before a component asks, `useLoader.clear` forgets what it loaded, and `useLoader.loader` gives the loader instance `useLoader` made for a class, whose `abort()` stops a load in flight:

```tsx
useLoader.preload(GLTFLoader, '/model.glb');
useLoader.clear(GLTFLoader, '/model.glb');
useLoader.loader(GLTFLoader).abort();
```

## `useTexture`

`useTexture` loads textures with `TextureLoader` and suspends while they load. Pass a URL, a list or a record; what it returns has the same shape, so a record spreads into a material:

```tsx
const props = useTexture({ map: '/color.jpg', normalMap: '/normal.jpg' });
return <meshStandardMaterial {...props} />;
```

The second argument is `{ onLoad, cache }`, or an `onLoad` function. `cache`, `true` unless you pass `false`, puts the textures in the registry `useTextures` reads. `useTexture.preload(urls)` and `useTexture.clear(urls)` work as `useLoader`'s do. `<Texture input={urls}>{(textures) => ...}</Texture>` is the same hook as a component.

## `useTextures`

`useTextures` is the registry of a root's textures. It returns:

| Member                    | What it does                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `all`                     | Every registered texture, by key                                                                 |
| `get(input)`              | One texture, a list, or a record of them, in the shape asked for; `undefined` for a key it lacks |
| `has(key)`                | Whether a key is registered                                                                      |
| `add(key, texture)`       | Registers a texture with no URL, such as one you drew; `add(record)` registers several           |
| `dispose(key, { force })` | Frees a texture and removes it, unless a mounted `useTexture` holds it or `force` is set         |
| `disposeAll()`            | Frees every texture and empties the registry                                                     |

The component re-renders when the registry changes. `useTextures((registry) => registry.get(url))` re-renders it only when what the selector returns changes. Freeing a three `Texture` frees its GPU memory and keeps it usable, as three's `dispose` does; a plain pixi texture someone added is destroyed with pixi's `destroy`.

## `useGraph`

`useGraph` indexes an object's descendants by name, as `useLoader` does for a loaded scene, and keeps the result while the object stays the same:

```tsx
const { nodes, materials } = useGraph(scene);
return <mesh geometry={nodes.robot.geometry} material={materials.metal} />;
```

## Automatic disposal

When an element unmounts, r3f disposes the object it made, and the geometry and material it held. r3f's AutoDispose demo swaps two boxes on a click, each made, used and disposed in turn:

<!-- snippet: examples/loading-hooks/auto-dispose.example.tsx#result -->

```tsx
import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { ThreeElements } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import { useRef, useState } from 'react';

type BoxProps = { setActive: (active: boolean) => void; active: boolean };

function Box1({ setActive, active, ...props }: BoxProps & ThreeElements['mesh']) {
  const mesh = useRef<Mesh>(null!);
  const [hovered, setHover] = useState(false);

  useFrame((state) => void (mesh.current.position.y = Math.sin(state.elapsed)));

  return (
    <mesh
      {...props}
      ref={mesh}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function Box2({ setActive, active, ...props }: BoxProps & ThreeElements['group']) {
  const mesh = useRef<Mesh>(null!);
  const [hovered, setHover] = useState(false);

  useFrame((state) => void (mesh.current.position.y = Math.sin(state.elapsed)));

  return (
    <group {...props}>
      <mesh
        ref={mesh}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry />
        <meshStandardMaterial color={hovered ? 'green' : 'blue'} />
      </mesh>
    </group>
  );
}

function Switcher() {
  const [active, setActive] = useState(false);

  return (
    <>
      {active && <Box1 active={active} setActive={setActive} position={[-0.5, 0, 0]} />}
      {!active && <Box2 active={active} setActive={setActive} position={[0.25, 0, 0]} />}
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic camera={{ zoom: 100 }}>
      <ambientLight intensity={Math.PI} />
      <Switcher />
    </Canvas>
  );
}
```

`dispose={null}` on an element keeps r3f from disposing it and everything under it, which a component that shows a loaded model sets so the cached file stays whole. Geometries and materials loaded with `GLTFLoader` free only their GPU memory when disposed, as three's do, so they draw again if used again. Objects added with `<primitive>` are never disposed.

# Loading textures

Textures load as in react-three-fiber: with `TextureLoader` through `useLoader`, or with `useTexture`, which r3f v10 has built in. Both give three `Texture`s, from `react-pixi-fiber/three`, and every material slot takes one.

The images on this page are in the repo's `tests/assets/textures`, served from `/textures/`.

## Using `TextureLoader` and `useLoader`

Pass the loader and the address of the image, and use what comes back as a map:

<!-- snippet: examples/loading-textures/texture-loader.example.tsx#load -->

```tsx
const colorMap = useLoader(TextureLoader, '/textures/quadrants.png');
```

A small scene with it, under a `<Suspense>` while it loads:

<!-- snippet: examples/loading-textures/texture-loader.example.tsx#result -->

```tsx
import { Suspense } from 'react';
import { Canvas, useLoader } from 'react-pixi-fiber';
import { TextureLoader } from 'react-pixi-fiber/three';

function Scene() {
  const colorMap = useLoader(TextureLoader, '/textures/quadrants.png');

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh rotation={[0.2, -0.4, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial map={colorMap} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
```

Load several at once by passing a list, and get them back in the same order:

```tsx
const [colorMap, normalMap, roughnessMap, aoMap] = useLoader(TextureLoader, [
  'Color.jpg',
  'Normal.jpg',
  'Roughness.jpg',
  'AmbientOcclusion.jpg',
]);
```

r3f's tutorial ends by adding a `displacementMap` and `displacementScale={0.2}` to a finely divided sphere. Both compile here and do nothing: pixi-3d's materials have no displacement, so the sphere keeps its shape (see [Differences](differences.md)).

## Using `useTexture`

`useTexture` loads through `TextureLoader` without importing it. Pass one URL, or a list:

<!-- snippet: examples/loading-textures/use-texture.example.tsx#array -->

```tsx
const [quadrants, checker] = useTexture(['/textures/quadrants.png', '/textures/checker.png']);
```

Or pass a record, and get the textures back by the same names, ready to spread on a material:

<!-- snippet: examples/loading-textures/use-texture.example.tsx#record -->

```tsx
function Material() {
  const props = useTexture({ map: '/textures/checker.png' });

  return <meshStandardMaterial {...props} />;
}
```

`useTexture.preload(urls)` starts loading before a component asks, and `useTexture.clear(urls)` forgets them. r3f's ChangeTexture demo uses both: a click swaps the URL, and the preloaded texture shows at once:

<!-- snippet: examples/loading-textures/change-texture.example.tsx#result -->

```tsx
import { useState } from 'react';
import { Canvas, useTexture } from 'react-pixi-fiber';

const textures = ['/textures/quadrants.png', '/textures/checker.png', '/textures/cube/pz.png'];

function Plane() {
  const [index, setIndex] = useState(0);
  const texture = useTexture(textures[index]);

  return (
    <mesh scale={2} onClick={() => setIndex((i) => (i + 1) % textures.length)}>
      <planeGeometry />
      <meshBasicMaterial transparent map={texture} />
    </mesh>
  );
}

useTexture.preload(textures);

export function App() {
  return (
    <Canvas>
      <Plane />
    </Canvas>
  );
}
```

## Texture settings

A texture's fields are three's. `wrapS` and `wrapT` take `RepeatWrapping`, `ClampToEdgeWrapping` or `MirroredRepeatWrapping`; `repeat`, `offset`, `center` and `rotation` move the image across the surface; `magFilter` and `minFilter` pick how it is sampled, and `generateMipmaps` and `anisotropy` how it is minified:

<!-- snippet: examples/loading-textures/texture-settings.example.tsx#result -->

```tsx
import { useMemo } from 'react';
import { useLoader } from 'react-pixi-fiber';
import { NearestFilter, RepeatWrapping, TextureLoader } from 'react-pixi-fiber/three';

function Floor() {
  const loaded = useLoader(TextureLoader, '/textures/checker.png');
  const texture = useMemo(() => {
    const tiles = loaded.clone();

    tiles.wrapS = tiles.wrapT = RepeatWrapping;
    tiles.repeat.set(3, 2);
    tiles.center.set(0.5, 0.5);
    tiles.rotation = Math.PI / 8;
    tiles.magFilter = NearestFilter;

    return tiles;
  }, [loaded]);

  return (
    <mesh rotation={[-0.9, 0, 0]}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
```

A change shows on the next frame, so `texture.offset.x += delta` in `useFrame` scrolls it. Textures that `useLoader` caches are shared by every component that loads the same URL: clone one, as above, to give one mesh its own settings.

pixi-3d has one UV transform per material, so a material's `map` sets it for all its maps, or its first map when it has no `map`. three gives each map its own. `flipY` is `true` for an image, as in three, and `false` for data and glTF textures.

`colorSpace` follows three's rules where it can: r3f marks a colour map `SRGBColorSpace` when a prop gives it one, and pixi-3d decodes colour maps from sRGB and reads data maps, such as `normalMap`, as linear. pixi-3d decodes after filtering where three decodes before, so the edges between two colours, and the grey a mipmap blends from them, come out a little darker.

## Textures you make

`CanvasTexture` shows a canvas, `DataTexture` shows pixel data, and `VideoTexture` a playing video. Set `needsUpdate` after drawing to upload the new pixels:

```tsx
const texture = useMemo(() => {
  const canvas = document.createElement('canvas');
  canvas.getContext('2d')!.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}, []);

return <meshBasicMaterial map={texture} />;
```

`CubeTextureLoader` loads six images, +x, -x, +y, -y, +z, -z, into a `CubeTexture` for a skybox:

```tsx
const [sky] = useLoader(CubeTextureLoader, [['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']], (loader) =>
  loader.setPath('/sky/'),
);

return <primitive attach="background" object={sky} />;
```

## The texture registry with `useTextures`

By default, `useTexture` puts what it loads in a registry, and `useTextures` reads it back from anywhere, by URL:

<!-- snippet: examples/loading-textures/registry.example.tsx#result -->

```tsx
import { useTexture, useTextures } from 'react-pixi-fiber';
import { SRGBColorSpace } from 'react-pixi-fiber/three';

const urls = { map: '/textures/quadrants.png?registry', checker: '/textures/checker.png?registry' };

function Loader() {
  useTexture(urls, {
    onLoad: (textures) => {
      for (const texture of Object.values(textures)) texture.colorSpace = SRGBColorSpace;
    },
  });

  return null;
}

function Panels() {
  const { map, checker } = useTextures().get(urls);

  return (
    <>
      <mesh position={[-1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={map ?? null} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={checker ?? null} />
      </mesh>
    </>
  );
}
```

`useTextures().add(key, texture)` registers a texture with no URL. `dispose(key)` frees a texture's GPU memory and removes it from the registry, unless a mounted `useTexture` still holds it; `{ force: true }` frees it anyway. `disposeAll()` empties the registry. A three texture freed this way stays usable, as in three, and uploads again the next time it draws; a plain pixi texture someone registered is destroyed with pixi's `destroy`.

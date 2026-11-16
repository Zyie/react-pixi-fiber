# Loading models

react-three-fiber loads models with `useLoader`, which suspends while a file loads and caches it for the next component that asks. react-pixi-fiber runs that hook unchanged. The loader is what changes: three's `GLTFLoader` builds three.js objects, so react-pixi-fiber has its own, with three's API, that parses the file with pixi-3d and builds pixi-3d objects in the shape three's loader gives.

The models on this page are small files in the repo's `tests/assets/models`, served from `/models/`. Put yours where your app serves static files.

## Loading glTF models

glTF is the format react-three-fiber supports best, and the one react-pixi-fiber loads. Import the hook from `@react-fiber/threejs-compat` and the loader from `@react-fiber/threejs-compat/addons`, where an r3f app imports it from `three/addons`:

```tsx
import { useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
```

A component that loads a model and puts its scene in the tree with `<primitive>`, which adds an object you didn't make with JSX:

<!-- snippet: examples/loading-models/gltf-scene.example.tsx#model -->

```tsx
function Model() {
  const gltf = useLoader(GLTFLoader, '/models/box.glb');

  return <primitive object={gltf.scene} position={[0, -0.5, 0]} />;
}
```

The component suspends until the file has loaded, so it sits under a `<Suspense>`:

<!-- snippet: examples/loading-models/gltf-scene.example.tsx#result -->

```tsx
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Suspense } from 'react';

function Model() {
  const gltf = useLoader(GLTFLoader, '/models/box.glb');

  return <primitive object={gltf.scene} position={[0, -0.5, 0]} />;
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 2, 4] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
```

`gltf.scene` is a `Group` of the catalog's classes, `Object3D`, `Group`, `Mesh`, `SkinnedMesh` and `Bone`, named and placed as three's loader places them. `gltf.scenes`, `gltf.cameras`, `gltf.animations`, `gltf.asset` and `gltf.userData` are there as in three, and so are `gltf.nodes` and `gltf.materials`, which `useLoader` adds to every result with a `scene`.

### Loading glTF models as JSX components

[gltfjsx](https://gltf.pmnd.rs/) turns a model into a component with a mesh in JSX for each mesh of the file, which you can change like any other JSX. It writes code like this, which runs with react-pixi-fiber once its imports are swapped:

<!-- snippet: examples/loading-models/gltfjsx.example.tsx#result -->

```tsx
import { useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import type { Mesh } from '@react-fiber/threejs-compat/three';

export function Model(props: { position?: [number, number, number] }) {
  const { nodes, materials } = useLoader(GLTFLoader, '/models/box.glb');

  return (
    <group {...props} dispose={null}>
      <mesh geometry={(nodes.Base as Mesh).geometry} material={materials.Blue} />
      <mesh
        geometry={(nodes.Box as Mesh).geometry}
        material={materials.Red}
        position={[0, 0.6, 0]}
        rotation={[0, 0.5, 0]}
      />
    </group>
  );
}

useLoader.preload(GLTFLoader, '/models/box.glb');
```

gltfjsx's code calls drei's `useGLTF`, which loads with three's loader. `useLoader(GLTFLoader, url)` returns the same `nodes` and `materials`, so swap one for the other, and `useGLTF.preload` for `useLoader.preload`. `dispose={null}` keeps r3f from disposing the file's geometry and materials when the component unmounts. Without it they are disposed and stay usable, as three's are: their GPU memory comes back the next time something draws them.

The file's materials are `MeshStandardMaterial`s, or `MeshBasicMaterial`s for unlit ones, with their maps as three `Texture`s, so `materials.Red.color.set('orange')` works. A material that uses an extension `MeshStandardMaterial` can't show, such as transmission or clearcoat, keeps pixi-3d's own material, which draws it but doesn't have three's fields.

### Compressed models

Models compressed with Draco or meshopt load as they are. pixi-3d decodes both itself, so the decoders three's loader needs are optional: a `DRACOLoader` only tells it where the Draco decoder is, and `MeshoptDecoder` is a stand-in.

```tsx
import { DRACOLoader, GLTFLoader, MeshoptDecoder } from '@react-fiber/threejs-compat/addons';

const gltf = useLoader(GLTFLoader, '/model.glb', (loader) => {
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
  loader.setMeshoptDecoder(MeshoptDecoder);
});
```

Without a decoder path, pixi-3d fetches the Draco decoder from Google's servers. KTX2 textures need `import 'pixi.js/ktx2'` once in the app.

## Animations

A model's animations are three `AnimationClip`s, and an `AnimationMixer` plays them. Advance the mixer in `useFrame`:

<!-- snippet: examples/loading-models/animation.example.tsx#result -->

```tsx
import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
import { useEffect, useState } from 'react';

function Animated() {
  const { scene, animations } = useLoader(GLTFLoader, '/models/animated.glb');
  const [mixer] = useState(() => new AnimationMixer(scene));

  useEffect(() => {
    const spin = mixer.clipAction('Spin', scene) ?? mixer.clipAction(animations[0])!;
    const bounce = mixer.clipAction(animations.find((clip) => clip.name === 'Bounce')!)!;

    spin.play();
    bounce.play();

    return () => void mixer.stopAllAction();
  }, [mixer, scene, animations]);

  useFrame((_, delta) => mixer.update(delta));

  return <primitive object={scene} />;
}
```

`mixer.clipAction(clip)` gives the clip's `AnimationAction`, which plays, stops, loops, fades and blends as three's does:

```tsx
const walk = mixer.clipAction('Walk', scene)!;
const run = mixer.clipAction('Run', scene)!;

walk.play();
run.setLoop(LoopOnce, 1);
run.clampWhenFinished = true;
walk.crossFadeTo(run.play(), 0.5, true);
mixer.addEventListener('finished', (event) => console.log(event.action));
```

The mixer is three's, on pixi-3d nodes: weights blend with the pose from before the clips played, fades and warps ease over the mixer's time, and `LoopOnce`, `LoopRepeat` and `LoopPingPong` end and repeat as in three. pixi-3d samples the tracks, glTF's cubic splines included. drei's `useAnimations` is a few lines over the mixer; until a drei for react-pixi-fiber exists, keep a mixer in state as above.

### Skinned meshes

A skinned model's joints are `Bone` nodes, where three puts them, and its skinned meshes are `SkinnedMesh`es with a `Skeleton` that follows the bones. An animation moves the bones, and you can move them yourself. gltfjsx writes a skinned model with its root bone through `<primitive>` and the mesh beside it:

<!-- snippet: examples/loading-models/skinned.example.tsx#result -->

```tsx
import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
import type { Group, SkinnedMesh } from '@react-fiber/threejs-compat/three';
import { useEffect, useRef, useState } from 'react';

function Column() {
  const group = useRef<Group>(null!);
  const { nodes, materials, animations } = useLoader(GLTFLoader, '/models/skinned.glb');
  const column = nodes.Column as SkinnedMesh;
  const [mixer] = useState(() => new AnimationMixer(null!));

  useEffect(() => {
    mixer.clipAction(animations[0], group.current)!.play();

    return () => void mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => mixer.update(delta));

  return (
    <group ref={group} dispose={null}>
      <group name="Armature" position={[0, -1, 0]}>
        <primitive object={nodes.Root} />
        <skinnedMesh geometry={column.geometry} material={materials.Skin} skeleton={column.skeleton} />
      </group>
    </group>
  );
}
```

A skinned mesh draws relative to its parent, so keep it beside the root bone, where glTF files and gltfjsx put it.

### Morph targets

A mesh with morph targets has `morphTargetInfluences`, one weight per target, and `morphTargetDictionary`, each target's index by the name the file gives it. Set a weight, give the mesh `morphTargetInfluences={[0, 1]}`, or play a clip that animates them.

## Other formats

three's `OBJLoader`, `FBXLoader` and the rest build three.js objects, which a pixi-3d scene can't hold. Convert those models to glTF, with Blender or [gltf-transform](https://gltf-transform.dev/), to load them here.

## Showing a loader

While a model loads, its `<Suspense>` shows its `fallback`. A fallback inside a mesh can stand in for just a material, as r3f's SuspenseMaterial demo shows:

<!-- snippet: examples/loading-models/suspense-material.example.tsx#result -->

```tsx
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { Loader } from '@react-fiber/threejs-compat/three';
import { Suspense, useReducer } from 'react';

/** Takes a second to load anything, standing in for a slow file */
class SlowLoader extends Loader<number> {
  public override load(url: string, onLoad?: (value: number) => void): void {
    setTimeout(() => onLoad?.(url.length), 1000);
  }
}

function SlowMaterial({ arg = 0 }) {
  useLoader(SlowLoader, `/slow/${arg}`);

  return <meshStandardMaterial color="salmon" />;
}

function FallbackMaterial() {
  return <meshStandardMaterial color="white" />;
}

function Sphere() {
  const [arg, inc] = useReducer((x: number) => x + 1, 0);

  return (
    <mesh onClick={inc}>
      <sphereGeometry args={[1, 64, 32]} />
      <Suspense fallback={<FallbackMaterial />}>
        <SlowMaterial arg={arg} />
      </Suspense>
    </mesh>
  );
}

export function App() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[0, 0, 5]} />
      <Sphere />
    </Canvas>
  );
}
```

For a progress bar, three's `LoadingManager` counts the files its loaders load. `DefaultLoadingManager` counts every loader made without one:

```tsx
import { DefaultLoadingManager } from '@react-fiber/threejs-compat/three';

DefaultLoadingManager.onProgress = (url, loaded, total) => console.log(`${loaded} of ${total}`);
```

`useLoader` also takes a function that gets the download's `ProgressEvent`s, after the loader extensions: `useLoader(GLTFLoader, url, undefined, (event) => ...)`.

### When a file fails to load

A load that fails throws to the nearest error boundary, as in r3f. r3f's SuspenseAndErrors demo loads a file that isn't there; here a boundary catches it and turns the box red:

<!-- snippet: examples/loading-models/suspense-and-errors.example.tsx#result -->

```tsx
import { Canvas, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Loader } from '@react-fiber/threejs-compat/three';
import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/** Takes a while to load, standing in for a slow asset */
class SlowLoader extends Loader<string> {
  public override load(url: string, onLoad?: (value: string) => void): void {
    setTimeout(() => onLoad?.(url), 500);
  }
}

// Suspends the scene for half a second, simulating loading an async asset
function AsyncComponent({ cacheKey }: { cacheKey: string }) {
  useLoader(SlowLoader, cacheKey);

  return null;
}

// Loads a file that does not exist
function SimulateError() {
  useLoader(GLTFLoader, '/doesnotexist.glb');

  return null;
}

// Catches the error and turns the box red, where the demo lets it reach outside the Canvas
class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  public override state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidMount(): void {
    window.addEventListener('error', this._handled);
  }

  public override componentWillUnmount(): void {
    window.removeEventListener('error', this._handled);
  }

  public override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }

  private readonly _handled = (event: ErrorEvent): void => event.preventDefault();
}

function Scene() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setLoad(true), 800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <ambientLight intensity={Math.PI} />
      <pointLight position={[10, 10, 5]} intensity={200} />
      <mesh>
        <boxGeometry />
        <ErrorBoundary fallback={<meshStandardMaterial color="red" />}>
          <meshStandardMaterial color="orange" />
          {load && <SimulateError />}
        </ErrorBoundary>
      </mesh>
      <AsyncComponent cacheKey="1" />
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 100 }}>
      <Scene />
    </Canvas>
  );
}
```

r3f reports an error a boundary catches with `reportError`, which fires a window `error` event. The boundary above listens for it, as an app's own error reporting would.

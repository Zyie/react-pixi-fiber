# @pixi/3d elements

`@react-fiber/3d` puts @pixi/3d's own classes in the tree as elements, under pixi's conventions rather than three's: options objects, @pixi/3d's vectors and rotations, pixi colour sources. It needs no three.js names and installs none. Everything else is react-three-fiber's: `<Canvas>`, `useFrame`, `useThree`, `useLoader`, Suspense, `attach`, `extend` and the pointer events.

## Installing it

```sh
npm install @react-fiber/core @react-fiber/3d react react-dom pixi.js @pixi/3d
```

Import the package once, anywhere in the app. That registers its elements with core:

```tsx
import { Canvas } from '@react-fiber/core';
import '@react-fiber/3d';

export function App() {
  return (
    <Canvas>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <mesh3D angle={[30, 40, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="tomato" />
      </mesh3D>
    </Canvas>
  );
}
```

A root's scene, camera and raycaster are @pixi/3d's too, from `@react-fiber/core`: the camera is a `Camera3D` with a `fov` of 50 at z 5, looking at the origin, as r3f's default is. `<Canvas camera>` sets its fields (`fov`, `near`, `far`, `zoom`, `position`), and `<Canvas orthographic>` makes it orthographic, with `zoom` pixels to a unit.

## Names

Each class is its name in camelCase with a `3D` suffix, once: a name that ends in `3D` keeps it.

| Kind       | Elements                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nodes      | `<container3D>`, `<mesh3D>`, `<model3D>`, `<sprite3D>`, `<batchedMesh3D>`, `<particleContainer3D>`, `<camera3D>`                                                                                                          |
| Lights     | `<ambientLight3D>`, `<directionalLight3D>`, `<pointLight3D>`, `<spotLight3D>`                                                                                                                                             |
| Geometries | `<geometry3D>`, `<cubeGeometry3D>`, `<sphereGeometry3D>`, `<planeGeometry3D>`, `<cylinderGeometry3D>`, `<coneGeometry3D>`, `<capsuleGeometry3D>`, `<torusGeometry3D>`, `<torusKnotGeometry3D>`, `<icosahedronGeometry3D>` |
| Materials  | `<material3D>` (PBR), `<phongMaterial3D>`, `<flatMaterial3D>` (unlit), `<particleMaterial3D>`                                                                                                                             |

A ref gets the @pixi/3d object itself, so its type comes from `@pixi/3d`: `useRef<Mesh3D>(null)`. The one exception is `<camera3D>`, core's `RootCamera`: a `Camera3D` with the members r3f's core calls on a camera, so a camera element can become the root's camera with `useThree((state) => state.set)({ camera })`.

## Args and props

`args` are the class's constructor arguments, which for @pixi/3d's classes is one options object. A geometry is built from its options and has no props to change it later, so a new `args` builds a new one:

```tsx
<sphereGeometry3D args={[{ radius: 0.8, widthSegments: 48 }]} />
<material3D args={[{ emissive: { color: '#ff7a1a', strength: 1 } }]} />
```

Props set the object's fields, and take what the field's setter takes, which the constructor's options name: `baseColor="tomato"` on a material whose `baseColor` reads back as a number, a light's `color`, a node's `position={{ x, y, z }}`. They also take r3f's forms: `position={[1, 2, 3]}`, `scale={2}`, `quaternion={[0, 0, 0, 1]}`, and pierced props such as `position-x={1}` or `textures-baseColor={texture}`. A node's `rotation` is in radians and `angle` in degrees, in x, y, z order.

Lights and cameras face along their local -z, as @pixi/3d's do, so a directional or spot light is aimed by turning it: `angle={[-90, 0, 0]}` points it straight down.

## Events

The pointer events are r3f's (`onClick`, `onPointerOver`, `onPointerMove`, ...), with r3f's bubbling, `stopPropagation` and pointer capture; pixi's own event system stays off. A hit is @pixi/3d's `RaycastHit3D`: `point`, `localPoint`, `distance`, `normal`, `uv` and `triangleIndex`, with the node as `object`. Nodes are picked as @pixi/3d picks them, by their `hitVolume`: a mesh by its geometry's bounds unless it says otherwise, `hitVolume="geometry"` per triangle, which gives hits a `normal` and `uv`. A node with `eventMode="none"` is never hit, and one with `interactiveChildren={false}` keeps its children from being hit.

## Loading

`useAsset` from `@react-fiber/core` loads anything pixi's `Assets` does through r3f's `useLoader`, and suspends until it's ready: a glTF file loads as a `Scene3DSource`, which `<model3D>` takes as `args`, and an image as a texture.

```tsx
import type { Scene3DSource } from '@pixi/3d';
import { useAsset } from '@react-fiber/core';
import type { Texture } from 'pixi.js';

function Robot() {
  const source = useAsset<Scene3DSource>('/robot.glb');
  return <model3D args={[source]} />;
}

function Poster() {
  const texture = useAsset<Texture>('/poster.png');
  return (
    <mesh3D>
      <planeGeometry3D args={[{ width: 2, height: 3, flipV: true }]} />
      <flatMaterial3D args={[{ baseColorTexture: texture }]} />
    </mesh3D>
  );
}
```

A plane that shows a picture takes `flipV`, as @pixi/3d asks, or the picture is upside down.

## With 2D

`@react-fiber/2d` mixes with these elements as it does with three's: 2D over or under the 3D, `<anchor2D>` on a node, `<View3D>`, `<Layer3D>` and `<RenderTexture2D>`, whose texture becomes a @pixi/3d material's `baseColor` texture. Give the mesh `hitVolume="geometry"` for pointer events to reach the 2D in the texture.

## Three's names too

`@react-fiber/threejs-compat` is optional. Importing it adds three's names and API over the same objects (`<mesh>`, `<boxGeometry>`, `Object3D`'s members) for an r3f app that swaps its imports, and makes the root's scene, camera and raycaster three's. Without it, nothing of three's is installed or bundled.

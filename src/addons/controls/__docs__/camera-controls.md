# Camera controls

r3f apps move the camera with three's `OrbitControls`, either through drei's `<OrbitControls>` or by extending three's own class. react-pixi-fiber has three's `OrbitControls` and `MapControls` in `react-pixi-fiber/addons`, ported line for line, so the same drag, wheel and damping move the camera exactly as three's do.

## Orbit controls

Make the class an element with `extend`, and hand it the camera and the canvas:

<!-- snippet: examples/camera-controls/orbit.example.tsx#controls -->

```tsx
function Controls() {
  const { camera, renderer } = useThree();
  const controls = useRef<OrbitControls>(null);

  useFrame(() => controls.current?.update());

  return (
    <orbitControls
      ref={controls}
      args={[camera, renderer.domElement]}
      enableDamping
      maxPolarAngle={Math.PI / 2.2}
      minDistance={2}
      maxDistance={12}
    />
  );
}
```

![A red box and a dark ball on a grey floor, turned by a drag](../../../../tests/snapshots/docs/camera-controls/orbit.webgl.png)

`renderer.domElement` is the canvas; r3f's older `gl.domElement` is the same element. Left drag orbits, the wheel or a middle drag dollies, and a right drag (or a left drag with Shift, Control or Meta) pans. One finger orbits and two dolly and pan.

With TypeScript, declare the element once, as for anything you `extend`:

<!-- snippet: examples/camera-controls/orbit.example.tsx#result -->

```tsx
import { useRef } from 'react';
import { Canvas, extend, useFrame, useThree } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
import { OrbitControls } from 'react-pixi-fiber/addons';

extend({ OrbitControls });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}

function Controls() {
  const { camera, renderer } = useThree();
  const controls = useRef<OrbitControls>(null);

  useFrame(() => controls.current?.update());

  return (
    <orbitControls
      ref={controls}
      args={[camera, renderer.domElement]}
      enableDamping
      maxPolarAngle={Math.PI / 2.2}
      minDistance={2}
      maxDistance={12}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#8d99ae" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#ef233c" />
      </mesh>
      <mesh position={[1.6, 0.4, 1]}>
        <sphereGeometry args={[0.4, 32, 16]} />
        <meshStandardMaterial color="#2b2d42" />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [4, 3, 5] }}>
      <Scene />
      <Controls />
    </Canvas>
  );
}
```

## Updating

The controls move the camera as input arrives. `enableDamping` and `autoRotate` keep it moving after that, so call `update()` every frame, as the example does in `useFrame`. On `frameloop="demand"`, ask for a frame whenever they move:

```tsx
useEffect(() => {
  const controls = ref.current!;
  const onChange = () => invalidate();
  controls.addEventListener('change', onChange);
  return () => controls.removeEventListener('change', onChange);
}, [invalidate]);
```

## Limits and state

| Field                                     | What it limits                                   |
| ----------------------------------------- | ------------------------------------------------ |
| `minDistance`, `maxDistance`              | How close and far a perspective camera can dolly |
| `minZoom`, `maxZoom`                      | How far an orthographic camera can zoom          |
| `minPolarAngle`, `maxPolarAngle`          | How far over and under the target it can orbit   |
| `minAzimuthAngle`, `maxAzimuthAngle`      | How far round the target it can orbit            |
| `enableRotate`, `enableZoom`, `enablePan` | Which moves are allowed                          |

`target` is the point the camera orbits; set it and call `update()`. `saveState()` remembers the target, position and zoom, `reset()` goes back to them, and `dispose()` stops listening, which the element does when it unmounts.

## Map controls

`MapControls` is `OrbitControls` for a map seen from above: a left drag pans along the ground, keeping the point under the pointer under it, and a right drag orbits:

<!-- snippet: examples/camera-controls/map.example.tsx#result -->

```tsx
import { Canvas, extend, useThree } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
import { MapControls } from 'react-pixi-fiber/addons';

extend({ MapControls });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    mapControls: ThreeElement<typeof MapControls>;
  }
}

function Controls() {
  const { camera, renderer } = useThree();
  return <mapControls args={[camera, renderer.domElement]} />;
}

function City() {
  const blocks = [];
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {
      const height = 0.3 + ((x * 7 + z * 13 + 49) % 5) * 0.35;
      blocks.push(
        <mesh key={`${x}:${z}`} position={[x * 1.2, height / 2, z * 1.2]}>
          <boxGeometry args={[0.8, height, 0.8]} />
          <meshStandardMaterial color={(x + z) % 2 === 0 ? '#adb5bd' : '#6c757d'} />
        </mesh>,
      );
    }
  }
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 3]} intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#495057" />
      </mesh>
      {blocks}
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 8, 6] }}>
      <City />
      <Controls />
    </Canvas>
  );
}
```

![City blocks panned by a drag](../../../../tests/snapshots/docs/camera-controls/map.webgl.png)

## What differs

Nothing in how they move: the classes are three's, over this library's math. drei's `<OrbitControls makeDefault>` isn't available; pass the camera you want to move as the first argument.

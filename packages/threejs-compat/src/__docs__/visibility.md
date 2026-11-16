# Visibility

react-three-fiber v10 tells an object when its visibility changes. Three handlers fire on changes, not every frame: `onFramed` for the camera's frustum, `onOccluded` for GPU occlusion, and `onVisible` for the two together with the object's own `visible`. The root state also has the camera's frustum for checks of your own.

## Visibility events

| Handler      | Parameter           | Fires when                                                   |
| ------------ | ------------------- | ------------------------------------------------------------ |
| `onFramed`   | `inView: boolean`   | the object enters (`true`) or leaves (`false`) the frustum   |
| `onOccluded` | `occluded: boolean` | never on pixi-3d, which has no occlusion queries             |
| `onVisible`  | `visible: boolean`  | it is in the frustum and its `visible` is on, or stops being |

<!-- snippet: examples/visibility/visibility-events.example.tsx#events -->

```tsx
import { useRef, useState } from 'react';
import { useFrame } from 'react-pixi-fiber';
import type { Mesh } from 'react-pixi-fiber/three';

function OrbitingSphere({ onFramed }: { onFramed: (inView: boolean) => void }) {
  const mesh = useRef<Mesh>(null!);

  useFrame(({ elapsed }) => {
    const angle = elapsed * 0.5;
    mesh.current.position.set(Math.cos(angle) * 10, Math.sin(angle) * 3, Math.sin(angle) * 10);
  });

  return (
    <mesh ref={mesh} onFramed={onFramed}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

function BlinkingCube({ onVisible }: { onVisible: (visible: boolean) => void }) {
  const [show, setShow] = useState(true);

  useFrame(({ elapsed }) => {
    const next = Math.floor(elapsed / 2.5) % 2 === 0;
    if (next !== show) setShow(next);
  });

  return (
    <mesh position={[2, -1, 0]} rotation={[0.4, 0.6, 0]} visible={show} onVisible={onVisible}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#fb7185" />
    </mesh>
  );
}
```

The frustum check uses the object's bounding sphere, worked out from its geometry. `onVisible` counts an object as unoccluded, as r3f does on WebGL, and logs r3f's warning that occlusion queries need WebGPU.

## The camera frustum

`state.frustum` follows the default camera, updated after the `update` phase and before the render, so a `useFrame` can read it:

```tsx
useFrame(({ frustum }) => {
  for (const object of objects) object.visible = frustum.intersectsObject(object);
});
```

`frustum.containsPoint`, `intersectsSphere`, `intersectsBox` and `intersectsObject` take three's arguments. `<Canvas autoUpdateFrustum={false}>` stops the updates, and `updateFrustum(camera, frustum)` makes one from any camera.

## Occlusion

r3f's `onOccluded` reads three's WebGPU occlusion queries. pixi-3d has none, so `onOccluded` never fires and an object behind another still counts as visible, as it does on r3f's WebGL renderer. The [Differences](differences.md) page lists it.

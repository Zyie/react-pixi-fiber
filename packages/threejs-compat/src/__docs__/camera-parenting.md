# Camera parenting

The default camera lives in the scene, as in react-three-fiber v10, so objects can ride along with it: HUDs, cockpit overlays, headlights. And a camera can ride along with something else, by being its child.

## The default camera lives in the scene

r3f adds the default camera to the scene whenever it has no parent, so whatever you add to the camera renders and follows it. A camera you parented yourself is left where it is.

```tsx
const { camera } = useThree();
camera.add(hudMesh); // renders, and follows the camera
```

## Parenting objects under the camera

Add to the camera in an effect, and remove in its cleanup. `<Portal container={camera}>` does both for you:

<!-- snippet: examples/camera-parenting/hud.example.tsx#hud -->

```tsx
import { useEffect, useRef } from 'react';
import { Portal, useThree } from 'react-pixi-fiber';
import type { Group } from 'react-pixi-fiber/three';

function HUD() {
  const { camera } = useThree();
  const hudRef = useRef<Group>(null);

  useEffect(() => {
    const hud = hudRef.current;
    if (!hud) return;
    camera.add(hud);
    return () => void camera.remove(hud);
  }, [camera]);

  return (
    <group ref={hudRef} position={[0, -0.6, -2]}>
      <mesh>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="green" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Reticle() {
  const { camera } = useThree();

  return (
    <Portal container={camera}>
      <mesh position={[0, 0, -2]}>
        <sphereGeometry args={[0.03, 16, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </Portal>
  );
}
```

By default `Portal` puts a fresh `Scene` under the container and renders its children into that, so `state.scene` inside the portal is a real scene; `state={{ injectScene: false }}` renders them straight into the camera. Both work here as in r3f. The injected scene draws as part of the outer scene, so its own `fog` and `background` aren't drawn.

Lights work in a portal too. As in three, a spot light's target stays outside the scene unless you add it, so these aim at the world's origin from wherever the camera is:

<!-- snippet: examples/camera-parenting/headlights.example.tsx#headlights -->

```tsx
import { Portal, useThree } from 'react-pixi-fiber';

function CameraHeadlights() {
  const { camera } = useThree();

  return (
    <Portal container={camera}>
      <spotLight position={[-0.5, -0.3, 0]} angle={0.5} penumbra={0.3} intensity={100} />
      <spotLight position={[0.5, -0.3, 0]} angle={0.5} penumbra={0.3} intensity={100} />
    </Portal>
  );
}
```

## A camera on a moving object

Move a camera along a path each frame, and anything portalled into it moves along. This is r3f's NestedCamera demo:

<!-- snippet: examples/camera-parenting/nested-camera.example.tsx#rig -->

```tsx
import { useRef } from 'react';
import { Portal, useFrame, useThree } from 'react-pixi-fiber';
import { Vector3 } from 'react-pixi-fiber/three';
import type { Mesh } from 'react-pixi-fiber/three';

function CameraRig() {
  const { camera } = useThree();
  const sphere = useRef<Mesh>(null!);
  const progress = useRef(0.4);
  const position = useRef(new Vector3());
  const ahead = useRef(new Vector3());

  useFrame(({ elapsed }, delta) => {
    progress.current = (progress.current + delta * 0.045) % 1;
    figureEight(progress.current, position.current);
    figureEight((progress.current + 0.015) % 1, ahead.current);
    camera.position.copy(position.current);
    camera.lookAt(ahead.current);

    sphere.current.position.set(Math.sin(elapsed * 1.5) * 1.1, Math.cos(elapsed * 1.5) * 0.55, -2.5);
  });

  return (
    <Portal container={camera}>
      <mesh ref={sphere}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </Portal>
  );
}
```

A camera can also be the child of an object that moves, a car or a turret, and made the default camera with `set({ camera })` (see [Canvas](canvas.md#cameras)). It draws from wherever its parents put it. pixi-3d draws a camera inside the scene directly; a camera outside the drawn scene, such as one in a portal's scene, is copied onto a stand-in camera in the scene each frame, with its projection.

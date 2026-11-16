import { Portal, useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

import { Grid } from './grid';

/** A bar added to the default camera with `camera.add`, which follows the camera in its lower left */
function AddedHud() {
  const camera = useThree((state) => state.camera);
  const hud = useRef<ElementRef<'group'>>(null);

  useLayoutEffect(() => {
    const group = hud.current!;
    camera.add(group);
    return () => void camera.remove(group);
  }, [camera]);

  return (
    <group ref={hud} position={[-0.6, -0.4, -2]}>
      <mesh>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/** A ball rendered into the default camera through `<Portal container={camera}>`, in its upper right */
function PortalHud() {
  const camera = useThree((state) => state.camera);

  return (
    <Portal container={camera}>
      <mesh position={[0.6, 0.35, -2]}>
        <sphereGeometry args={[0.12, 32, 16]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>
    </Portal>
  );
}

/**
 * Children of the default camera, which v10 adds to the scene so they render and follow it. The camera
 * is moved up and to the left and turned to the grid, so the grid is seen at an angle, while the white
 * bar (added with `camera.add`) and the pink ball (rendered through `Portal`) stay put in the lower left
 * and upper right corners, flat to the view.
 */
export const scene: TestScene = {
  camera: { position: [-4, 3, 5] },
  render: () => (
    <>
      <AddedHud />
      <PortalHud />
      <Grid />
    </>
  ),
};

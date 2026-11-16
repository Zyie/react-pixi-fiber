// #region rig
import { Portal, useFrame, useThree } from '@react-fiber/threejs-compat';
import { Vector3 } from '@react-fiber/threejs-compat/three';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import { useRef } from 'react';
// #endregion rig

import type { Example } from '../example';

const COLORS = ['hotpink', 'aquamarine', 'lightblue', 'orange'];

/** The figure-of-eight track the camera rides, a point at `progress` from 0 to 1 */
function figureEight(progress: number, out: Vector3): Vector3 {
  const angle = progress * Math.PI * 2;
  return out.set(3.5 * Math.sin(angle), 1.1, 3.5 * Math.sin(angle) * Math.cos(angle));
}

// #region rig
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
// #endregion rig

function Shapes() {
  const point = new Vector3();
  return (
    <>
      {Array.from({ length: 18 }, (_, index) => {
        figureEight(index / 18, point);
        const side = index % 2 === 0 ? 1 : -1;
        return (
          <mesh key={index} position={[point.x + side * 0.7, 0.85 + (index % 4) * 0.2, point.z + side * 0.4]}>
            {index % 2 ? <boxGeometry args={[0.34, 0.34, 0.34]} /> : <sphereGeometry args={[0.22, 24, 24]} />}
            <meshBasicMaterial color={COLORS[index % COLORS.length]} />
          </mesh>
        );
      })}
      {Array.from({ length: 64 }, (_, index) => {
        figureEight(index / 64, point);
        return (
          <mesh key={`track-${index}`} position={[point.x, 0.08, point.z]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshBasicMaterial color="#c9c9c4" />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * r3f's NestedCamera demo: the camera rides a figure-of-eight track among floating shapes, and a pink
 * ball portalled into the camera circles in front of it, moving with the camera wherever it goes. The
 * track is a row of beads, since the catalog has no tube geometry yet.
 */
export const example: Example = {
  title: 'A camera riding a track, with a ball in front of it',
  frames: 20,
  camera: { fov: 60, near: 0.1, far: 50 },
  render: () => (
    <>
      <color attach="background" args={['#eeeeec']} />
      <Shapes />
      <CameraRig />
    </>
  ),
};

// #region headlights
import { Portal, useThree } from 'react-pixi-fiber';
// #endregion headlights

import type { Example } from '../example';

// #region headlights
function CameraHeadlights() {
  const { camera } = useThree();

  return (
    <Portal container={camera}>
      <spotLight position={[-0.5, -0.3, 0]} angle={0.5} penumbra={0.3} intensity={100} />
      <spotLight position={[0.5, -0.3, 0]} angle={0.5} penumbra={0.3} intensity={100} />
    </Portal>
  );
}
// #endregion headlights

/**
 * Two spot lights portalled into the camera, so they move with it. Their targets stay out of the scene,
 * so, as in three, they aim at the world's origin, and light the boxes in front of the camera.
 */
export const example: Example = {
  title: 'Headlights on the camera',
  camera: { position: [0, 2, 6] },
  render: () => (
    <>
      <ambientLight intensity={0.05} />
      <CameraHeadlights />
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 0.5, -1]}>
          <boxGeometry />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#9a9a9a" />
      </mesh>
    </>
  ),
};

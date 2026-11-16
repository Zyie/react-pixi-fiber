// #region result
import { Canvas, createPortal, extend, useThree } from '@react-fiber/threejs-compat';
import type { ThreeElement } from '@react-fiber/threejs-compat';
import { OrbitControls } from '@react-fiber/threejs-compat/addons';

extend({ OrbitControls });

declare module '@react-fiber/threejs-compat' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}
// #endregion result

import type { Example } from '../example';

// #region result
// #region portal
function PortalTestScene() {
  const { camera, renderer } = useThree();

  return (
    <>
      <color attach="background" args={['#1e1e1e']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <orbitControls args={[camera, renderer.domElement]} />
      {createPortal(
        <mesh position={[0, 0, -2]} scale={0.2}>
          <boxGeometry />
          <meshStandardMaterial color="hotpink" />
        </mesh>,
        camera,
      )}
    </>
  );
}
// #endregion portal

export function App() {
  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
      <ambientLight intensity={Math.PI} />
      <PortalTestScene />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's PortalTest demo: a pink cube portalled into the camera rides with it, so after a drag turns the
 * view the orange box has moved off centre while the pink cube stays ahead of the lens
 */
export const example: Example = {
  title: 'A cube portalled into the camera',
  camera: { position: [0, 0, 2], fov: 75 },
  render: () => (
    <>
      <ambientLight intensity={Math.PI} />
      <PortalTestScene />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await mouse.down();
    for (let step = 1; step <= 4; step++) await mouse.move(200 + step * 10, 150 + step * 4);
    await mouse.up();
    await frames();
  },
};

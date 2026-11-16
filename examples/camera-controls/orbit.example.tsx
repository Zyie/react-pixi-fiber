import { Canvas, extend, useFrame, useThree } from '@react-fiber/threejs-compat';
import type { ThreeElement } from '@react-fiber/threejs-compat';
import { OrbitControls } from '@react-fiber/threejs-compat/addons';
// #region result
import { useRef } from 'react';

extend({ OrbitControls });

declare module '@react-fiber/threejs-compat' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}
// #endregion result

import type { Example } from '../example';

// #region result
// #region controls
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
// #endregion controls

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
// #endregion result

/**
 * `<orbitControls>` with damping, updated in `useFrame`: a drag to the left turns the view round the
 * box, and it eases on for the frames after the button is released
 */
export const example: Example = {
  title: 'Orbit controls',
  camera: { position: [4, 3, 5] },
  render: () => (
    <>
      <Scene />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(240, 150);
    await mouse.down();
    for (let step = 1; step <= 4; step++) await mouse.move(240 - step * 20, 150 - step * 4);
    await mouse.up();
    await frames(15);
  },
};

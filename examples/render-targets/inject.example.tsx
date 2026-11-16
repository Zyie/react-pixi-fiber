import { Canvas, createPortal, useThree } from '@react-fiber/threejs-compat';
import type { ThreeElements } from '@react-fiber/threejs-compat';
import { PerspectiveCamera, Scene } from '@react-fiber/threejs-compat/three';
// #region result
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
const customCamera1 = new PerspectiveCamera(30);
const customCamera2 = new PerspectiveCamera(80);

type CubeProps = ThreeElements['mesh'] & { color: string };

function Cube({ color, ...props }: CubeProps) {
  // Each cube reads the camera of the portal it is in, which sets its size here
  const camera = useThree((state) => state.camera);
  const size = camera.fov / 50;

  return (
    <mesh {...props} scale={size}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

// #region inject
function Portals() {
  const [scene1] = useState(() => new Scene());
  const [scene2] = useState(() => new Scene());

  return (
    <>
      <Cube position={[-0.8, 0, 0]} color="hotpink" />
      {createPortal(
        <group>
          <Cube position={[0, 0.6, 0]} color="lightblue" />
          {createPortal(<Cube position={[0.8, 0, 0]} color="aquamarine" />, scene2, { camera: customCamera2 })}
        </group>,
        scene1,
        { camera: customCamera1 },
      )}
      <primitive object={scene1} />
      <primitive object={scene2} />
    </>
  );
}
// #endregion inject

export function App() {
  return (
    <Canvas>
      <Portals />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Inject demo: portals that replace the camera in their state. Each cube sizes itself from the
 * field of view of the camera it reads: the pink one the root's (50), the blue one its portal's (30)
 * and the green one the nested portal's (80).
 */
export const example: Example = {
  title: 'Portals with their own state',
  render: () => <Portals />,
};

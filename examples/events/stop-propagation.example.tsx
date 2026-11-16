import { Canvas } from '@react-fiber/threejs-compat';
import type { ThreeEvent } from '@react-fiber/threejs-compat';
// #region result
import { useCallback, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Plane({
  stop = false,
  color,
  position,
}: {
  stop?: boolean;
  color: string;
  position: [number, number, number];
}) {
  const [hovered, setHovered] = useState(false);

  // #region over
  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (stop) e.stopPropagation();
      setHovered(true);
    },
    [stop],
  );
  // #endregion over

  const onPointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (stop) e.stopPropagation();
      setHovered(false);
    },
    [stop],
  );

  return (
    <mesh name={color} position={position} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <planeGeometry />
      <meshBasicMaterial color={hovered ? 'orange' : color} toneMapped={false} />
    </mesh>
  );
}

export function App() {
  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 2.25] }}>
      <Plane color="lightblue" position={[-0.5, 0, 1]} />
      <Plane stop color="aquamarine" position={[0, 0, 0.5]} />
      <Plane color="hotpink" position={[0.5, 0, 0]} />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's StopPropagation demo: three planes step back from the camera, and the middle one stops
 * propagation on pointer over. With the pointer where the middle plane covers the back one, the middle
 * plane turns orange and the back one (hotpink) never hears of the pointer. The demo's HUD layers of
 * glTF bottles in drei environments are left out, the camera looks from the front rather than from
 * behind, so the planes need no `side`, and with no lights in the scene the planes are unlit
 * `meshBasicMaterial`s in place of the demo's physical ones, out of tone mapping as the demo's are.
 */
export const example: Example = {
  title: 'Stop propagation',
  camera: { fov: 75, position: [0, 0, 2.25] },
  render: () => (
    <>
      <Plane color="lightblue" position={[-0.5, 0, 1]} />
      <Plane stop color="aquamarine" position={[0, 0, 0.5]} />
      <Plane color="hotpink" position={[0.5, 0, 0]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(230, 150);
    await frames();
  },
};

// #region result
import type { Mesh3D } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Box() {
  const mesh = useRef<Mesh3D>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <mesh3D ref={mesh} rotation-x={0.4} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <cubeGeometry3D args={[{ width: 2, height: 2, depth: 2 }]} />
      <phongMaterial3D baseColor={hovered ? 'hotpink' : 'orange'} />
    </mesh3D>
  );
}

function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Box />
      <text2D text="Hello, 2D and 3D" x={16} y={16} style={{ fill: 'white', fontSize: 24, fontFamily: 'Arial' }} />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  );
}
// #endregion result

/** An orange cube, turning, that is pink while the pointer is on it, under a line of 2D text */
export const example: Example = {
  title: '2D and 3D in one Canvas',
  frames: 31,
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await frames();
  },
};

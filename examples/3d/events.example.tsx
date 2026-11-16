// #region result
import type { FiberEvent } from '@react-fiber/core';
import { Canvas } from '@react-fiber/core';
import '@react-fiber/3d';
import { useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region hover
function Ball({ x }: { x: number }) {
  const [hovered, setHovered] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <mesh3D
      position={[x, 0, 0]}
      scale={1 + clicks * 0.2}
      hitVolume="geometry"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(event: FiberEvent<MouseEvent>) => {
        event.stopPropagation();
        setClicks((count) => count + 1);
      }}
    >
      <sphereGeometry3D args={[{ radius: 0.7 }]} />
      <material3D baseColor={hovered ? 'hotpink' : 'orange'} roughness={0.6} />
    </mesh3D>
  );
}
// #endregion hover

// #region bubbling
function Rack() {
  const [missed, setMissed] = useState(0);

  return (
    <container3D onClick={() => setMissed(0)} onPointerMissed={() => setMissed((count) => count + 1)}>
      <Ball x={-1.6} />
      <Ball x={0} />
      <Ball x={1.6} />
      <mesh3D position={[0, -1.4, 0]} scale={[3.6, 0.15, 1]}>
        <cubeGeometry3D />
        <flatMaterial3D baseColor={missed > 0 ? '#e63946' : '#555555'} />
      </mesh3D>
    </container3D>
  );
}
// #endregion bubbling

function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Rack />
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

/**
 * Three balls that turn pink under the pointer and grow with each click. The left one was clicked once
 * and the middle one is hovered; a click on the empty canvas turned the bar under them red.
 */
export const example: Example = {
  title: 'Hover and click',
  render: () => <Scene />,
  act: async ({ mouse, frames }) => {
    await mouse.click(200 - 1.6 * 64.3, 150);
    await frames();
    await mouse.click(200, 40);
    await frames();
    await mouse.move(200, 150);
    await frames();
  },
};

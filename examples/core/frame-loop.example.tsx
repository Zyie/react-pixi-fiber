// #region result
import type { Mesh3D } from '@pixi/3d';
import { Canvas, useAsset, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import type { Spritesheet, Text } from 'pixi.js';
import { useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region use-frame
function Spinner() {
  const mesh = useRef<Mesh3D>(null);
  const label = useRef<Text>(null);

  useFrame(({ elapsed }, delta) => {
    mesh.current!.rotation.y += delta;
    label.current!.text = `${elapsed.toFixed(2)} s`;
  });

  return (
    <>
      <mesh3D ref={mesh} rotation-x={0.4}>
        <cubeGeometry3D args={[{ width: 1.6, height: 1.6, depth: 1.6 }]} />
        <phongMaterial3D baseColor="#457b9d" />
      </mesh3D>
      <text2D ref={label} x={16} y={12} style={{ fill: 'white', fontSize: 20, fontFamily: 'Arial' }} />
    </>
  );
}
// #endregion use-frame

// #region clock
function Coin() {
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');

  return (
    <animatedSprite2D
      args={[sheet.animations.spin!]}
      animationSpeed={0.2}
      playing
      anchor={0.5}
      scale={2}
      x={330}
      y={230}
    />
  );
}
// #endregion clock

function Scene() {
  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Spinner />
      <Coin />
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

/** A cube turned by `useFrame`, the root's clock printed at the top left, and an animated 2D coin the same clock plays; here after 40 frames */
export const example: Example = {
  title: 'One clock for 2D and 3D',
  frames: 41,
  render: () => <Scene />,
};

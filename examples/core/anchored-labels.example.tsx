// #region result
import type { Container3D } from '@pixi/3d';
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import type { ThreeEvent } from '@react-fiber/core';
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region label
function HealthBar({ name, health }: { name: string; health: number }) {
  return (
    <anchor2D point={[0, 0.7, 0]} center={[0.5, 1]} distanceFactor={4.5} sortByDepth>
      <text2D text={name} x={40} anchor={{ x: 0.5, y: 0 }} style={{ fill: 'white', fontSize: 16 }} />
      <graphics2D
        y={22}
        draw={(graphics) =>
          graphics
            .roundRect(0, 0, 80, 12, 4)
            .fill({ color: 'black', alpha: 0.6 })
            .roundRect(2, 2, 76 * health, 8, 3)
            .fill(health > 0.5 ? '#3cb44b' : '#e63946')
        }
      />
    </anchor2D>
  );
}
// #endregion label

function Enemy({ name, angle, color }: { name: string; angle: number; color: string }) {
  const [health, setHealth] = useState(1);

  return (
    <mesh3D
      position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setHealth((value) => Math.max(0, value - 0.25));
      }}
    >
      <cubeGeometry3D args={[{ width: 0.8, height: 0.8, depth: 0.8 }]} />
      <phongMaterial3D baseColor={color} />
      <HealthBar name={name} health={health} />
    </mesh3D>
  );
}

const ENEMIES = [
  { name: 'Ogre', color: '#e76f51' },
  { name: 'Slime', color: '#2a9d8f' },
  { name: 'Bat', color: '#9b5de5' },
  { name: 'Golem', color: '#e9c46a' },
];

function Arena() {
  const ring = useRef<Container3D>(null);
  useFrame((_, delta) => {
    ring.current!.rotation.y += delta * 0.3;
  });

  return (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <container3D ref={ring} position={[0, -0.4, 0]}>
        {ENEMIES.map(({ name, color }, i) => (
          <Enemy key={name} name={name} color={color} angle={Math.PI / 2 + (i * Math.PI) / 2} />
        ))}
      </container3D>
    </>
  );
}

export function App() {
  return (
    <Canvas camera={{ position: [0, 4.5, 5.5] }}>
      <Arena />
    </Canvas>
  );
}
// #endregion result

/**
 * Four boxes on a turning ring, each with a name and a health bar anchored above it, smaller with
 * distance and nearer ones drawn over farther ones; the front one was clicked twice, so its bar is half
 */
export const example: Example = {
  title: 'Health bars anchored to 3D objects',
  camera: { position: [0, 4.5, 5.5] },
  render: () => <Arena />,
  act: async ({ mouse, frames }) => {
    await mouse.click(200, 240);
    await frames();
    await mouse.click(200, 240);
    await frames();
  },
};

// #region result
import { Canvas, useFrame } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/threejs-compat';
import type { ThreeEvent } from '@react-fiber/core';
import type { Group } from '@react-fiber/threejs-compat/three';
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
    <mesh
      position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setHealth((value) => Math.max(0, value - 0.25));
      }}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={color} />
      <HealthBar name={name} health={health} />
    </mesh>
  );
}

const ENEMIES = [
  { name: 'Ogre', color: '#e76f51' },
  { name: 'Slime', color: '#2a9d8f' },
  { name: 'Bat', color: '#9b5de5' },
  { name: 'Golem', color: '#e9c46a' },
];

function Arena() {
  const ring = useRef<Group>(null);
  useFrame((_, delta) => {
    ring.current!.rotation.y += delta * 0.3;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <group ref={ring} position={[0, -0.4, 0]}>
        {ENEMIES.map(({ name, color }, i) => (
          <Enemy key={name} name={name} color={color} angle={Math.PI / 2 + (i * Math.PI) / 2} />
        ))}
      </group>
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

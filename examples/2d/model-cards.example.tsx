// #region result
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, View3D, useFrame } from 'react-pixi-fiber';
import type { Mesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Turntable({ speed, color, children }: { speed: number; color: string; children: ReactNode }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta * speed;
  });

  return (
    <mesh ref={mesh} rotation-x={0.4}>
      {children}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// #region card
function Card({ x, title, color, children }: { x: number; title: string; color: string; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <container2D
      x={x}
      y={hovered ? 30 : 40}
      cursor="pointer"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 160, 220, 14).fill(hovered ? '#ffffff' : '#d8e2dc')} />
      <View3D x={10} y={10} width={140} height={150} camera={{ position: [0, 0, 3.4] }}>
        <color attach="background" args={['#1d3557']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 4]} intensity={2} />
        <Turntable speed={hovered ? 3 : 0.5} color={color}>
          {children}
        </Turntable>
      </View3D>
      <text2D text={title} x={80} y={190} anchor={0.5} style={{ fill: '#1d3557', fontSize: 20 }} />
    </container2D>
  );
}
// #endregion card

function Shelf() {
  return (
    <>
      <Card x={30} title="Crate" color="#e76f51">
        <boxGeometry args={[1.3, 1.3, 1.3]} />
      </Card>
      <Card x={210} title="Gem" color="#2a9d8f">
        <icosahedronGeometry args={[1, 0]} />
      </Card>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Shelf />
    </Canvas>
  );
}
// #endregion result

/** Two 2D cards, each with a model turning in a `<View3D>`; the pointer rests on the right one, which lifts and spins faster */
export const example: Example = {
  title: 'Models in 2D cards',
  frames: 20,
  render: () => <Shelf />,
  act: async ({ mouse, frames }) => {
    await mouse.move(290, 150);
    await frames(10);
  },
};

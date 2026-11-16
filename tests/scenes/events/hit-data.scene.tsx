import type { ThreeEvent } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** Where a click hit: the point, pushed out along the face normal, and the uv as a colour */
interface Hit {
  position: [number, number, number];
  color: string;
}

const channel = (value: number): string =>
  Math.round(Math.min(Math.max(value, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');

/** A box at the origin; each click on it leaves a marker where it hit */
function Target() {
  const [hits, setHits] = useState<Hit[]>([]);

  const onClick = ({ point, face, uv }: ThreeEvent<MouseEvent>) => {
    const normal = face!.normal;
    const position: Hit['position'] = [point.x + normal.x * 0.2, point.y + normal.y * 0.2, point.z + normal.z * 0.2];

    setHits((previous) => [...previous, { position, color: `#${channel(uv!.x)}${channel(uv!.y)}80` }]);
  };

  return (
    <>
      <mesh onClick={onClick}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
      {hits.map(({ position, color }, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.18, 32, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

/**
 * What a click event carries: `point`, `face.normal` and `uv`. A click on the front face and one on the
 * right face each leave a sphere just off the face where it hit, coloured by the uv there (red is u,
 * green is v).
 */
export const scene: TestScene = {
  camera: { position: [3, 2.5, 4] },
  render: () => <Target />,
  act: async ({ mouse, frames }) => {
    await mouse.click(170, 190);
    await frames();
    await mouse.click(255, 150);
    await frames();
  },
};

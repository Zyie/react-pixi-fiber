import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { BackSide, DoubleSide, FrontSide, Raycaster, Vector3 } from 'react-pixi-fiber/three';

import { HitMarkers, useCastOnFrame } from './hit-markers';

type Box = ElementRef<'mesh'>;

/** A hidden unit box the ray can hit, crossed off its faces' diagonals, where it would hit both triangles, with a tile on the floor under it to show where it is */
function Target({ x, z, side, target }: { x: number; z: number; side: number; target: (box: Box | null) => void }) {
  return (
    <>
      <mesh ref={target} position={[x, 0, z]} visible={false}>
        <boxGeometry />
        <meshBasicMaterial side={side} />
      </mesh>
      <mesh position={[x, -0.6, z]}>
        <boxGeometry args={[1, 0.05, 1]} />
        <meshBasicMaterial color={side === FrontSide ? '#3a3f4b' : side === DoubleSide ? '#4b3a3f' : '#3f4b3a'} />
      </mesh>
    </>
  );
}

/** A thin rod along a ray, from its origin to `length` along it */
function Rod({ z, from, length }: { z: number; from: number; length: number }) {
  return (
    <mesh position={[from + length / 2, 0.2, z]}>
      <boxGeometry args={[length, 0.02, 0.02]} />
      <meshBasicMaterial color="#888888" />
    </mesh>
  );
}

function Rays() {
  const sides = useRef<Box[]>([]);
  const limited = useRef<Box[]>([]);
  const points = useCastOnFrame(() => {
    const raycaster = new Raycaster(new Vector3(-3.5, 0.2, -0.8), new Vector3(1, 0, 0));
    const near = new Raycaster(new Vector3(-3.5, 0.2, 1.2), new Vector3(1, 0, 0), 2.5, 5.5);
    const hits = [...raycaster.intersectObjects(sides.current), ...near.intersectObjects(limited.current)];

    return hits.map(({ point }) => [point.x, point.y + 0.15, point.z]);
  });

  return (
    <>
      {[FrontSide, DoubleSide, BackSide].map((side, index) => (
        <Target key={side} x={index * 2 - 2} z={-1} side={side} target={(box) => box && (sides.current[index] = box)} />
      ))}
      {[0, 1, 2].map((index) => (
        <Target
          key={index}
          x={index * 2 - 2}
          z={1}
          side={DoubleSide}
          target={(box) => box && (limited.current[index] = box)}
        />
      ))}
      <Rod z={-0.8} from={-3.5} length={7} />
      <Rod z={1.2} from={-1} length={3} />
      <HitMarkers points={points} />
    </>
  );
}

/**
 * Which faces a ray hits, by the material's `side`, and the raycaster's `near` and `far`. Seen from
 * above, two rays run left to right through hidden unit boxes, marked by the tiles under them; each
 * hit gets a marker coloured by its place in the sorted list (red, orange, yellow, green, ...).
 *
 * Back row: a FrontSide box is hit where the ray enters it, a DoubleSide box where it enters and
 * leaves, a BackSide box only where it leaves, so four markers. Front row: three DoubleSide boxes, but
 * the ray only counts hits 2.5 to 5.5 from its origin (the rod spans that stretch), so only the three
 * faces at 3, 4 and 5 get markers.
 */
export const scene: TestScene = {
  camera: { position: [0, 7, 3], fov: 45 },
  frames: 3,
  render: () => <Rays />,
};

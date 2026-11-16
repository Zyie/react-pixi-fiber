import { useLoader } from '@react-fiber/threejs-compat';
import {
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  RepeatWrapping,
  TextureLoader,
} from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useMemo } from 'react';

function Tiles({ x, wrap }: { x: number; wrap: number }) {
  const source = useLoader(TextureLoader, '/textures/quadrants.png?wrap');
  const texture = useMemo(() => {
    const copy = source.clone();

    copy.wrapS = copy.wrapT = wrap;
    copy.repeat.set(2, 2);

    return copy;
  }, [source, wrap]);

  return (
    <mesh position={[x, 0, 0]}>
      <planeGeometry args={[1.8, 1.8]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/**
 * The quadrant texture repeated twice each way on three planes: `RepeatWrapping` tiles it,
 * `MirroredRepeatWrapping` mirrors every other tile, and `ClampToEdgeWrapping` stretches its edge
 * pixels over all but the bottom-left quarter. Each plane has a clone of one loaded texture.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Tiles x={-2} wrap={RepeatWrapping} />
      <Tiles x={0} wrap={MirroredRepeatWrapping} />
      <Tiles x={2} wrap={ClampToEdgeWrapping} />
    </>
  ),
  // Only the edges between quadrants differ: pixi-3d filters the texture before its sRGB decode, three after.
  parity: { maxDiff: 0.03 },
};

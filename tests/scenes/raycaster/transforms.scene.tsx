import { Vector2 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';

import { useCastOnFrame } from './hit-markers';
import type { MarkerPoint } from './hit-markers';

const COLORS = { tilted: '#e6194b', squashed: '#3cb44b', nested: '#4363d8' };

/** A grid of rays from the camera, five across and four down, each marking the first thing it hits */
function Grid() {
  const root = useRef<ElementRef<'group'>>(null);
  const hits = useCastOnFrame(({ raycaster, camera }) => {
    const points: MarkerPoint[] = [];
    const flat = raycaster.intersectObject(root.current!, false);

    for (let row = 0; row < 7; row++) {
      for (let column = 0; column < 9; column++) {
        raycaster.setFromCamera(new Vector2(column / 4 - 1, 0.75 - row / 4), camera);
        const [first] = raycaster.intersectObject(root.current!, true);

        if (first) points.push([first.point.x, first.point.y, first.point.z]);
      }
    }

    return flat.length === 0 ? points : [];
  });

  return (
    <>
      <group ref={root}>
        <mesh name="tilted" position={[-1.8, 0.4, 0]} rotation={[0.5, 0.7, 0.2]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial color="#5a2a33" />
        </mesh>
        <group position={[0.6, -0.2, 0]} scale={[1.6, 0.7, 1]} rotation={[0, 0, 0.4]}>
          <mesh name="squashed" rotation={[0.3, 0.6, 0]}>
            <boxGeometry />
            <meshBasicMaterial color="#2a5a33" />
          </mesh>
        </group>
        <group position={[1.8, 0.8, -1]} rotation={[0, -0.6, 0]}>
          <group position={[0, -0.6, 0]} scale={0.8}>
            <mesh name="nested" position={[0.4, 0, 0]} rotation={[0.2, 0, -0.5]}>
              <sphereGeometry args={[0.8, 24, 12]} />
              <meshBasicMaterial color="#2a335a" />
            </mesh>
          </group>
        </group>
      </group>
      {hits.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.05, 12, 6]} />
          <meshBasicMaterial color={COLORS.tilted} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Picking through transforms: a box turned on three axes, a box inside a parent that is turned and
 * unevenly scaled (sheared), and a sphere three groups deep. A grid of rays from the camera marks
 * where each first hits with a red dot, so the dots sit on the surfaces, following every tilt. The
 * rays are cast through the group holding all three, recursively; cast without `recursive`, the group
 * itself has nothing to hit, and the scene draws no dots unless that finds nothing.
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  frames: 3,
  render: () => <Grid />,
};

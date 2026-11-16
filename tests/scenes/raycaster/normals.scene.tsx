import { Vector2 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';

import { useCastOnFrame } from './hit-markers';
import type { MarkerPoint } from './hit-markers';

/**
 * A grid of rays at a low-poly sphere. Each hit gets two dots pushed out from the surface: a red one
 * along the triangle's flat `face.normal`, a green one along the blended vertex `normal`.
 */
function Normals() {
  const ball = useRef<ElementRef<'mesh'>>(null);
  const points = useCastOnFrame(({ raycaster, camera }) => {
    const markers: MarkerPoint[] = [];

    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 5; column++) {
        raycaster.setFromCamera(new Vector2(column * 0.17 - 0.34, 0.4 - row * 0.2), camera);
        const [hit] = raycaster.intersectObject(ball.current!, false);
        if (!hit) continue;

        const world = ball.current!.matrixWorld;
        const flat = hit.face!.normal.clone().transformDirection(world).multiplyScalar(0.35).add(hit.point);
        const smooth = hit.normal!.clone().transformDirection(world).multiplyScalar(0.35).add(hit.point);

        markers.push([flat.x, flat.y, flat.z], [smooth.x, smooth.y, smooth.z]);
      }
    }

    return markers;
  });

  return (
    <>
      <mesh ref={ball} rotation={[0.3, 0.4, 0]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.04, 10, 5]} />
          <meshBasicMaterial color={index % 2 ? '#3cb44b' : '#e6194b'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * `face.normal` against `normal`: on a sphere of eight by six segments, the flat normal of each hit
 * triangle (red dots) jumps from facet to facet, while the vertex normals blended at the hit (green
 * dots) fan out smoothly from the centre. The segment counts are even because pixi-3d's sphere is
 * three's mirrored across x, which puts the vertices in the same places only for an even count around.
 */
export const scene: TestScene = {
  frames: 3,
  render: () => <Normals />,
};

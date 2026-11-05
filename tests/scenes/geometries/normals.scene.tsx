import type { TestScene } from '@test-scene';

import { GEOMETRIES, galleryPosition } from './gallery';

/**
 * Every generated geometry lit from the upper right on a rough standard material, so the shading
 * shows each geometry's normals: smooth on the curved ones, flat on the polyhedra at detail 0
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 11] },
  render: () => (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      {GEOMETRIES.map((geometry, index) => (
        <mesh key={index} position={galleryPosition(index)} rotation={[0.35, 0.5, 0]}>
          {geometry}
          <meshStandardMaterial color="#e8e2d6" />
        </mesh>
      ))}
    </>
  ),
};

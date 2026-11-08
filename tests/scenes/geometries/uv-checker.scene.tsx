import type { TestScene } from '@test-scene';
import { useTexture } from 'react-pixi-fiber';
import { DoubleSide, LinearFilter } from 'react-pixi-fiber/three';

import { GEOMETRIES, galleryPosition } from './gallery';

function Gallery() {
  const checker = useTexture('/textures/uv-checker.png?gallery');
  // pixi-3d samples without mipmaps; three's are turned off so the picture compares UVs, not filtering
  Object.assign(checker, { generateMipmaps: false, minFilter: LinearFilter });

  return (
    <>
      {GEOMETRIES.map((geometry, index) => (
        <mesh key={index} position={galleryPosition(index)} rotation={[0.35, 0.5, 0]}>
          {geometry}
          <meshBasicMaterial map={checker} side={DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

/**
 * Every generated geometry with a UV checker on an unlit material: the white cell is the image's top
 * left, red grows to the right and green upward, so the picture shows each geometry's UVs and which
 * way they run. Double-sided, so open shapes show their inside too.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 11] },
  render: () => <Gallery />,
};

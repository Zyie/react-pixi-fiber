import { useLoader } from '@react-fiber/threejs-compat';
import { NearestFilter, RepeatWrapping, TextureLoader } from '@react-fiber/threejs-compat/three';
import type { Texture } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useMemo } from 'react';

function Panel({
  position,
  size,
  setup,
}: {
  position: [number, number, number];
  size: number;
  setup: (texture: Texture) => void;
}) {
  const source = useLoader(TextureLoader, '/textures/checker.png?filters');
  const texture = useMemo(() => {
    const copy = source.clone();

    setup(copy);

    return copy;
  }, [source, setup]);

  return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

const zoomedNearest = (texture: Texture): void => {
  texture.repeat.set(0.25, 0.25);
  texture.magFilter = NearestFilter;
};
const zoomedLinear = (texture: Texture): void => {
  texture.repeat.set(0.25, 0.25);
};
const tiledMipmapped = (texture: Texture): void => {
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(16, 16);
};

/**
 * The checker's bottom-left two by two cells blown up with `NearestFilter` (hard edges, top left) and
 * the default `LinearFilter` (soft edges, top right), and tiled sixteen times each way, far smaller
 * than its texels, which the default mipmaps turn an even grey (bottom).
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Panel position={[-1.1, 1.05, 0]} size={1.9} setup={zoomedNearest} />
      <Panel position={[1.1, 1.05, 0]} size={1.9} setup={zoomedLinear} />
      <Panel position={[0, -1.15, 0]} size={1} setup={tiledMipmapped} />
    </>
  ),
  // pixi-3d filters and builds mipmaps from the sRGB bytes and decodes after, where three's sRGB texture
  // format decodes first: the linear edges sit darker and the mipmapped grey is darker. Shapes match.
  parity: { maxDiff: 0.16 },
};

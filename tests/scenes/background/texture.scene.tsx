import type { TestScene } from '@test-scene';
import { useLayoutEffect } from 'react';
import { useTexture, useThree } from 'react-pixi-fiber';
import { SRGBColorSpace } from 'react-pixi-fiber/three';

/** Puts a texture on the scene's `background`, in sRGB as its colours were authored */
function Backdrop({ intensity }: { intensity: number }) {
  const texture = useTexture('/textures/quadrants.png?background');
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    Object.assign(texture, { colorSpace: SRGBColorSpace });
    Object.assign(scene, { background: texture, backgroundIntensity: intensity });
    return () => void Object.assign(scene, { background: null, backgroundIntensity: 1 });
  }, [scene, texture, intensity]);

  return null;
}

/**
 * A texture as the scene's background, stretched over the canvas as three draws one: the quadrant
 * texture fills it, red top left, green top right, blue bottom left, yellow bottom right, with a lit
 * white box drawn over its middle
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Backdrop intensity={1} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh rotation={[0.5, 0.6, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  ),
  // Only the quadrants' edges differ: pixi.js filters the texture in display space, three after its sRGB decode.
  parity: { maxDiff: 0.05 },
};

export { Backdrop };

import type { TestScene } from '@test-scene';
import { useLayoutEffect } from 'react';
import { useThree } from 'react-pixi-fiber';

/** Sets a pixi-3d `Hemisphere` gradient as the scene's background */
function Sky() {
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    Object.assign(scene, { background: { skyColor: '#5d9de0', groundColor: '#3a2f24' } });
    return () => void Object.assign(scene, { background: null });
  }, [scene]);

  return null;
}

/**
 * A pixi-3d `Hemisphere` as the scene's background, which three has no counterpart for: pixi-3d draws
 * the gradient around the scene, behind a sphere lit only by an ambient light. The camera looks at the
 * horizon, so the background is blue at the top and darkens toward the bottom, where the brown ground
 * colour blends in.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 5] },
  render: () => (
    <>
      <Sky />
      <ambientLight intensity={1} />
      <mesh>
        <sphereGeometry args={[1, 48, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  ),
  skip: { renderers: ['three'], reason: 'three.js has no Hemisphere background' },
  parity: false,
};

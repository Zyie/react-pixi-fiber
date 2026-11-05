import type { TestScene } from '@test-scene';
import { Environment } from 'react-pixi-fiber';

import { CUBE_FACES } from './faces';

/**
 * The environment and the background turned a quarter round Y and dimmed: `environmentRotation`,
 * `backgroundRotation`, `environmentIntensity` and `backgroundIntensity`. Looking toward -Z, the red +X
 * marker now sits ahead, behind the spheres, and the mirror sphere reflects the same turned sky as the
 * background shows; the rough sphere is lit more dimly from the same side.
 */
export const scene: TestScene = {
  camera: { position: [0, 0.3, 4], fov: 60 },
  render: () => (
    <>
      <Environment
        files={CUBE_FACES}
        path="/environment/cube/"
        background
        environmentRotation={[0, Math.PI / 2, 0]}
        backgroundRotation={[0, Math.PI / 2, 0]}
        environmentIntensity={0.6}
        backgroundIntensity={0.8}
      />
      <mesh position={[-0.8, 0, 0]}>
        <sphereGeometry args={[0.7, 48, 24]} />
        <meshStandardMaterial metalness={1} roughness={0.02} />
      </mesh>
      <mesh position={[0.8, 0, 0]}>
        <sphereGeometry args={[0.7, 48, 24]} />
        <meshStandardMaterial color="#e9c46a" metalness={0} roughness={0.7} />
      </mesh>
    </>
  ),
};

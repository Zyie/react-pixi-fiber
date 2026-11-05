import type { TestScene } from '@test-scene';
import { Suspense } from 'react';
import { useLoader } from 'react-pixi-fiber';
import { Loader } from 'react-pixi-fiber/three';

/** A loader whose files never arrive */
class StalledLoader extends Loader<string> {
  public override load(): void {}
}

function Stalled() {
  useLoader(StalledLoader, '/never');

  return <meshStandardMaterial color="salmon" />;
}

/**
 * A mesh whose material suspends on a load that never finishes: the inner `<Suspense>` shows its
 * fallback, a white material, and the rest of the scene draws around it
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh>
        <sphereGeometry args={[1.2, 48, 24]} />
        <Suspense fallback={<meshStandardMaterial color="white" />}>
          <Stalled />
        </Suspense>
      </mesh>
    </>
  ),
};

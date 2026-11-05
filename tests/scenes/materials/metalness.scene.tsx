import type { TestScene } from '@test-scene';

const STEPS = [0, 0.25, 0.5, 0.75, 1];
const ROUGHNESS = [0.15, 0.5, 0.9];

/**
 * Spheres from dielectric to metal (left to right) and from smooth to rough (top to bottom), lit by an
 * ambient and a directional light with no environment map: the case where pixi-3d's own PBR shades
 * metal darker and less saturated than three's, and the standard material's three lighting matches.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 9] },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2.5} />
      {ROUGHNESS.map((roughness, row) =>
        STEPS.map((metalness, column) => (
          <mesh key={`${row}-${column}`} position={[(column - 2) * 1.6, (1 - row) * 1.6, 0]}>
            <sphereGeometry args={[0.65, 48, 24]} />
            <meshStandardMaterial color="#d4a017" metalness={metalness} roughness={roughness} />
          </mesh>
        )),
      )}
    </>
  ),
};

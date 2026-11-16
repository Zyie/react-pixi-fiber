import { useTexture } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/** The last step of r3f's loading-textures tutorial: a finely divided sphere with a displacement map */
function Displaced() {
  const [colorMap, displacementMap] = useTexture(['/textures/uv-checker.png', '/textures/checker.png?displacement']);

  return (
    <mesh>
      <sphereGeometry args={[1, 100, 100]} />
      <meshStandardMaterial map={colorMap} displacementScale={0.2} displacementMap={displacementMap} />
    </mesh>
  );
}

/**
 * A sphere covered in a UV checker, its surface pushed out 0.2 where the black and white checker
 * displacing it is white, so its silhouette steps in and out
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 3.6] },
  render: () => (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Displaced />
    </>
  ),
  // pixi-3d's PBR material has no displacement: displacementMap and displacementScale are kept as
  // inert fields so the tutorial compiles, and pixi-3d draws a plain sphere where three pushes the
  // surface out along its normals.
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};

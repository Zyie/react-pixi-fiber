import type { TestScene } from '@test-scene';
import { useLoader } from 'react-pixi-fiber';
import { GLTFLoader } from 'react-pixi-fiber/addons';

function Crate() {
  const { scene } = useLoader(GLTFLoader, '/models/textured-box.glb?textured');

  return <primitive object={scene} />;
}

/** A box whose material's map is the quadrant image embedded in the file, turned to show three faces */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Crate />
    </>
  ),
  // Only the edges between quadrants differ: pixi-3d filters the texture before its sRGB decode, three after.
  parity: { maxDiff: 0.05 },
};

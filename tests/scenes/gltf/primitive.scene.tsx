import type { TestScene } from '@test-scene';
import { useLoader } from 'react-pixi-fiber';
import { GLTFLoader } from 'react-pixi-fiber/addons';

function Model() {
  const gltf = useLoader(GLTFLoader, '/models/box.glb?primitive');

  return <primitive object={gltf.scene} position={[0, -0.5, 0]} />;
}

/** `useLoader(GLTFLoader)` and the whole file in the tree through `<primitive>`: a turned red box on a blue slab */
export const scene: TestScene = {
  camera: { position: [0, 2, 4] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Model />
    </>
  ),
};

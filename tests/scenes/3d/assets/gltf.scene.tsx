import type { Scene3DSource } from '@pixi/3d';
import { AssetsLoader, useAsset, useLoader } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** Two models of one glTF file, loaded through r3f's loading model with pixi's `Assets` */
function Boxes() {
  const source = useLoader(AssetsLoader, '/models/textured-box.glb?native') as Scene3DSource;
  const same = useAsset<Scene3DSource>('/models/textured-box.glb?native');
  const [clicked, setClicked] = useState(false);

  return (
    <>
      <model3D
        args={[source]}
        position={[-1.3, 0, 0]}
        angle={[25, 35, 0]}
        scale={clicked ? 0.6 : 1}
        onClick={() => setClicked(true)}
      />
      <model3D args={[same]} position={[1.3, 0, 0]} angle={[25, -35, 0]} scale={0.8} />
    </>
  );
}

/**
 * A glTF model loaded through r3f's loading model: `useLoader` with core's `AssetsLoader` suspends until
 * pixi's `Assets` has parsed the file into a @pixi/3d `Scene3DSource`, and `useAsset` returns the same
 * source from r3f's cache. Each `<model3D>` builds a model of it from `args`: two textured boxes, the
 * left one turned to the right and the right one, smaller, turned to the left. The left model was
 * clicked: the hit is on a mesh @pixi/3d built inside it, which has no element, so the click reaches
 * the model's `onClick` by bubbling up `parent`, and the model shrinks to 0.6.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Boxes />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(200 - 1.3 * 64.3, 150);
    await frames();
  },
};

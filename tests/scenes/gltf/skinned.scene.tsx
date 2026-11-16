import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';

function Column() {
  const { scene, animations } = useLoader(GLTFLoader, '/models/skinned.glb?skinned');
  const [mixer] = useState(() => new AnimationMixer(scene));

  useLayoutEffect(() => {
    mixer.clipAction(animations[0])!.play();

    return () => void mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => void mixer.update(delta));

  return <primitive object={scene} />;
}

/** A column skinned to three bones, with its `Bend` clip a second in: bent to the left at its middle and upper joints */
export const scene: TestScene = {
  frames: 61,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Column />
    </>
  ),
};

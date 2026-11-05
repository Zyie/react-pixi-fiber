import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';
import { useFrame, useLoader } from 'react-pixi-fiber';
import { GLTFLoader } from 'react-pixi-fiber/addons';
import { AnimationMixer } from 'react-pixi-fiber/three';

function Animated() {
  const { scene, animations } = useLoader(GLTFLoader, '/models/animated.glb?animation');
  const [mixer] = useState(() => new AnimationMixer(scene));

  useLayoutEffect(() => {
    for (const clip of animations) {
      if (clip.name !== 'Sway') mixer.clipAction(clip)!.play();
    }

    return () => void mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => void mixer.update(delta));

  return <primitive object={scene} />;
}

/**
 * The file's `Spin` and `Bounce` clips on an `AnimationMixer`, 40 sixtieths of a second in: the orange
 * bar a third of the way round, the green box rising, and the purple box scaled up by its stepped track
 */
export const scene: TestScene = {
  frames: 41,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Animated />
    </>
  ),
};

import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer, LoopOnce } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';

function Animated() {
  const { scene, animations } = useLoader(GLTFLoader, '/models/animated.glb?crossfade');
  const [mixer] = useState(() => new AnimationMixer(scene));

  useLayoutEffect(() => {
    const spin = mixer.clipAction('Spin', scene) ?? mixer.clipAction(animations[0])!;
    const sway = mixer.clipAction(animations.find((clip) => clip.name === 'Sway')!)!;
    const bounce = mixer.clipAction(animations.find((clip) => clip.name === 'Bounce')!)!;

    spin.play();
    sway.play();
    spin.crossFadeTo(sway, 1, true);
    bounce.setLoop(LoopOnce, 1);
    bounce.clampWhenFinished = true;
    bounce.timeScale = 2;
    bounce.play();

    return () => void mixer.stopAllAction();
  }, [mixer, scene, animations]);

  useFrame((_, delta) => void mixer.update(delta));

  return <primitive object={scene} />;
}

/**
 * Half a second into a one-second warped cross-fade from `Spin` to `Sway` on the orange bar, so each
 * counts half against the bar's rest pose, while `Bounce` plays once at double speed and holds its
 * last frame
 */
export const scene: TestScene = {
  frames: 31,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Animated />
    </>
  ),
};

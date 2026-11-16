import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
// #region result
import { useEffect, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Animated() {
  const { scene, animations } = useLoader(GLTFLoader, '/models/animated.glb');
  const [mixer] = useState(() => new AnimationMixer(scene));

  useEffect(() => {
    // #region play
    const spin = mixer.clipAction('Spin', scene) ?? mixer.clipAction(animations[0])!;
    const bounce = mixer.clipAction(animations.find((clip) => clip.name === 'Bounce')!)!;

    spin.play();
    bounce.play();
    // #endregion play

    return () => void mixer.stopAllAction();
  }, [mixer, scene, animations]);

  useFrame((_, delta) => mixer.update(delta));

  return <primitive object={scene} />;
}
// #endregion result

/** The file's `Spin` and `Bounce` clips playing on an `AnimationMixer`, two thirds of a second in */
export const example: Example = {
  title: 'Playing a glTF animation',
  frames: 41,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Animated />
    </>
  ),
};

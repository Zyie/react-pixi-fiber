import { createPortal, useFrame, useRenderTarget } from '@react-fiber/threejs-compat';
import { Color, PerspectiveCamera, Scene } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** r3f's render target sample with `samples: 4`: a portal scene drawn into a multisampled target */
function Monitor() {
  const target = useRenderTarget(256, 256, { depthBuffer: true, samples: 4 });
  const [scene] = useState(() => {
    const virtual = new Scene();
    virtual.background = new Color('#1d3557');
    return virtual;
  });
  const [camera] = useState(() => {
    const lens = new PerspectiveCamera(50, 1, 0.1, 100);
    lens.position.set(0, 0, 5);
    return lens;
  });

  useFrame(({ renderer }) => {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  });

  return (
    <>
      {createPortal(
        <>
          <mesh position={[-1, 1, 0]} rotation={[0.5, 0.6, 0]}>
            <boxGeometry />
            <meshBasicMaterial color="#e63946" />
          </mesh>
          <mesh position={[1.1, -1, 0]}>
            <sphereGeometry args={[0.6, 32, 16]} />
            <meshBasicMaterial color="#2a9d8f" />
          </mesh>
        </>,
        scene,
      )}
      <mesh rotation={[0, -0.4, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={target.texture} />
      </mesh>
    </>
  );
}

/**
 * A plane showing a target made with `samples: 4`: on a navy ground, a turned red box at its top left
 * and a teal ball at its bottom right, the plane turned a little to the right
 */
export const scene: TestScene = {
  frames: 2,
  render: () => <Monitor />,
};

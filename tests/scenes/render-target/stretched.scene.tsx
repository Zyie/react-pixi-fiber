import type { TestScene } from '@test-scene';
import { useState } from 'react';
import { createPortal, useFrame, useRenderTarget } from 'react-pixi-fiber';
import { Color, PerspectiveCamera, Scene } from 'react-pixi-fiber/three';

/** A square camera drawn into a wide target: three projects with the camera's aspect, so the picture stretches */
function Wide() {
  const target = useRenderTarget(256, 128);
  const [scene] = useState(() => {
    const virtual = new Scene();
    virtual.background = new Color('#14213d');
    return virtual;
  });
  const [camera] = useState(() => {
    const lens = new PerspectiveCamera(50, 1, 0.1, 100);
    lens.position.set(0, 0, 4);
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
        <mesh>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#fca311" />
        </mesh>,
        scene,
      )}
      <mesh>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={target.texture} />
      </mesh>
    </>
  );
}

/**
 * A camera with an `aspect` of 1 drawn into a 256 by 128 target and shown on a square plane: the ball is
 * squeezed to half its width on the target and stretched back to round on the plane, as in three, where
 * pixi-3d on its own would draw it round on the target, and wide on the plane
 */
export const scene: TestScene = {
  frames: 2,
  render: () => <Wide />,
};

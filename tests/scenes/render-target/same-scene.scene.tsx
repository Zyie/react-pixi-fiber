import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { useFrame, useRenderTarget } from 'react-pixi-fiber';

/**
 * r3f's basic render target sample: the root's own scene and camera drawn into a target with
 * `samples: 4`, shown on a plane in that scene. The plane hides while the target is drawn, so it never
 * samples the texture it draws into.
 */
function PortalScene() {
  const fbo = useRenderTarget(512, 512, { depthBuffer: true, samples: 4 });
  const plane = useRef<ElementRef<'mesh'>>(null);

  useFrame(({ renderer, scene, camera }) => {
    plane.current!.visible = false;
    renderer.setRenderTarget(fbo);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    plane.current!.visible = true;
  });

  return (
    <>
      <color attach="background" args={['#264653']} />
      <mesh position={[-1.4, 0.5, 0]} rotation={[0.5, 0.6, 0]}>
        <boxGeometry />
        <meshBasicMaterial color="#f4a261" />
      </mesh>
      <mesh ref={plane} position={[0.9, -0.2, 0]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshBasicMaterial map={fbo.texture} />
      </mesh>
    </>
  );
}

/**
 * On a slate ground, an orange box at the top left, and to its right a plane showing the same scene
 * without the plane: the slate ground and a smaller orange box at its top left
 */
export const scene: TestScene = {
  frames: 2,
  render: () => <PortalScene />,
  // pixi-3d binds the textures of every material a view draws with into the pass, hidden meshes'
  // included, so on WebGPU the target is bound for sampling and as the attachment in one pass, which
  // WebGPU rejects ("includes writable usage and another usage in the same synchronization scope"):
  // the pass is dropped and the plane shows an empty target. WebGL draws it as three does.
  fails: { webgpu: 'differ from three.js' },
};

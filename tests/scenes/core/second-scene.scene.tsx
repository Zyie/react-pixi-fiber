import type { TestScene } from '@test-scene';
import { useState } from 'react';
import type { ElementRef } from 'react';
import { createPortal, useFrame } from 'react-pixi-fiber';

type SceneObject = ElementRef<'scene'>;

/** Attaches a child to nothing, so it stays out of its parent's scene graph */
const detached = () => () => {};

/**
 * Takes over the render phase to draw the root's scene, then a second scene over it from the same
 * camera, as a heads-up display does. The second scene is made by a `<scene>` element that attaches
 * to nothing, and filled through a portal.
 */
function Overlay() {
  const [hud, setHud] = useState<SceneObject | null>(null);

  useFrame(
    ({ renderer, scene, camera }) => {
      renderer.autoClear = true;
      renderer.render(scene, camera);
      if (!hud) return;
      renderer.autoClear = false;
      renderer.render(hud, camera);
      renderer.autoClear = true;
    },
    { phase: 'render' },
  );

  return (
    <>
      <scene ref={setHud} attach={detached} />
      {hud &&
        createPortal(
          <mesh position={[0.6, 0.4, 2]}>
            <planeGeometry args={[1.2, 0.8]} />
            <meshBasicMaterial color="#f0ad4e" />
          </mesh>,
          hud,
        )}
    </>
  );
}

/**
 * Two scenes drawn into one canvas: the blue box of the root's scene, and the orange card of the second
 * scene in front of its top right corner. The camera isn't in the second scene.
 */
export const scene: TestScene = {
  frames: 2,
  render: () => (
    <>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#5d9de0" />
      </mesh>
      <Overlay />
    </>
  ),
};

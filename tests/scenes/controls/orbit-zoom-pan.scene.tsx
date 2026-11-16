import { useThree } from '@react-fiber/threejs-compat';
import { MOUSE } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

import { Arena } from './arena';

function Controls() {
  const { camera, renderer } = useThree();
  return (
    <orbitControls
      args={[camera, renderer.domElement]}
      target={[0, 0.5, 0]}
      minDistance={3}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
    />
  );
}

/**
 * The wheel dollies the camera in until `minDistance` stops it, then a left drag pans, since
 * `mouseButtons` maps the left button to panning. The arena ends close up and shifted to the left
 * and down, as three's OrbitControls leave it.
 */
export const scene: TestScene = {
  camera: { position: [0, 3, 7] },
  render: () => (
    <>
      <Arena />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    for (let notch = 0; notch < 8; notch++) await mouse.wheel(0, -120);
    await mouse.down();
    for (let step = 1; step <= 5; step++) await mouse.move(200 - step * 12, 150 + step * 8);
    await mouse.up();
    await frames();
  },
};

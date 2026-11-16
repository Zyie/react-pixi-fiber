import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

import { Arena } from './arena';

function Controls() {
  const { camera, gl } = useThree();
  return <orbitControls args={[camera, gl.domElement]} maxPolarAngle={Math.PI / 2.4} />;
}

/**
 * A left drag through `<orbitControls>` made with `extend`. Up and to the right, it turns the view round
 * the target and down toward the floor until `maxPolarAngle` stops it; then straight down, it swings the
 * camera over the top. The camera ends looking straight down on the arena, turned so the red box is at
 * the top, where three's OrbitControls put it under the same drag.
 */
export const scene: TestScene = {
  camera: { position: [0, 2, 6] },
  render: () => (
    <>
      <Arena />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 150);
    await mouse.down();
    for (let step = 1; step <= 6; step++) await mouse.move(200 + step * 15, 150 - step * 12);
    for (let step = 1; step <= 4; step++) await mouse.move(290, 78 + step * 30);
    await mouse.up();
    await frames();
  },
};

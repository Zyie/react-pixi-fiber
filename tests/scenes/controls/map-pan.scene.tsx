import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

import { Arena } from './arena';

function Controls() {
  const { camera, renderer } = useThree();
  return <mapControls args={[camera, renderer.domElement]} />;
}

/**
 * `<mapControls>`: a left drag pans along the floor, keeping the point under the pointer under it, so
 * the arena slides up and to the right with the pointer, seen from the same angle
 */
export const scene: TestScene = {
  camera: { position: [0, 5, 5] },
  render: () => (
    <>
      <Arena />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 160);
    await mouse.down();
    for (let step = 1; step <= 5; step++) await mouse.move(200 + step * 14, 160 - step * 10);
    await mouse.up();
    await frames();
  },
};

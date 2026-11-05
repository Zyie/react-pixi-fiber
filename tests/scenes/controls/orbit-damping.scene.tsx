import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import { useFrame, useThree } from 'react-pixi-fiber';
import type { OrbitControls } from 'react-pixi-fiber/addons';

import { Arena } from './arena';

function Controls() {
  const { camera, renderer } = useThree();
  const controls = useRef<OrbitControls>(null);
  useFrame(() => controls.current?.update());
  return <orbitControls ref={controls} args={[camera, renderer.domElement]} enableDamping dampingFactor={0.1} />;
}

/**
 * `enableDamping` with `update()` in `useFrame`: a quick drag to the left sets the view turning, and it
 * eases on over the 20 frames after the button is released, as three's does frame for frame
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
    await mouse.move(250, 150);
    await mouse.down();
    for (let step = 1; step <= 4; step++) await mouse.move(250 - step * 25, 150);
    await mouse.up();
    await frames(20);
  },
};

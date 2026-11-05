import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { useFrame } from 'react-pixi-fiber';

import { Grid } from './grid';
import { DefaultCamera } from './make-default.scene';

/** A rig that turns about the vertical axis, carrying the default camera with it */
function Rig() {
  const rig = useRef<ElementRef<'group'>>(null);

  useFrame((_, delta) => {
    rig.current!.rotation.y += delta * 0.6;
  });

  return (
    <group ref={rig}>
      <group position={[0, 1, 0]}>
        <DefaultCamera position={[0, 1.5, 7]} />
      </group>
    </group>
  );
}

/**
 * The default camera parented to a moving rig, as a camera on a vehicle would be: the rig turns a little
 * each frame, and after 40 frames the camera has swung round to the right of the grid, which it still
 * faces, since the camera aimed at the origin from inside the rig when it mounted. The grid is seen
 * from the right, its left end further away.
 */
export const scene: TestScene = {
  frames: 40,
  render: () => (
    <>
      <Rig />
      <Grid />
    </>
  ),
};

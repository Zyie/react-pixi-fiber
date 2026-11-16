import { useThree } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useLayoutEffect } from 'react';

import { Grid } from './grid';

/** Makes the default camera draw the right half of an image twice as wide as the canvas */
function RightHalf() {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.setViewOffset(800, 300, 400, 0, 400, 300);
    return () => camera.clearViewOffset();
  }, [camera]);

  return null;
}

/**
 * `setViewOffset` on the default camera, as a two-monitor setup would use it: the image is 800 by 300
 * and the canvas shows its right half, so the grid's centre column sits at the canvas's left edge and
 * the two columns to its right fill the rest
 */
export const scene: TestScene = {
  camera: { fov: 50, position: [0, 0, 7] },
  render: () => (
    <>
      <RightHalf />
      <Grid />
    </>
  ),
};

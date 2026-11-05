import type { TestScene } from '@test-scene';

import { Grid } from './grid';

/**
 * `orthographic` with a `zoom` of 60: r3f sets the camera's bounds to the canvas size in pixels, so at
 * zoom 60 a world unit is 60 pixels, and the boxes keep their size whatever their depth
 */
export const scene: TestScene = {
  camera: { zoom: 60, position: [0, 0, 10] },
  canvas: { orthographic: true },
  render: () => <Grid />,
};

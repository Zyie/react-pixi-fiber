import type { TestScene } from '@test-scene';

import { Grid } from './grid';

/**
 * The default camera from `camera` props with three's `zoom`: a fov of 60 zoomed 1.6 times, so the
 * grid of boxes fills the canvas edge to edge where the same camera at zoom 1 would leave a margin
 */
export const scene: TestScene = {
  camera: { fov: 60, zoom: 1.6, position: [0, 0, 6] },
  render: () => <Grid />,
};

import type { TestScene } from '@test-scene';

import { Grid } from './grid';

/**
 * A default camera with its own `aspect` of 2, which makes r3f leave it alone on resize (`manual`): on
 * the 4 by 3 canvas three stretches the picture to that aspect, so the boxes are squeezed to two thirds
 * of their width and the whole grid fits across with room to spare
 */
export const scene: TestScene = {
  camera: { fov: 50, aspect: 2, position: [0, 0, 6] },
  render: () => <Grid />,
};

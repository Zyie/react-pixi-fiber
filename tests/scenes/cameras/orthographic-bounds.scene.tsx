import type { TestScene } from '@test-scene';

import { Grid } from './grid';

/**
 * An orthographic camera with off-centre bounds from `camera` props, which r3f keeps (`manual`):
 * `left` -0.5 to `right` 3.5 across and `top` 1.5 to `bottom` -1.5 up, a world unit to 100 pixels. The
 * canvas shows the grid's centre column at its left edge and the two columns right of it, with the top
 * and bottom rows just cut by the canvas's edges.
 */
export const scene: TestScene = {
  camera: { left: -0.5, right: 3.5, top: 1.5, bottom: -1.5, position: [0, 0, 10] },
  canvas: { orthographic: true },
  render: () => <Grid />,
};

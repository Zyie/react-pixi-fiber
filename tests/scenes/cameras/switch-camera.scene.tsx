import type { TestScene } from '@test-scene';

import { Grid } from './grid';
import { DefaultCamera } from './make-default.scene';

/**
 * Switching the default camera while the scene runs: the first render draws the grid face on from the
 * default camera, then a second render mounts a camera below and to the left that makes itself the
 * default, so the picture is the grid seen from underneath, its left end nearer
 */
export const scene: TestScene = {
  render: () => <Grid />,
  act: async ({ update, frames }) => {
    await frames();
    await update(
      <>
        <DefaultCamera position={[-4, -3, 5]} fov={40} />
        <Grid />
      </>,
    );
  },
};

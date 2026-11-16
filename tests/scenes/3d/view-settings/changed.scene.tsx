import type { TestScene } from '@test-scene';

import { ENVIRONMENT, FOG, Stage } from './stage';

/**
 * The stage with every setting changed when the root mounts, through the `renderer` and `scene` props:
 * the ACES curve at an exposure of 1.5 rolls the white sphere's and the cube's lit sides off instead of
 * clipping them; the hemisphere environment lights every surface blue from above and brown from below
 * and fills the metal sphere with sky and ground; linear fog fades the floor and the far columns into
 * light blue; and `'hard'` shadows have jagged edges
 */
export const scene: TestScene = {
  camera: { position: [0, 1.5, 7] },
  canvas: {
    renderer: { toneMapping: 'aces', exposure: 1.5, shadowFilter: 'hard' },
    scene: { fog: FOG, environment: ENVIRONMENT },
  },
  render: () => <Stage />,
};

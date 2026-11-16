import type { TestScene } from '@test-scene';

import { ENVIRONMENT, FOG, Stage } from './stage';

/**
 * The stage drawn with the defaults for two frames, then given the settings of `changed` on the live
 * renderer and scene, as `useThree` hands them out: the view it already made draws with them from the
 * next frame, so the picture is `changed`'s
 */
export const scene: TestScene = {
  camera: { position: [0, 1.5, 7] },
  frames: 2,
  render: () => <Stage />,
  act: async ({ frames }, { renderer, scene }) => {
    renderer.toneMapping = 'aces';
    renderer.exposure = 1.5;
    renderer.shadowFilter = 'hard';
    scene.fog = FOG;
    scene.environment = ENVIRONMENT;
    await frames();
  },
};

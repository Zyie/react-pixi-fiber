import type { TestScene } from '@test-scene';
import { NoToneMapping } from 'react-pixi-fiber/three';

import { ToneScene } from './tone-scene';

/**
 * The renderer's tone mapping set through the `renderer` prop to no tone mapping, three's `flat` before v10: the lit sides clip to flat white and full colour where the light runs past 1
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMapping: NoToneMapping } },
  render: () => <ToneScene />,
};

import { NeutralToneMapping } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

import { ToneScene } from './tone-scene';

/**
 * The renderer's tone mapping set through the `renderer` prop to `NeutralToneMapping`: colours stay close to their own hue up to a soft shoulder near white
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMapping: NeutralToneMapping } },
  render: () => <ToneScene />,
};

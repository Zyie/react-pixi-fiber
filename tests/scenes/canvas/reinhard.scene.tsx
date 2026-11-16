import { ReinhardToneMapping } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

import { ToneScene } from './tone-scene';

/**
 * The renderer's tone mapping set through the `renderer` prop to `ReinhardToneMapping`: the lit sides roll off softly and never reach white, so the picture is duller than ACES
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMapping: ReinhardToneMapping } },
  render: () => <ToneScene />,
};

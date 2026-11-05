import type { TestScene } from '@test-scene';
import { CineonToneMapping } from 'react-pixi-fiber/three';

import { ToneScene } from './tone-scene';

/**
 * The renderer's tone mapping set through the `renderer` prop to `CineonToneMapping`: a filmic curve with deep shadows and a bright, slightly washed top
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMapping: CineonToneMapping } },
  render: () => <ToneScene />,
};

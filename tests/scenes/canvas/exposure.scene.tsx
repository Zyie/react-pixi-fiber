import type { TestScene } from '@test-scene';

import { ToneScene } from './tone-scene';

/**
 * r3f's default ACES curve with `toneMappingExposure` 0.4 through the `renderer` prop: the whole picture
 * darkens before the curve, so the lit sides no longer reach the curve's shoulder
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  canvas: { renderer: { toneMappingExposure: 0.4 } },
  render: () => <ToneScene />,
};

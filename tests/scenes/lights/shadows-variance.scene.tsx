import type { TestScene } from '@test-scene';

import { ShadowedBox } from './shadowed-box';

/** `renderer={{ shadows: 'variance' }}`: three's `VSMShadowMap`, drawn with pixi-3d's widest filter, so the shadow's edge is soft */
export const scene: TestScene = {
  camera: { position: [4, 4, 6] },
  canvas: { renderer: { shadows: 'variance' } },
  render: () => <ShadowedBox />,
};

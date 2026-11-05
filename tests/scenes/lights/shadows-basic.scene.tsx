import type { TestScene } from '@test-scene';

import { ShadowedBox } from './shadowed-box';

/** `renderer={{ shadows: 'basic' }}`: three's `BasicShadowMap`, pixi-3d's hard filter, so the box's shadow has a hard edge */
export const scene: TestScene = {
  camera: { position: [4, 4, 6] },
  canvas: { renderer: { shadows: 'basic' } },
  render: () => <ShadowedBox />,
};

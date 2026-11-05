import type { TestScene } from '@test-scene';

import { ShadowedBox } from './shadowed-box';

/**
 * Shadows on, through `renderer={{ shadows: true }}`: the box casts its shadow onto the floor, away from
 * the light above and to the right
 */
export const scene: TestScene = {
  camera: { position: [4, 4, 6] },
  canvas: { renderer: { shadows: true } },
  render: () => <ShadowedBox />,
};

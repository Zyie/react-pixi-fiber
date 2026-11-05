import type { TestScene } from '@test-scene';

import { ShadowedBox } from './shadowed-box';

/**
 * The shadows scene with the renderer's shadows left off: `castShadow` and `receiveShadow` are set, but,
 * as in three.js, nothing is drawn until the renderer turns shadows on. The floor is evenly lit.
 */
export const scene: TestScene = {
  camera: { position: [4, 4, 6] },
  render: () => <ShadowedBox />,
};

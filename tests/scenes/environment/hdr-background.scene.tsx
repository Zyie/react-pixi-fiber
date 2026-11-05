import type { TestScene } from '@test-scene';
import { Environment } from 'react-pixi-fiber';

/**
 * `<Environment>` from a Radiance `.hdr`, the same sky as the PNG with a sun 24 times brighter, drawn
 * behind the scene through the renderer's ACES tone mapping, as three tone maps a linear background
 */
export const scene: TestScene = {
  camera: { position: [0, -0.2, -1], fov: 90 },
  render: () => <Environment files="/environment/equirect.hdr" background="only" />,
};

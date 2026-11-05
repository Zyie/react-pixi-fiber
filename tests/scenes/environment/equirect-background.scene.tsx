import type { TestScene } from '@test-scene';
import { Environment } from 'react-pixi-fiber';

/**
 * `<Environment>` from an equirectangular PNG, drawn behind the scene, looking toward +Z: the green
 * marker in the middle, the sun up and to the left, the red marker at the left edge and the magenta
 * one behind
 */
export const scene: TestScene = {
  camera: { position: [0, -0.2, -1], fov: 90 },
  render: () => <Environment files="/environment/equirect.png" background="only" />,
};

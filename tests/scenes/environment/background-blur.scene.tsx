import { Environment } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/**
 * `backgroundBlurriness={0.4}`: the equirectangular sky drawn behind the scene, blurred, with the sun a
 * soft glow and the markers smudged into the horizon. three draws a blurred background from its linear
 * PMREM, so tone mapping greys it, unlike a sharp one from the same image.
 */
export const scene: TestScene = {
  camera: { position: [0, -0.2, -1], fov: 90 },
  render: () => <Environment files="/environment/equirect.png" background="only" backgroundBlurriness={0.4} />,
};

import type { TestScene } from '@test-scene';
import { useLoader } from 'react-pixi-fiber';
import { CubeTextureLoader } from 'react-pixi-fiber/three';

const FACES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'].map((face) => `${face}?cube-texture`);

function Sky() {
  const [texture] = useLoader(CubeTextureLoader, [FACES], (loader) => loader.setPath('/textures/cube/'));

  return <primitive attach="background" object={texture} />;
}

/**
 * A `CubeTextureLoader` cube map as the scene's background, seen from a camera turned to show the
 * +x, +y and -z faces: red, green and yellow, each with a white square at its top left. Nothing else is
 * in the scene, and the default ACES tone mapping is on: three draws an sRGB cube background as it is,
 * untouched by the tone curve, and so does this package. The faces carry a query of their own because
 * `useLoader` caches by loader and URL, not path, and the environment scenes load the same file names.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 0.01], fov: 90, rotation: [0.4, 0.7, 0] },
  render: () => <Sky />,
};

import type { TestScene } from '@test-scene';
import { useFrame, useLoader } from 'react-pixi-fiber';
import { CubeTextureLoader, NoToneMapping } from 'react-pixi-fiber/three';

const FACES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];

function Sky() {
  const [texture] = useLoader(CubeTextureLoader, [FACES], (loader) => loader.setPath('/textures/cube/'));

  useFrame((state) => {
    state.gl.toneMapping = NoToneMapping;
  });

  return (
    <>
      <primitive attach="background" object={texture} />
      <mesh position={[1.2, 0.6, -2]}>
        <sphereGeometry args={[0.3, 32, 16]} />
        <meshBasicMaterial color="black" />
      </mesh>
    </>
  );
}

/**
 * A `CubeTextureLoader` cube map as the scene's background, seen from a camera turned to show the
 * +x, +y and -z faces: red, green and yellow, each with a white square at its top left. The black
 * ball is there because pixi-3d draws no background behind a scene with nothing in it. Tone mapping is
 * off: three leaves an sRGB cube background out of it, where pixi-3d's background pass applies it.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 0.01], fov: 90, rotation: [0.4, 0.7, 0] },
  render: () => <Sky />,
};

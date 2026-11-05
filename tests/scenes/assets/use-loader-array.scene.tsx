import type { TestScene } from '@test-scene';
import { useLoader } from 'react-pixi-fiber';
import { TextureLoader } from 'react-pixi-fiber/three';

function Pair() {
  const [quadrants, checker] = useLoader(
    TextureLoader,
    ['/textures/quadrants.png?array', '/textures/checker.png?array'],
    (loader) => loader.setCrossOrigin('anonymous'),
  );

  return (
    <>
      <mesh position={[-1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={quadrants} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={checker} />
      </mesh>
    </>
  );
}

/** `useLoader` with a list of URLs and an extensions callback: one texture per URL, in order */
export const scene: TestScene = {
  render: () => <Pair />,
};

import type { TestScene } from '@test-scene';
import { useTexture } from 'react-pixi-fiber';
import { LinearFilter } from 'react-pixi-fiber/three';

function Sprites() {
  const checker = useTexture('/textures/uv-checker.png');
  Object.assign(checker, { generateMipmaps: false, minFilter: LinearFilter });

  return (
    <>
      <sprite position={[-2.4, 0, 0]} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={checker} />
      </sprite>
      <sprite position={[0, 0, -2]} scale={[2.4, 1.2, 1]}>
        <spriteMaterial map={checker} color="#ff8fab" />
      </sprite>
      <sprite position={[2.4, 0, 0]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial map={checker} rotation={0.6} opacity={0.6} />
      </sprite>
      <sprite position={[0, -1.6, 0]} scale={[0.8, 0.8, 1]} center={[0, 0]}>
        <spriteMaterial color="#8ecae6" />
      </sprite>
    </>
  );
}

/**
 * `<sprite>`s, which always face the camera: the UV checker as it is, stretched and tinted farther
 * back, turned by `rotation` and half clear, and a plain one with its bottom left corner on its
 * position (`center={[0, 0]}`). The camera looks down at them, and each still faces it square on.
 */
export const scene: TestScene = {
  camera: { position: [0, 3, 6] },
  render: () => <Sprites />,
};

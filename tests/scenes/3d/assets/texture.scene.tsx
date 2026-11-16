import { useAsset } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import type { Texture } from 'pixi.js';

/** Two planes showing one texture, set through a constructor option and through a pierced prop */
function Textured() {
  const texture = useAsset<Texture>('/textures/quadrants.png?native');

  return (
    <>
      <mesh3D position={[-1.1, 0, 0]}>
        <planeGeometry3D args={[{ width: 2, height: 2, flipV: true }]} />
        <flatMaterial3D args={[{ baseColorTexture: texture }]} />
      </mesh3D>
      <mesh3D position={[1.1, 0, 0]}>
        <planeGeometry3D args={[{ width: 2, height: 2, flipV: true }]} />
        <flatMaterial3D textures-baseColor={texture} />
      </mesh3D>
    </>
  );
}

/**
 * A texture loaded with `useAsset` and drawn on two unlit planes side by side, the same picture twice:
 * the left plane's material takes it as its `baseColorTexture` option in `args`, the right one's as the
 * pierced prop `textures-baseColor`, @pixi/3d's texture slot. The planes take `flipV`, as @pixi/3d
 * asks of a plane that shows a picture, so the quadrants are the right way up: red top left, green top
 * right, blue bottom left, yellow bottom right.
 */
export const scene: TestScene = {
  render: () => <Textured />,
};

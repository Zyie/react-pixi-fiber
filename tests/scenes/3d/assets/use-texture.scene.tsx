import { useTexture } from '@react-fiber/core';
import type { TestScene } from '@test-scene';

/** A picture loaded once with `useTexture`, as a 2D sprite and as a @pixi/3d material's texture */
function Pictures() {
  const texture = useTexture('/textures/quadrants.png?use-texture');

  return (
    <>
      <sprite2D texture={texture} x={24} y={86} width={128} height={128} />
      <mesh3D position={[1.2, 0, 0]} angle={[0, -25, 0]}>
        <planeGeometry3D args={[{ width: 2, height: 2, flipV: true }]} />
        <flatMaterial3D textures-baseColor={texture} />
      </mesh3D>
    </>
  );
}

/**
 * `useTexture` without threejs-compat: core's root loads with pixi's `Assets` as its `TextureLoader`, so
 * the hook returns a pixi `Texture`. The same texture, the quadrants picture (red, green, blue and yellow
 * squares), is a 2D sprite on the left and, on the right, the texture of a plane turned 25 degrees about its vertical axis.
 */
export const scene: TestScene = {
  render: () => <Pictures />,
};

// #region result
import { useTexture, useTextures } from '@react-fiber/threejs-compat';
import { SRGBColorSpace } from '@react-fiber/threejs-compat/three';
// #endregion result

import type { Example } from '../example';

// #region result
const urls = { map: '/textures/quadrants.png?registry', checker: '/textures/checker.png?registry' };

function Loader() {
  useTexture(urls, {
    onLoad: (textures) => {
      for (const texture of Object.values(textures)) texture.colorSpace = SRGBColorSpace;
    },
  });

  return null;
}

function Panels() {
  const { map, checker } = useTextures().get(urls);

  return (
    <>
      <mesh position={[-1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={map ?? null} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
        <meshBasicMaterial map={checker ?? null} />
      </mesh>
    </>
  );
}
// #endregion result

/**
 * One component loads two textures with `useTexture`, and another reads them from `useTextures` by URL.
 * The reader draws blank planes until the loader's effect registers the textures, and re-renders then.
 * The loader marks them sRGB itself: r3f marks a colour map sRGB when a prop first gives it one, and
 * these reach the material after a first render without.
 */
export const example: Example = {
  title: 'The texture registry',
  frames: 4,
  render: () => (
    <>
      <Loader />
      <Panels />
    </>
  ),
};

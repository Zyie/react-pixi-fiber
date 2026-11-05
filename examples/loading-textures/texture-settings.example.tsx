// #region result
import { useMemo } from 'react';
import { useLoader } from 'react-pixi-fiber';
import { NearestFilter, RepeatWrapping, TextureLoader } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Floor() {
  const loaded = useLoader(TextureLoader, '/textures/checker.png');
  const texture = useMemo(() => {
    const tiles = loaded.clone();

    tiles.wrapS = tiles.wrapT = RepeatWrapping;
    tiles.repeat.set(3, 2);
    tiles.center.set(0.5, 0.5);
    tiles.rotation = Math.PI / 8;
    tiles.magFilter = NearestFilter;

    return tiles;
  }, [loaded]);

  return (
    <mesh rotation={[-0.9, 0, 0]}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
// #endregion result

/** A texture repeated three by two, turned around its middle, with hard-edged magnification */
export const example: Example = {
  title: 'Repeating and turning a texture',
  render: () => <Floor />,
};

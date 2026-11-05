// #region result
import { useTexture } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
function Tiles() {
  // #region array
  const [quadrants, checker] = useTexture(['/textures/quadrants.png', '/textures/checker.png']);
  // #endregion array

  return (
    <>
      <mesh position={[-2, 0, 0]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial map={quadrants} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial map={checker} />
      </mesh>
    </>
  );
}
// #endregion result

// #region record
function Material() {
  const props = useTexture({ map: '/textures/checker.png' });

  return <meshStandardMaterial {...props} />;
}
// #endregion record

/**
 * `useTexture` with a list of URLs, a texture for each in order (left and middle), and with a record
 * that spreads into a lit material (right)
 */
export const example: Example = {
  title: 'Textures with useTexture',
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Tiles />
      <mesh position={[2, 0, 0]} rotation={[0, -0.4, 0]}>
        <planeGeometry args={[1.7, 1.7]} />
        <Material />
      </mesh>
    </>
  ),
};

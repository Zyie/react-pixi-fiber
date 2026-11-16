// #region result
import { Canvas, useTexture } from '@react-fiber/core';
// #endregion result

import type { Example } from '../example';

// #region result
function Photos() {
  const texture = useTexture('/textures/quadrants.png');

  return (
    <>
      {/* #region filters */}
      <sprite2D texture={texture} x={30} y={60} width={160} height={160}>
        <blurFilter2D attach="filters-0" strength={4} />
        <alphaFilter2D attach="filters-1" alpha={0.6} />
      </sprite2D>
      {/* #endregion filters */}
      {/* #region mask */}
      <container2D x={210} y={60}>
        <sprite2D texture={texture} width={160} height={160} />
        <graphics2D attach="mask" draw={(graphics) => graphics.circle(80, 80, 70).fill('white')} />
      </container2D>
      {/* #endregion mask */}
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Photos />
    </Canvas>
  );
}
// #endregion result

/** A blurred, faded picture with two filters attached, and the same picture masked to a circle */
export const example: Example = {
  title: 'Filters and masks by attach',
  render: () => <Photos />,
};

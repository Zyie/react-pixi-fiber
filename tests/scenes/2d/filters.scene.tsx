import type { TestScene } from '@test-scene';
import { useTexture } from 'react-pixi-fiber';

/** A colour matrix that keeps each pixel's luminance in all three channels */
const GREYSCALE = [0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0.3, 0.59, 0.11, 0, 0, 0, 0, 0, 1, 0] as const;

function Filtered({ blur }: { blur: boolean }) {
  const texture = useTexture('/textures/quadrants.png?filters');

  return (
    <>
      <sprite2D texture={texture} position={[20, 50]} width={110} height={110}>
        <blurFilter2D attach="filters-0" strength={6} />
      </sprite2D>
      <sprite2D texture={texture} position={[145, 50]} width={110} height={110}>
        {blur && <blurFilter2D attach="filters-0" strength={6} />}
        <alphaFilter2D attach="filters-1" alpha={0.4} />
      </sprite2D>
      <sprite2D texture={texture} position={[270, 50]} width={110} height={110}>
        <colorMatrixFilter2D attach="filters-0" matrix={[...GREYSCALE]} />
      </sprite2D>
    </>
  );
}

/**
 * Filters by `attach`: the quadrants texture blurred by a `<blurFilter2D attach="filters-0">` on the
 * left; in the middle a blur and an `<alphaFilter2D attach="filters-1">` at 0.4, then rendered again
 * without the blur, which takes it off and leaves the sharp, faded picture; on the right, grey from a
 * `<colorMatrixFilter2D>` whose `matrix` prop is set.
 */
export const scene: TestScene = {
  render: () => <Filtered blur />,
  act: async ({ update }) => {
    await update(<Filtered blur={false} />);
  },
};

import { PIXI_ONLY } from '@test-scene';
import type { TestScene } from '@test-scene';
import { useTexture } from 'react-pixi-fiber';

function Masked({ masked }: { masked: boolean }) {
  const texture = useTexture('/textures/quadrants.png?mask');

  return (
    <>
      <container2D x={30} y={60}>
        <sprite2D texture={texture} width={150} height={150} />
        <graphics2D attach="mask" draw={(graphics) => graphics.circle(75, 75, 60).fill(0xffffff)} />
      </container2D>
      <sprite2D texture={texture} x={220} y={60} width={150} height={150}>
        {masked && <graphics2D attach="mask" draw={(graphics) => graphics.star(32, 32, 5, 30).fill(0xffffff)} />}
      </sprite2D>
    </>
  );
}

/**
 * A mask by `attach`: on the left a `<graphics2D attach="mask">` cuts a container's quadrants sprite to
 * a circle, drawn in the container's own space. On the right a star masked a sprite and is rendered
 * away, so the whole sprite shows again.
 */
export const scene: TestScene = {
  ...PIXI_ONLY,
  render: () => <Masked masked />,
  act: async ({ update, frames }) => {
    await frames();
    await update(<Masked masked={false} />);
  },
};

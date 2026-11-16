import { RenderTexture2D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/** A 2D panel with two buttons; the one clicked turns green */
function Panel() {
  const [clicked, setClicked] = useState<'left' | 'right' | null>(null);

  return (
    <>
      <graphics2D draw={(graphics) => graphics.rect(0, 0, 256, 128).fill('#1d3557')} />
      <graphics2D
        x={24}
        y={64}
        draw={(graphics) => graphics.roundRect(0, 0, 90, 44, 8).fill(clicked === 'left' ? '#3cb44b' : '#e63946')}
        onClick={() => setClicked('left')}
      />
      <graphics2D
        x={142}
        y={64}
        draw={(graphics) => graphics.roundRect(0, 0, 90, 44, 8).fill(clicked === 'right' ? '#3cb44b' : '#e63946')}
        onClick={() => setClicked('right')}
      />
      <text2D text="Panel" x={24} y={14} style={{ fill: 'white', fontSize: 32, fontFamily: 'Arial' }} />
    </>
  );
}

/**
 * `<RenderTexture2D>` on @pixi/3d's elements: a 2D panel drawn into a texture that becomes the
 * `baseColor` texture of an unlit `<flatMaterial3D>` on a plane turned 20 degrees around y, the right
 * way up through the plane's `flipV`. The panel reads "Panel" over two red buttons. The plane picks per
 * triangle (`hitVolume="geometry"`), so a click on it carries texture coordinates, which reach the 2D:
 * the right button was clicked and is green.
 */
export const scene: TestScene = {
  render: () => (
    <mesh3D angle={[0, -20, 0]} hitVolume="geometry">
      <planeGeometry3D args={[{ width: 4, height: 2, flipV: true }]} />
      <flatMaterial3D>
        <RenderTexture2D width={256} height={128}>
          <Panel />
        </RenderTexture2D>
      </flatMaterial3D>
    </mesh3D>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(255, 170);
    await frames();
  },
};

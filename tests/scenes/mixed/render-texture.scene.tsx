import type { TestScene } from '@test-scene';
import { useState } from 'react';
import { RenderTexture2D, useThree } from 'react-pixi-fiber';

/** A 2D panel the size of the texture it is drawn into, with a button that turns green when clicked */
function Panel() {
  const { width, height } = useThree((state) => state.size);
  const [pressed, setPressed] = useState(false);

  return (
    <>
      <graphics2D draw={(graphics) => graphics.rect(0, 0, width, height).fill('#1d3557')} />
      <graphics2D draw={(graphics) => graphics.rect(0, 0, width, 40).fill('#e63946')} />
      <text2D text="SCREEN" x={12} y={8} style={{ fill: 'white', fontSize: 22, fontFamily: 'Arial' }} />
      <graphics2D
        x={width / 2 - 60}
        y={height / 2}
        draw={(graphics) => graphics.roundRect(0, 0, 120, 60, 10).fill(pressed ? '#3cb44b' : '#888888')}
        onClick={() => setPressed(true)}
      />
    </>
  );
}

/**
 * 2D drawn into a texture for 3D. A `<RenderTexture2D>` of 256 by 256 is the `map` of a plane turned
 * towards the right, with `toneMapped` off so the 2D keeps its colours: a blue panel with a red title
 * bar reading SCREEN at its top, the right way up, and a button in its middle. The pointer clicked the
 * button on the plane, which reached it through the texture coordinates of the hit, so it is green.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={1} />
      <mesh rotation={[0, -0.5, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial toneMapped={false}>
          <RenderTexture2D width={256} height={256}>
            <Panel />
          </RenderTexture2D>
        </meshBasicMaterial>
      </mesh>
    </>
  ),
  act: async ({ mouse, frames }) => {
    await frames();
    await mouse.click(200, 190);
    await frames(2);
  },
};

import type { FiberEvent2D } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

/**
 * Hits ordered across 2D and @pixi/3d's 3D. A grey panel behind the 3D and a grey card over it each turn
 * green on click; the blue cube between them turns yellow. The card stops the click, so the first
 * click, on the card where it covers the cube, reaches neither the cube nor the panel. The second, on
 * the cube where nothing covers it, turns the cube yellow and goes on to the panel behind it, since the
 * cube doesn't stop it. At the end: the card and the panel green, the cube yellow.
 */
function Layers() {
  const [card, setCard] = useState(false);
  const [cube, setCube] = useState(false);
  const [panel, setPanel] = useState(false);

  return (
    <>
      <graphics2D
        zIndex={-1}
        x={60}
        y={40}
        draw={(graphics) => graphics.roundRect(0, 0, 280, 220, 12).fill(panel ? '#3cb44b' : '#505050')}
        onClick={() => setPanel(true)}
      />
      <mesh3D onClick={() => setCube(true)}>
        <cubeGeometry3D args={[{ width: 1.6, height: 1.6, depth: 1.6 }]} />
        <flatMaterial3D baseColor={cube ? '#ffe119' : '#4363d8'} />
      </mesh3D>
      <graphics2D
        x={210}
        y={160}
        draw={(graphics) => graphics.roundRect(0, 0, 100, 60, 8).fill(card ? '#3cb44b' : '#a0a0a0')}
        onClick={(event: FiberEvent2D<MouseEvent>) => {
          event.stopPropagation();
          setCard(true);
        }}
      />
    </>
  );
}

export const scene: TestScene = {
  render: () => <Layers />,
  act: async ({ mouse, frames }) => {
    await mouse.click(240, 180);
    await frames();
    await mouse.click(170, 130);
    await frames();
  },
};

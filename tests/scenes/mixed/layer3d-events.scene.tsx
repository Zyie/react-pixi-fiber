import type { TestScene } from '@test-scene';
import { useState } from 'react';
import { Layer3D } from 'react-pixi-fiber';

const COLORS = ['#457b9d', 'hotpink', 'yellow'];

/** A box whose colour steps on each click */
function Counter() {
  const [clicks, setClicks] = useState(0);

  return (
    <mesh rotation={[0.5, 0.7, 0]} onClick={() => setClicks((count) => count + 1)}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={COLORS[Math.min(clicks, 2)]} />
    </mesh>
  );
}

function Scene({ minimap }: { minimap: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <Counter />
      {minimap && <Layer3D x={150} y={80} scale={0.5} />}
    </>
  );
}

/**
 * Picking through a moved 3D layer. `<Layer3D>` scales the 3D to half and moves it to the right, where
 * the box is drawn around (250, 155). A click at the middle of the canvas, where the box would be
 * unmoved, misses it; a click where it is drawn hits it, once, so it is pink rather than yellow. Then
 * `<Layer3D>` unmounts and the layer goes back: the pink box is full size in the middle again.
 */
export const scene: TestScene = {
  render: () => <Scene minimap />,
  act: async ({ mouse, frames, update }) => {
    await frames();
    await mouse.click(200, 150);
    await frames();
    await mouse.click(250, 155);
    await frames();
    await update(<Scene minimap={false} />);
  },
};

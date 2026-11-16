import { View3D } from '@react-fiber/core';
import type { ThreeEvent } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useState } from 'react';

const COLORS = ['#457b9d', 'hotpink', 'yellow'];

/** A box whose colour steps on each click, and which stops the click there */
function Counter({ position, size }: { position: [number, number, number]; size: number }) {
  const [clicks, setClicks] = useState(0);

  return (
    <mesh
      position={position}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setClicks((count) => count + 1);
      }}
    >
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={COLORS[Math.min(clicks, 2)]} />
    </mesh>
  );
}

/** A 2D button that turns green when clicked and stops the click there */
function Button() {
  const [pressed, setPressed] = useState(false);

  return (
    <graphics2D
      x={190}
      y={150}
      draw={(graphics) => graphics.roundRect(0, 0, 60, 40, 6).fill(pressed ? '#3cb44b' : '#555555')}
      onClick={(event) => {
        event.stopPropagation();
        setPressed(true);
      }}
    />
  );
}

/**
 * Events through a `<View3D>`, inside a card turned 6 degrees. First a 2D button over the view's box is
 * clicked: it turns green and stops the click, so the box under it stays as it was. Then the view's box
 * is clicked through the view's own camera: one click, so it is pink rather than yellow, and it stops
 * the click, so the canvas's own box behind the card doesn't get it. Last, the canvas's box is clicked
 * on the right, away from the card, so it is pink too, from that one click.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} />
      <Counter position={[1.6, 0, -1]} size={3.2} />
      <container2D x={60} y={40} angle={6}>
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 240, 220, 12).fill('#e0e0e0')} />
        <View3D x={10} y={10} width={220} height={200} camera={{ position: [0, 0, 4] }}>
          <color attach="background" args={['#1d3557']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} />
          <Counter position={[0, 0, 0]} size={1.4} />
        </View3D>
      </container2D>
      <Button />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(198, 170);
    await frames();
    await mouse.click(188, 164);
    await frames();
    await mouse.click(345, 150);
    await frames();
  },
};

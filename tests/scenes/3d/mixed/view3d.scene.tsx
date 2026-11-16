import { View3D } from '@react-fiber/core';
import type { ThreeEvent } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Color } from 'pixi.js';
import { useState } from 'react';

const COLORS = ['#457b9d', '#ff69b4', '#ffe119'];

/** A cube whose colour steps on each click, and which stops the click there */
function Counter({ position, size }: { position: [number, number, number]; size: number }) {
  const [clicks, setClicks] = useState(0);

  return (
    <mesh3D
      position={position}
      angle={[20, 30, 0]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        setClicks((count) => count + 1);
      }}
    >
      <cubeGeometry3D args={[{ width: size, height: size, depth: size }]} />
      <phongMaterial3D baseColor={COLORS[Math.min(clicks, 2)]} />
    </mesh3D>
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
 * A `<View3D>` of @pixi/3d's elements inside a light card turned 6 degrees, its scene on a navy
 * background and its own camera, the view's own `Camera3D`. First a 2D button over the view's cube is
 * clicked: it turns green and stops the click, so the cube under it stays blue-grey. Then the view's
 * cube is clicked through the view's camera: one click, so it is pink, and it stops the click, so the
 * canvas's own large cube behind the card doesn't get it. Last, the canvas's cube is clicked on the
 * right, away from the card, so it is pink too.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2} />
      <Counter position={[1.6, 0, -1]} size={2.6} />
      <container2D x={60} y={40} angle={6}>
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 240, 220, 12).fill('#e0e0e0')} />
        <View3D x={10} y={10} width={220} height={200} camera={{ position: [0, 0, 4] }}>
          <primitive object={new Color('#1d3557')} attach="background" />
          <ambientLight3D intensity={0.4} />
          <directionalLight3D angle={[-35, 30, 0]} intensity={2} />
          <Counter position={[0, 0, 0]} size={1.2} />
        </View3D>
      </container2D>
      <Button />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(198, 170);
    await frames();
    await mouse.click(160, 130);
    await frames();
    await mouse.click(345, 150);
    await frames();
  },
};

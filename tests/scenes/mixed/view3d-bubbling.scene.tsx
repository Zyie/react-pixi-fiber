import type { TestScene } from '@test-scene';
import type { Container } from 'pixi.js';
import { useRef, useState } from 'react';
import { View3D } from 'react-pixi-fiber';
import type { ThreeEvent2D } from 'react-pixi-fiber';

const MESH = '#3cb44b';
const VIEW = '#4363d8';
const CARD = '#f58231';
const WRONG = '#e6194b';

/**
 * A card holding a `<View3D>` holding a box, each with an `onClick` that adds a chip of its colour to
 * the row under the card, in the order the handlers ran. The view's chip is red when its event's
 * `object` isn't the container its `ref` got.
 */
function Card({ x, stopOnCard }: { x: number; stopOnCard: boolean }) {
  const [chips, setChips] = useState<string[]>([]);
  const holder = useRef<Container>(null);
  const add = (color: string) => setChips((list) => [...list, color]);

  return (
    <container2D x={x}>
      <container2D
        y={20}
        onClick={(event: ThreeEvent2D<MouseEvent>) => {
          add(CARD);
          if (stopOnCard) event.stopPropagation();
        }}
      >
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 170, 200, 12).fill('#e0e0e0')} />
        <View3D
          ref={holder}
          x={10}
          y={10}
          width={150}
          height={150}
          camera={{ position: [0, 0, 3] }}
          onClick={(event: ThreeEvent2D<MouseEvent>) => add(event.object === holder.current ? VIEW : WRONG)}
        >
          <color attach="background" args={['#1d3557']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} />
          <mesh rotation={[0.4, 0.6, 0]} onClick={() => add(MESH)}>
            <boxGeometry />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
        </View3D>
      </container2D>
      {chips.map((color, index) => (
        <graphics2D key={index} x={index * 24} y={240} draw={(graphics) => graphics.rect(0, 0, 18, 18).fill(color)} />
      ))}
    </container2D>
  );
}

/**
 * Bubbling through a `<View3D>`: the box inside a view gets a click before the view, and the view before
 * the card around it, as a child before its parent. Each card's box is clicked once. Under the left
 * card the chips read green (the box), blue (the view, whose event's `object` is the container its ref
 * got), then orange twice: the card gets the click bubbled up from the view and then its own, from its
 * grey background. The right card stops the click in its handler, after the box and the view had it:
 * green, blue, orange.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Card x={20} stopOnCard={false} />
      <Card x={210} stopOnCard />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(105, 105);
    await frames();
    await mouse.click(295, 105);
    await frames();
  },
};

import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useState } from 'react';

const EVENT = { enter: '#bfef45', over: '#3cb44b', leave: '#f58231', drop: '#f032e6', missed: '#ffffff' };

type Kind = keyof typeof EVENT;

/** A square target that logs its drag and drop events as chips under it, in the order they came */
function Target({ x, color }: { x: number; color: string }) {
  const [log, setLog] = useState<Kind[]>([]);
  const add = (kind: Kind) => () => setLog((list) => [...list, kind]);

  return (
    <container2D x={x}>
      <sprite2D
        texture={Texture.WHITE}
        tint={color}
        y={40}
        width={140}
        height={140}
        onDragOverEnter={add('enter')}
        onDragOver={add('over')}
        onDragOverLeave={add('leave')}
        onDrop={add('drop')}
        onDropMissed={add('missed')}
      />
      {log.map((kind, index) => (
        <graphics2D
          key={index}
          x={index * 24}
          y={200}
          draw={(graphics) => graphics.rect(0, 0, 18, 18).fill(EVENT[kind])}
        />
      ))}
    </container2D>
  );
}

/**
 * r3f's drag and drop handlers on 2D elements: DragEvents dispatched on the canvas, as a file dragged in
 * from the desktop sends them. A drag over the blue square, then over the red one, a drop on the red
 * one, then a drop on empty space. Under the blue square the chips read drag-over-enter (lime),
 * drag-over (green) and drag-over-leave (orange); under the red one enter, over and the drop (magenta).
 * The drop on empty space ends both rows with a missed drop (white).
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Target x={40} color="#4363d8" />
      <Target x={220} color="#e6194b" />
    </>
  ),
  act: async ({ frames }, state) => {
    const canvas = state.events.connected!;
    const { left, top } = canvas.getBoundingClientRect();
    const drag = (type: string, x: number, y: number) =>
      canvas.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, clientX: left + x, clientY: top + y }),
      );

    drag('dragover', 110, 110);
    drag('dragover', 290, 110);
    drag('drop', 290, 110);
    drag('drop', 200, 270);
    await frames();
  },
};

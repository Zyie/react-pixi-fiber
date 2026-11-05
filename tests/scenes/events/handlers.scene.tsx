import type { TestScene } from '@test-scene';
import { useState } from 'react';

const HANDLERS = [
  'onPointerOver',
  'onPointerEnter',
  'onPointerMove',
  'onPointerDown',
  'onPointerUp',
  'onClick',
  'onContextMenu',
  'onWheel',
  'onPointerOut',
  'onPointerLeave',
  'onPointerMissed',
] as const;

type Handler = (typeof HANDLERS)[number];

const COLORS: Record<Handler, string> = {
  onPointerOver: '#e6194b',
  onPointerEnter: '#f58231',
  onPointerMove: '#ffe119',
  onPointerDown: '#bfef45',
  onPointerUp: '#3cb44b',
  onClick: '#42d4f4',
  onContextMenu: '#911eb4',
  onWheel: '#f032e6',
  onPointerOut: '#fabed4',
  onPointerLeave: '#dcbeff',
  onPointerMissed: '#ffffff',
};

/** A box with every handler, and a row of lamps below it, one per handler, that light up once it fires */
function Target() {
  const [fired, setFired] = useState<ReadonlySet<Handler>>(new Set());
  const handlers = Object.fromEntries(
    HANDLERS.map((name) => [name, () => setFired((previous) => new Set(previous).add(name))]),
  ) as Record<Handler, () => void>;

  return (
    <>
      <mesh position={[0, 0.6, 0]} {...handlers}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshBasicMaterial color="#3a3f4b" />
      </mesh>
      {HANDLERS.map((name, index) => (
        <mesh key={name} position={[(index - (HANDLERS.length - 1) / 2) * 0.5, -1.6, 0]}>
          <boxGeometry args={[0.36, 0.36, 0.36]} />
          <meshBasicMaterial color={fired.has(name) ? COLORS[name] : '#2a2a2a'} />
        </mesh>
      ))}
    </>
  );
}

/**
 * The pointer handlers r3f documents, driven by real input on one box: a move over it, a press and a
 * release, a right click, a wheel turn, a move off it, and a click on nothing. Each lamp below the box
 * lights up in its own colour once its handler has fired, left to right: over, enter, move, down, up,
 * click, context menu, wheel, out, leave, missed. `onDoubleClick` has a scene of its own,
 * `events/double-click`, since r3f's own build never fires it.
 */
export const scene: TestScene = {
  render: () => <Target />,
  act: async ({ mouse, frames }) => {
    await mouse.move(200, 111);
    await mouse.down();
    await mouse.up();
    await mouse.contextMenu(200, 111);
    await mouse.wheel(0, 40);
    await mouse.move(30, 30);
    await mouse.click(30, 30);
    await frames();
  },
};

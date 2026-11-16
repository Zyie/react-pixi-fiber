import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

/** The px an arrow key resizes by, and with Shift */
const STEP = 8;
const STEP_LARGE = 32;

/** Which way each arrow key resizes: across, then down */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** What a resize handle spreads on its element, and whether a pointer is dragging it */
export interface ResizeHandle {
  readonly dragging: boolean;
  readonly handlers: {
    onPointerDown(event: PointerEvent<HTMLElement>): void;
    onPointerMove(event: PointerEvent<HTMLElement>): void;
    onPointerUp(): void;
    onPointerCancel(): void;
    onKeyDown(event: KeyboardEvent<HTMLElement>): void;
  };
}

/**
 * A handle that resizes something: a pointer drags it, and the arrow keys move it by a step, a larger
 * one with Shift
 * @param start - Called as a drag starts, with what to measure the drag from
 * @param onDrag - Called as the pointer moves, with what `start` returned and how far the pointer is
 * from where the drag began, in px
 * @param onStep - Called with the px an arrow key asks for, across and down
 */
export function useResizeHandle<From>(
  start: () => From,
  onDrag: (from: From, dx: number, dy: number) => void,
  onStep: (dx: number, dy: number) => void,
): ResizeHandle {
  const drag = useRef<{ from: From; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const end = (): void => {
    drag.current = null;
    setDragging(false);
  };

  return {
    dragging,
    handlers: {
      onPointerDown(event) {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { from: start(), x: event.clientX, y: event.clientY };
        setDragging(true);
      },
      onPointerMove(event) {
        const { current } = drag;

        if (current) onDrag(current.from, event.clientX - current.x, event.clientY - current.y);
      },
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown(event) {
        const arrow = ARROWS[event.key];
        const step = event.shiftKey ? STEP_LARGE : STEP;

        if (!arrow) return;
        event.preventDefault();
        onStep(arrow[0] * step, arrow[1] * step);
      },
    },
  };
}

import { server } from 'vitest/browser';

import { markForCapture } from './capture';
import { createMouse } from './scene-input';
import type { MouseAction, PointerSource } from './scene-input';

/** The DOM event the page gets for each input */
const EVENTS: Record<MouseAction, string> = {
  move: 'pointermove',
  down: 'pointerdown',
  up: 'pointerup',
  wheel: 'wheel',
};

/** How many animation frames the page may take to handle an input Playwright has sent, before the test gives up on it */
const PATIENCE = 120;

/**
 * Watches the page for the next event of a type. The listener is on the window in the bubble phase, so
 * by the time it runs r3f's own listeners on the canvas have run.
 * @param type - The event type
 * @returns `handled`, which resolves once the page has handled the event and gives up `PATIENCE` frames
 * after it is called, naming the input that got lost; and `cancel`, which stops watching
 */
function watchEvent(type: string): { handled: () => Promise<void>; cancel: () => void } {
  let arrived = false;
  let onArrival = (): void => {};
  const listener = (): void => {
    arrived = true;
    onArrival();
  };
  const cancel = (): void => window.removeEventListener(type, listener);

  window.addEventListener(type, listener, { once: true });

  return {
    cancel,
    handled: () =>
      new Promise<void>((resolve, reject) => {
        let frames = 0;
        const wait = (): void => {
          if (arrived) return;

          if (++frames > PATIENCE) {
            cancel();
            reject(new Error(`The page never got a ${type} event. Is the scene's canvas on screen and uncovered?`));

            return;
          }

          requestAnimationFrame(wait);
        };

        onArrival = resolve;
        if (arrived) resolve();
        else requestAnimationFrame(wait);
      }),
  };
}

/**
 * A mouse that sends real input through Playwright. Each call resolves once the page has handled the
 * event, so a scene can advance a frame right after it.
 * @param canvas - The scene's canvas
 */
export const playwrightPointers: PointerSource = (canvas) => {
  const id = markForCapture(canvas);

  return createMouse(async (action, x, y, deltaX, deltaY) => {
    const event = watchEvent(EVENTS[action]);

    try {
      await server.commands.pointer(id, action, x, y, deltaX, deltaY);
    } catch (error) {
      event.cancel();
      throw error;
    }

    await event.handled();
  });
};

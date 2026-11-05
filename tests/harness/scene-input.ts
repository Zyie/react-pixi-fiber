import type { ReactNode } from 'react';

/** The mouse of a scene; positions are CSS px from the canvas's top-left corner */
export interface SceneMouse {
  /** Moves the mouse. A point off the canvas, such as `move(450, 150)`, takes it off the canvas, which then gets a `pointerleave`. */
  move: (x: number, y: number) => Promise<void>;
  /** Presses the left button where the mouse is */
  down: () => Promise<void>;
  /** Releases it. Released where it went down, the page also gets a `click`. */
  up: () => Promise<void>;
  /** Moves the mouse to a point and presses and releases the left button there, which clicks */
  click: (x: number, y: number) => Promise<void>;
  /** Turns the wheel where the mouse is, by CSS px, with the signs of a DOM `wheel` event */
  wheel: (deltaX: number, deltaY: number) => Promise<void>;
  /** Moves the mouse to a point and presses and releases the right button there, which opens the context menu */
  contextMenu: (x: number, y: number) => Promise<void>;
  /** Moves the mouse to a point and clicks twice there, which double-clicks */
  doubleClick: (x: number, y: number) => Promise<void>;
}

/** What a scene's `act` drives the scene with: input, the scene's own clock, and new props */
export interface SceneInput {
  mouse: SceneMouse;
  /**
   * Advances the root by frames, each `step` ms of the scene's clock after the one before: `useFrame`
   * callbacks run, then the root renders. The clock only moves here, so what a scene shows doesn't
   * depend on how fast the machine ran it.
   * @param count - How many frames; 1 when omitted
   * @param step - Milliseconds between frames; a sixtieth of a second when omitted
   */
  frames: (count?: number, step?: number) => Promise<void>;
  /**
   * Renders new JSX into the scene's root and resolves once React has committed it, as a second
   * `root.render()` of an app does. Nothing is drawn until the next frame.
   * @param children - What the root renders in place of the scene's `render()`
   */
  update: (children: ReactNode) => Promise<void>;
}

/**
 * What the mouse does. `contextmenu` presses and releases the right button, and `dblclick` clicks
 * twice, each where the mouse is.
 */
export type MouseAction = 'move' | 'down' | 'up' | 'wheel' | 'contextmenu' | 'dblclick';

/** Delivers one input to a scene's canvas; resolves once the page has handled it */
export type SendMouse = (
  action: MouseAction,
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
) => Promise<void> | void;

/** Makes the mouse of a scene's `act` for one canvas: real input in the tests, DOM events in the playground */
export type PointerSource = (canvas: HTMLCanvasElement) => SceneMouse;

/**
 * The mouse of a scene over a function that delivers each input. It keeps where the mouse is, so both
 * ways of delivering input behave the same.
 * @param send - Delivers one input
 */
export function createMouse(send: SendMouse): SceneMouse {
  let x = NaN;
  let y = NaN;
  const placed = (action: string): void => {
    if (Number.isNaN(x)) throw new Error(`mouse.${action}() before mouse.move(x, y): the mouse has no position`);
  };
  const mouse: SceneMouse = {
    async move(toX, toY) {
      x = toX;
      y = toY;
      await send('move', x, y, 0, 0);
    },
    async down() {
      placed('down');
      await send('down', x, y, 0, 0);
    },
    async up() {
      placed('up');
      await send('up', x, y, 0, 0);
    },
    async click(atX, atY) {
      await mouse.move(atX, atY);
      await mouse.down();
      await mouse.up();
    },
    async wheel(deltaX, deltaY) {
      placed('wheel');
      await send('wheel', x, y, deltaX, deltaY);
    },
    async contextMenu(atX, atY) {
      await mouse.move(atX, atY);
      await send('contextmenu', x, y, 0, 0);
    },
    async doubleClick(atX, atY) {
      await mouse.move(atX, atY);
      await send('dblclick', x, y, 0, 0);
    },
  };

  return mouse;
}

/**
 * Dispatches a DOM event at a point of a canvas, as the browser would
 * @param canvas - The canvas the point is on
 * @param type - The DOM event, such as `pointermove`, `click` or `wheel`; `wheel` is a WheelEvent,
 * `dblclick` a MouseEvent and the rest PointerEvents
 * @param x - CSS px from the left of the canvas
 * @param y - CSS px from the top of the canvas
 * @param init - The rest of the event: its buttons, or the deltas of a wheel
 */
export function dispatchPointer(
  canvas: HTMLCanvasElement,
  type: string,
  x: number,
  y: number,
  init: PointerEventInit & WheelEventInit = {},
): void {
  const { left, top } = canvas.getBoundingClientRect();
  const bubbles = type !== 'pointerleave';
  const event = { bubbles, cancelable: true, composed: true, clientX: left + x, clientY: top + y, ...init };
  // A `click` and a `contextmenu` are PointerEvents too, as Chrome sends them: r3f matches each to its
  // pointerdown by `pointerId`. Chrome's `dblclick` is a plain MouseEvent.
  canvas.dispatchEvent(
    type === 'wheel'
      ? new WheelEvent(type, event)
      : type === 'dblclick'
        ? new MouseEvent(type, event)
        : new PointerEvent(type, event),
  );
}

/**
 * A mouse that dispatches DOM events on the canvas. The playground drives a scene's `act` with it,
 * because a page can't reach Playwright; the tests use real input.
 *
 * A move off the canvas dispatches a `pointerleave`, and later moves reach the canvas only while the
 * left button is down, as they would for a drag that captured the pointer.
 * @param canvas - The scene's canvas
 */
export const syntheticPointers: PointerSource = (canvas) => {
  let pressed = false;
  let inside = false;
  const mouse = { pointerId: 1, pointerType: 'mouse', isPrimary: true };
  const press = (x: number, y: number, button: number, buttons: number, release: number): void => {
    dispatchPointer(canvas, 'pointerdown', x, y, { ...mouse, button, buttons });
    if (button === 2) dispatchPointer(canvas, 'contextmenu', x, y, { ...mouse, button, buttons });
    dispatchPointer(canvas, 'pointerup', x, y, { ...mouse, button, buttons: release });
  };

  return createMouse((action, x, y, deltaX, deltaY) => {
    if (action === 'wheel') {
      dispatchPointer(canvas, 'wheel', x, y, { deltaX, deltaY });

      return;
    }

    if (action === 'contextmenu') {
      press(x, y, 2, 2, 0);

      return;
    }

    if (action === 'dblclick') {
      for (let click = 1; click <= 2; click++) {
        press(x, y, 0, 1, 0);
        dispatchPointer(canvas, 'click', x, y, { ...mouse, button: 0, buttons: 0, detail: click });
      }
      dispatchPointer(canvas, 'dblclick', x, y, { button: 0, buttons: 0, detail: 2 });

      return;
    }

    const pointer = { ...mouse, button: action === 'move' ? -1 : 0 };
    const buttons = action === 'down' || (action === 'move' && pressed) ? 1 : 0;

    if (action === 'move') {
      const { width, height } = canvas.getBoundingClientRect();
      const over = x >= 0 && y >= 0 && x < width && y < height;

      if (inside && !over) dispatchPointer(canvas, 'pointerleave', x, y, { ...pointer, buttons });
      inside = over;
      if (!over && !pressed) return;
    }

    dispatchPointer(canvas, `pointer${action}`, x, y, { ...pointer, buttons });
    if (action === 'down') pressed = true;
    if (action === 'up') {
      // Chrome clicks when the press and the release land on the same element, however far apart.
      if (pressed && inside) dispatchPointer(canvas, 'click', x, y, { ...pointer, buttons: 0 });
      pressed = false;
    }
  });
};

let channel: MessageChannel | undefined;

/** Resolves in a later task, so promise callbacks and a React commit that a frame queued run before the next one */
export function nextTask(): Promise<void> {
  channel ??= new MessageChannel();

  const { port1, port2 } = channel;

  return new Promise((resolve) => {
    port1.onmessage = () => resolve();
    port2.postMessage(null);
  });
}

/** The clock of a scene: `performance.now()` stands still except when a frame moves it */
export interface SceneClock {
  /**
   * Moves the clock on
   * @param step - Milliseconds to move it by
   * @returns The new time, for the frame that moved it
   */
  tick: (step: number) => number;
  /** Gives the page its real clock back */
  restore: () => void;
}

/**
 * Takes over the page's clock for the life of a scene. `performance.now()` returns the scene's time,
 * which only `tick` moves, so time-based code (a shader's time uniform, a tween, React's scheduler)
 * lands on the same state on every run. Call `restore` when the scene is taken down.
 */
export function createSceneClock(): SceneClock {
  let time = performance.now();

  performance.now = () => time;

  return {
    tick(step) {
      time += step;

      return time;
    },
    restore() {
      Reflect.deleteProperty(performance, 'now');
    },
  };
}

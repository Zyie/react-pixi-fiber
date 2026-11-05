import { FederatedEvent } from 'pixi.js';
import { act } from 'react';
import type { ElementRef, RefObject } from 'react';
import { createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot } from 'react-pixi-fiber';
import { afterEach, beforeAll, expect, it } from 'vitest';

let root: ReconcilerRoot<HTMLCanvasElement> | undefined;
let canvas: HTMLCanvasElement | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  canvas?.remove();
});

// r3f's plain { type: 'added' } has a picture (tests/scenes/core/insert-before); pixi's own events on a 3D node don't.
it("dispatches pixi's federated events on a scene node as pixi does", async () => {
  const ref: RefObject<ElementRef<'mesh'> | null> = { current: null };

  canvas = document.body.appendChild(document.createElement('canvas'));
  root = createRoot(canvas);
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });
  const store = await act(async () => root!.render(<mesh ref={ref} />));
  const mesh = ref.current!;
  const event = new FederatedEvent(store.getState().renderer.pixi!.events.rootBoundary);
  let heard = 0;

  event.type = 'custom';
  mesh.eventMode = 'static';
  mesh.on('custom', () => heard++);

  expect(mesh.dispatchEvent(event)).toBe(true);
  expect(heard).toBe(1);
});

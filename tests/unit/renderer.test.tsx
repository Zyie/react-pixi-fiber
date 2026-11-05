import type { WebGLRenderer } from 'pixi.js';
import { act } from 'react';
import type { ReactNode } from 'react';
import { PerspectiveCamera, Scene, createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot, RootState } from 'react-pixi-fiber';
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

async function mount(element: ReactNode): Promise<RootState> {
  canvas = document.body.appendChild(document.createElement('canvas'));
  root = createRoot(canvas);
  await root.configure({
    frameloop: 'never',
    size: { width: 64, height: 64, top: 0, left: 0 },
    dpr: 1,
    renderer: { preference: 'webgl' },
  });

  const store = await act(async () => root!.render(element));

  return store.getState();
}

// Before the first frame nothing has been drawn, so only the matrices themselves can show they're ready.
it('works out the camera matrices and frustum before the first frame', async () => {
  const { camera, frustum } = await mount(null);

  expect(camera.matrixWorldInverse.elements[14]).toBeCloseTo(-5);
  expect(camera.projectionMatrix.elements[11]).toBe(-1);
  expect(frustum.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
});

// tests/scenes/core/second-scene draws two scenes; this is the bookkeeping behind it.
it('keeps one view per scene, draws a camera from outside it through a proxy, and releases the view', async () => {
  const state = await mount(<mesh />);
  const hud = new Scene();
  const hudCamera = new PerspectiveCamera(50, 1, 0.1, 100);

  hudCamera.position.set(0, 0, 3);
  state.advance(performance.now());
  state.renderer.render(hud, hudCamera);

  const main = state.renderer.getView(state.scene)!;
  const second = state.renderer.getView(hud)!;

  expect(second).not.toBe(main);
  expect(second.camera).not.toBe(hudCamera);
  expect(second.camera.position.z).toBeCloseTo(3);

  state.advance(performance.now() + 16);
  state.renderer.render(hud, hudCamera);
  expect(state.renderer.getView(state.scene)).toBe(main);
  expect(state.renderer.getView(hud)).toBe(second);

  state.renderer.releaseView(hud);
  expect(state.renderer.getView(hud)).toBeUndefined();
});

// The scenes draw over a black page, where a transparent clear and an opaque black one look the same.
it('clears to transparent, as three does with r3f', async () => {
  const state = await mount(
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="red" />
    </mesh>,
  );

  state.advance(performance.now());

  const { gl } = state.renderer.pixi as WebGLRenderer;
  const pixel = new Uint8Array(4);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(1, 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  expect([...pixel]).toEqual([0, 0, 0, 0]);
});

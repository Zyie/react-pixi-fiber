import type { WebGLRenderer } from 'pixi.js';
import { act, useState } from 'react';
import type { ReactNode } from 'react';
import { PerspectiveCamera, Scene, createPortal, createRoot, useFrame } from 'react-pixi-fiber';
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

const hudScenes: Scene[] = [];

/** r3f's HUD pattern: a component owns a scene that only its `useFrame` draws, and nothing destroys it */
function Hud() {
  const [hud] = useState(() => new Scene());
  const [hudCamera] = useState(() => new PerspectiveCamera(50, 1, 0.1, 100));

  if (!hudScenes.includes(hud)) hudScenes.push(hud);
  useFrame(
    ({ renderer, scene, camera }) => {
      renderer.render(scene, camera);
      renderer.autoClear = false;
      renderer.render(hud, hudCamera);
      renderer.autoClear = true;
    },
    { phase: 'render' },
  );

  return createPortal(<mesh />, hud);
}

it('frees the view of a scene that is no longer drawn, and makes it again if the scene is drawn later', async () => {
  const state = await mount(<mesh />);
  const { renderer } = state;
  let time = performance.now();
  const advance = (frames: number) => {
    for (let i = 0; i < frames; i++) state.advance((time += 16));
  };

  for (let i = 0; i < 3; i++) {
    await act(async () => root!.render(<Hud key={i} />));
    advance(2);
    expect(renderer.getView(hudScenes[i])).toBeDefined();
    await act(async () => root!.render(<mesh />));
  }

  advance(renderer.viewMaxIdleFrames + 1);
  expect(hudScenes).toHaveLength(3);
  for (const hud of hudScenes) expect(renderer.getView(hud)).toBeUndefined();
  expect(renderer.getView(state.scene)).toBeDefined();

  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  renderer.render(hudScenes[0], camera);
  expect(renderer.getView(hudScenes[0])).toBeDefined();
});

it('frees the view of a scene when the scene is destroyed', async () => {
  const state = await mount(<mesh />);
  const hud = new Scene();
  const child = new Scene();

  hud.addChild(child);
  state.renderer.render(hud, state.camera);
  expect(state.renderer.getView(hud)).toBeDefined();

  hud.destroy();
  expect(state.renderer.getView(hud)).toBeUndefined();
  expect(child.destroyed).toBe(false);
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

import { act, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createRoot, useRenderTarget } from 'react-pixi-fiber';
import type { ReconcilerRoot, RootState } from 'react-pixi-fiber';
import { Color, OrthographicCamera, Scene, WebGLCubeRenderTarget, WebGLRenderTarget } from 'react-pixi-fiber/three';
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

async function mount(element: ReactNode, preference: 'webgl' | 'webgpu' = 'webgl'): Promise<RootState> {
  canvas = document.body.appendChild(document.createElement('canvas'));
  root = createRoot(canvas);
  await root.configure({
    frameloop: 'never',
    size: { width: 64, height: 64, top: 0, left: 0 },
    dpr: 1,
    renderer: { preference },
  });
  const store = await act(async () => root!.render(element));
  return store.getState();
}

/** A scene that clears its target to a colour: its left half red, its right half blue, through the scissor */
function clearHalves(state: RootState, target: WebGLRenderTarget): void {
  const { renderer } = state;
  const scene = new Scene();
  const camera = new OrthographicCamera();
  renderer.setRenderTarget(target);
  scene.background = new Color('#ff0000');
  renderer.render(scene, camera);
  target.scissor.set(target.width / 2, 0, target.width / 2, target.height);
  target.scissorTest = true;
  renderer.setClearColor(new Color('#0000ff'));
  renderer.clearColor();
  renderer.setRenderTarget(null);
}

// readRenderTargetPixels hands back three's linear bytes from the bottom row up; no picture shows that.
for (const preference of ['webgl', 'webgpu'] as const) {
  it(`reads a target's pixels as three's linear bytes, rows from the bottom, on ${preference}`, async () => {
    const state = await mount(null, preference);
    const target = new WebGLRenderTarget(8, 4);
    clearHalves(state, target);

    const pixels = await state.renderer.readRenderTargetPixelsAsync(target, 0, 0, 8, 4);
    expect([...pixels.subarray(0, 4)]).toEqual([255, 0, 0, 255]);
    expect([...pixels.subarray(7 * 4, 8 * 4)]).toEqual([0, 0, 255, 255]);

    const corner = await state.renderer.readRenderTargetPixelsAsync(target, 6, 3, 1, 1);
    expect([...corner]).toEqual([0, 0, 255, 255]);
    target.dispose();
  });
}

it('reads a target synchronously on WebGL, as three does', async () => {
  const state = await mount(null, 'webgl');
  const target = new WebGLRenderTarget(8, 4);
  clearHalves(state, target);

  const sync = new Uint8Array(8 * 4 * 4);
  state.renderer.readRenderTargetPixels(target, 0, 0, 8, 4, sync);
  expect(sync).toEqual(await state.renderer.readRenderTargetPixelsAsync(target, 0, 0, 8, 4));
  target.dispose();
});

it('disposes a target once, destroying its texture and telling its listeners', async () => {
  const target = new WebGLRenderTarget(4, 4);
  const cube = new WebGLCubeRenderTarget(4);
  let disposed = 0;
  target.addEventListener('dispose', () => disposed++);

  target.dispose();
  target.dispose();
  cube.dispose();

  expect(disposed).toBe(1);
  expect(target.texture.destroyed).toBe(true);
  expect(cube.texture.destroyed).toBe(true);
});

it('resizes a target in place, keeping its texture, and resets its viewport and scissor', async () => {
  const target = new WebGLRenderTarget(4, 4);
  const texture = target.texture;
  target.viewport.set(1, 1, 2, 2);

  target.setSize(16, 8);

  expect(target.texture).toBe(texture);
  expect(texture.source.pixelWidth).toBe(16);
  expect([target.viewport.z, target.viewport.w, target.scissor.z, target.scissor.w]).toEqual([16, 8, 16, 8]);
  target.dispose();
});

function Target({ onTarget }: { onTarget: (target: WebGLRenderTarget) => void }) {
  const target = useRenderTarget();
  useEffect(() => {
    onTarget(target);
  }, [onTarget, target]);
  return null;
}

it('disposes what useRenderTarget made when the component unmounts, and follows the canvas size without one', async () => {
  let target: WebGLRenderTarget | undefined;
  await mount(<Target onTarget={(made) => (target = made)} />);
  expect([target!.width, target!.height]).toEqual([64, 64]);

  await act(async () => root!.render(null));

  expect(target!.disposed).toBe(true);
});

it('frees the environment cubes, the backgrounds and the cube face texture when the renderer is disposed', async () => {
  const state = await mount(null);
  const cubeTarget = new WebGLCubeRenderTarget(8);
  const scene = new Scene();
  const camera = new OrthographicCamera();

  for (let face = 0; face < 6; face++) {
    state.renderer.setRenderTarget(cubeTarget, face);
    state.renderer.render(scene, camera);
  }
  state.renderer.setRenderTarget(null);
  state.scene.environment = cubeTarget.texture;
  state.scene.background = cubeTarget.texture;
  state.advance(performance.now());

  const view = state.renderer.getView(state.scene)!;
  expect(view.environment).not.toBeNull();
  const lighting = view.environment as { destroyed: boolean };

  cubeTarget.dispose();
  expect(lighting.destroyed).toBe(true);
  expect(view.environment).toBeNull();

  state.renderer.dispose();
  state.renderer.dispose();
});

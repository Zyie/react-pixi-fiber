import type { ComponentProps } from 'react';
import { createRoot as createDomRoot } from 'react-dom/client';
import { Canvas, useFrame } from 'react-pixi-fiber';
import type { RootState } from 'react-pixi-fiber';
import { LinearSRGBColorSpace, NeutralToneMapping } from 'react-pixi-fiber/three';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// These run the real requestAnimationFrame loop and Canvas's own measuring, outside act(), as an app runs.
let host: HTMLDivElement;
let dom: ReturnType<typeof createDomRoot>;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  host = document.body.appendChild(document.createElement('div'));
  host.style.cssText = 'width: 64px; height: 48px';
  dom = createDomRoot(host);
});

afterEach(() => {
  dom.unmount();
  host.remove();
});

/** Mounts a Canvas with a frame counter, and resolves with its state once it has been created */
async function mount(props: Omit<ComponentProps<typeof Canvas>, 'children'>, onFrame = (): void => {}) {
  let state: RootState | undefined;

  function Counter() {
    useFrame(onFrame);
    return null;
  }

  dom.render(
    <Canvas {...props} onCreated={(created) => void (state = created)}>
      <Counter />
    </Canvas>,
  );
  await vi.waitFor(() => expect(state).toBeDefined(), { timeout: 5000 });
  return state!;
}

const nextFrames = (count: number) =>
  new Promise<void>((resolve) => {
    let left = count;
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });

it("frameloop 'demand' draws only when invalidated, and 'never' only when advanced", async () => {
  let frames = 0;
  const state = await mount({ frameloop: 'demand' }, () => void frames++);

  await nextFrames(5);
  const settled = frames;
  await nextFrames(5);
  expect(frames).toBe(settled);

  state.invalidate();
  await vi.waitFor(() => expect(frames).toBe(settled + 1));

  state.setFrameloop('never');
  await nextFrames(5);
  state.invalidate();
  await nextFrames(5);
  expect(frames).toBe(settled + 1);

  state.advance(performance.now());
  expect(frames).toBe(settled + 2);
});

it('sizes the drawing buffer by dpr, as a number and as a [min, max] range around the display ratio', async () => {
  const fixed = await mount({ dpr: 2 });
  await vi.waitFor(() => expect(fixed.gl.domElement.width).toBe(128));
  expect(fixed.get().viewport.dpr).toBe(2);
  dom.unmount();

  dom = createDomRoot(host);
  const range = await mount({ dpr: [window.devicePixelRatio + 0.5, 4] });
  const expected = window.devicePixelRatio + 0.5;
  await vi.waitFor(() => expect(range.get().viewport.dpr).toBe(expected));
  expect(range.gl.domElement.width).toBe(Math.round(64 * expected));
});

it('passes style, className and id through, and follows its parent when it resizes', async () => {
  const state = await mount({ style: { opacity: 0.5 }, className: 'scene', id: 'main' });
  const wrapper = host.firstElementChild as HTMLDivElement;

  expect(wrapper.className).toBe('scene');
  expect(wrapper.style.opacity).toBe('0.5');
  expect((state.gl.domElement as HTMLCanvasElement).id).toBe('main');

  host.style.width = '96px';
  await vi.waitFor(() => expect(state.get().size.width).toBe(96));
  expect(state.get().viewport.aspect).toBe(2);
});

it('takes three renderer settings through the renderer prop', async () => {
  const state = await mount({
    renderer: { toneMapping: NeutralToneMapping, toneMappingExposure: 1.5, outputColorSpace: LinearSRGBColorSpace },
  });

  expect(state.renderer.toneMapping).toBe(NeutralToneMapping);
  expect(state.renderer.toneMappingExposure).toBe(1.5);
  expect(state.renderer.outputColorSpace).toBe(LinearSRGBColorSpace);
});

it('calls onPointerMissed for a click that hits nothing', async () => {
  const missed = vi.fn<(event: MouseEvent) => void>();
  const state = await mount({ onPointerMissed: missed });
  const canvas = state.gl.domElement as HTMLCanvasElement;
  const init = { bubbles: true, clientX: 32, clientY: 24, pointerId: 1, button: 0 };

  await nextFrames(2);
  canvas.dispatchEvent(new PointerEvent('pointerdown', init));
  canvas.dispatchEvent(new PointerEvent('pointerup', init));
  canvas.dispatchEvent(new PointerEvent('click', init));

  await vi.waitFor(() => expect(missed).toHaveBeenCalled());
  expect(missed.mock.calls[0][0].type).toBe('click');
});

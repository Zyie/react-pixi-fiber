import { GraphicsContext, Texture } from 'pixi.js';
import type { BlurFilter, Graphics, Sprite } from 'pixi.js';
import { act } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot, RootState } from 'react-pixi-fiber';
import { afterEach, beforeAll, expect, it } from 'vitest';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

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
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });

  const store = await act(async () => root!.render(element));

  return store.getState();
}

// A picture can't show that an object was destroyed, nor that one passed in was left alone.
it('destroys 2D elements, their children and attached filters and contexts on unmount, but not what was passed in', async () => {
  const texture = Texture.from(document.createElement('canvas'));
  const shared = new GraphicsContext().rect(0, 0, 4, 4).fill(0xffffff);
  const sprite: RefObject<Sprite | null> = { current: null };
  const sharedGraphics: RefObject<Graphics | null> = { current: null };
  const ownGraphics: RefObject<Graphics | null> = { current: null };
  const blur: RefObject<BlurFilter | null> = { current: null };
  const context: RefObject<GraphicsContext | null> = { current: null };
  const state = await mount(
    <container2D>
      <sprite2D ref={sprite} texture={texture}>
        <blurFilter2D ref={blur} attach="filters-0" />
      </sprite2D>
      <graphics2D ref={sharedGraphics} args={[shared]} />
      <graphics2D ref={ownGraphics}>
        <graphicsContext2D ref={context} attach="context" />
      </graphics2D>
    </container2D>,
  );
  const objects = [sprite.current!.parent!, sprite.current!, sharedGraphics.current!, ownGraphics.current!];
  const [container] = objects;
  const own = ownGraphics.current!;
  const attached = context.current!;

  expect(container.parent).toBe(state.screen);
  expect(sprite.current!.filters).toEqual([blur.current]);
  expect(own.context).toBe(context.current);

  await act(async () => root!.render(null));
  expect(state.screen.children).not.toContain(container);
  for (const object of objects) expect(object.destroyed).toBe(true);
  expect(attached.destroyed).toBe(true);
  expect(texture.destroyed).toBe(false);
  expect(shared.destroyed).toBe(false);
});

// The view a scene draws with isn't on the picture.
it('draws a scene of 2D alone without a 3D view, and makes one once 3D joins it', async () => {
  const state = await mount(<sprite2D texture={Texture.WHITE} />);
  await act(async () => state.advance(0));
  expect(state.renderer.getView(state.scene)).toBeUndefined();

  await act(async () =>
    root!.render(
      <>
        <sprite2D texture={Texture.WHITE} />
        <mesh>
          <boxGeometry />
        </mesh>
      </>,
    ),
  );
  await act(async () => state.advance(16));
  const view = state.renderer.getView(state.scene)!;
  expect(view).toBeDefined();
  expect(view.parent!.parent === state.screen).toBe(true);
});

// Identity isn't on the picture either.
it('keeps a 2D object across renders, and builds a new one when its args change', async () => {
  const ref: RefObject<Graphics | null> = { current: null };
  const first = new GraphicsContext();
  const second = new GraphicsContext();
  await mount(<graphics2D ref={ref} args={[first]} x={1} />);
  const graphics = ref.current!;

  await act(async () => root!.render(<graphics2D ref={ref} args={[first]} x={5} />));
  expect(ref.current).toBe(graphics);
  expect(graphics.x).toBe(5);

  await act(async () => root!.render(<graphics2D ref={ref} args={[second]} x={5} />));
  expect(ref.current).not.toBe(graphics);
  expect(ref.current!.context).toBe(second);
  expect(graphics.destroyed).toBe(true);
});

// The screen layer is no picture of its own.
it('gives each root a screen layer and frees it when the root unmounts', async () => {
  const state = await mount(null);
  const { screen } = state;
  expect(screen.destroyed).toBe(false);

  await act(async () => root!.unmount());
  root = undefined;
  expect(screen.destroyed).toBe(true);
});

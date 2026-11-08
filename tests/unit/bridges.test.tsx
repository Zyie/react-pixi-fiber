import type { View3D as PixiView3D } from '@pixi/3d';
import { Texture } from 'pixi.js';
import type { Container, Sprite } from 'pixi.js';
import { act } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Anchor2D, RenderTexture2D, View3D, createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot, RenderTexture2DHandle, RootState } from 'react-pixi-fiber';
import type { Mesh } from 'react-pixi-fiber/three';
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

/** The pixi-3d view a `<View3D>` holds, under the container its ref receives */
const viewIn = (holder: Container): PixiView3D => {
  let found: PixiView3D | undefined;
  const walk = (node: Container): void => {
    for (const child of node.children) {
      if ((child as { renderPipeId?: string }).renderPipeId === 'view3d') found = child as PixiView3D;
      else walk(child);
    }
  };
  walk(holder);
  return found!;
};

// A freed view, and the scene objects a portal leaves behind, aren't on the picture.
it('frees the view of a <View3D> and its scene on unmount, and destroys the 3D in it', async () => {
  const holder: RefObject<Container | null> = { current: null };
  const mesh: RefObject<Mesh | null> = { current: null };
  const state = await mount(
    <View3D ref={holder} width={32} height={32}>
      <mesh ref={mesh}>
        <boxGeometry />
      </mesh>
    </View3D>,
  );
  await act(async () => state.advance(16));
  const view = viewIn(holder.current!);
  const scene = mesh.current!.parent!;
  expect(view.root).toBe(scene);

  await act(async () => root!.render(null));
  expect(view.destroyed).toBe(true);
  expect(scene.destroyed).toBe(true);
  expect(mesh.current).toBeNull();
  expect(holder.current).toBeNull();
});

// Whether a render target was disposed doesn't show in a picture.
it('disposes the render target of a <RenderTexture2D> and its scene on unmount', async () => {
  const handle: RefObject<RenderTexture2DHandle | null> = { current: null };
  const state = await mount(
    <mesh>
      <planeGeometry />
      <meshBasicMaterial>
        <RenderTexture2D ref={handle} width={16} height={16}>
          <sprite2D texture={Texture.WHITE} />
        </RenderTexture2D>
      </meshBasicMaterial>
    </mesh>,
  );
  await act(async () => state.advance(16));
  const { target, texture } = handle.current!;
  expect(target.disposed).toBe(false);

  await act(async () => root!.render(null));
  expect(target.disposed).toBe(true);
  expect(texture.destroyed).toBe(true);
});

// An anchor that is gone draws nothing, so a picture can't tell it was freed rather than hidden.
it('destroys an <anchor2D> and the anchor a bare 2D element in a 3D object gets, and takes them off the 3D layer', async () => {
  const anchor: RefObject<Anchor2D | null> = { current: null };
  const sprite: RefObject<Sprite | null> = { current: null };
  const state = await mount(
    <mesh>
      <boxGeometry />
      <anchor2D ref={anchor} />
      <sprite2D ref={sprite} texture={Texture.WHITE} />
    </mesh>,
  );
  await act(async () => state.advance(16));
  const own = sprite.current!.parent as Anchor2D;
  const layer = anchor.current!.parent!;
  expect(own).toBeInstanceOf(Anchor2D);
  expect(own.parent).toBe(layer);
  expect(layer.parent).toBe(state.screen);
  const placed = [anchor.current!, own];

  await act(async () => root!.render(null));
  for (const object of placed) {
    expect(object.destroyed).toBe(true);
    expect(layer.children).not.toContain(object);
  }
});

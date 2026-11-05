import { act } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot, RootState } from 'react-pixi-fiber';
import { ArrowHelper, BoxGeometry, BufferAttribute, BufferGeometry, GridHelper, Sprite } from 'react-pixi-fiber/three';
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
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });
  const store = await act(async () => root!.render(element));
  return store.getState();
}

const destroyed = (geometry: unknown): boolean => (geometry as { _destroyed: boolean })._destroyed;

// A picture can't show that a geometry's GPU buffers, or the parts a helper made, were released.
it('frees a buffer geometry with the buffers it made, and lets go of its attributes', () => {
  const position = new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3);
  const geometry = new BufferGeometry().setAttribute('position', position);
  const buffers = [...geometry.buffers];

  geometry.dispose();
  geometry.dispose();

  expect(destroyed(geometry)).toBe(true);
  expect(buffers.every((buffer) => buffer.destroyed)).toBe(true);
  expect(position._owners.size).toBe(0);
});

it('destroys the geometry and material a helper made, and an arrow its shaft and head', () => {
  const grid = new GridHelper();
  const { geometry, material } = grid;
  grid.destroy();
  expect(destroyed(geometry)).toBe(true);
  expect(material.destroyed).toBe(true);

  const arrow = new ArrowHelper();
  const parts = [arrow.line, arrow.cone].map(({ geometry: g, material: m }) => [g, m] as const);
  arrow.destroy();
  for (const [g, m] of parts) {
    expect(destroyed(g)).toBe(true);
    expect(m.destroyed).toBe(true);
  }
});

it('frees a sprite with its own quad', () => {
  const sprite = new Sprite();
  const quad = sprite.geometry;
  sprite.destroy();
  expect(destroyed(quad)).toBe(true);
});

it('disposes points, a line and their geometry and material when they unmount', async () => {
  const box = new BoxGeometry();
  const state = await mount(
    <>
      <points>
        <sphereGeometry />
        <pointsMaterial />
      </points>
      <lineSegments>
        <edgesGeometry args={[box]} />
        <lineBasicMaterial />
      </lineSegments>
    </>,
  );
  const [points, lines] = state.scene.children.filter((child) => 'isPoints' in child || 'isLineSegments' in child);
  const owned = [points, lines].map((object) => {
    const { geometry, material } = object as unknown as { geometry: unknown; material: { destroyed: boolean } };
    return { geometry, material };
  });

  await act(async () => root!.render(null));

  for (const { geometry, material } of owned) {
    expect(destroyed(geometry)).toBe(true);
    expect(material.destroyed).toBe(true);
  }
  box.dispose();
});

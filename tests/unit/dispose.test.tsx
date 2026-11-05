import type { Mesh3D } from '@pixi/3d';
import { act } from 'react';
import type { ReactNode } from 'react';
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

// A picture can't tell a mesh updated in place from one rebuilt, nor show that GPU resources were released.
it('updates a mesh in place on re-render, and disposes it with its geometry and material on unmount', async () => {
  const ref: { current: Mesh3D | null } = { current: null };
  const box = (x: number) => (
    <mesh ref={ref as never} position={[x, 0, 0]}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  );
  const state = await mount(box(1));
  const mesh = ref.current!;
  const geometry = mesh.geometry as unknown as { _destroyed: boolean };
  const material = mesh.material;

  await act(async () => root!.render(box(5)));
  expect(ref.current).toBe(mesh);
  expect(mesh.position.x).toBe(5);

  await act(async () => root!.render(null));
  expect(state.scene.children).not.toContain(mesh);
  expect(mesh.destroyed).toBe(true);
  expect(geometry._destroyed).toBe(true);
  expect(material.destroyed).toBe(true);
});

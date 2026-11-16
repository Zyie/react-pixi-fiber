import { Camera3D, Container3D, Geometry3D } from '@pixi/3d';
import type { Mesh3D, PhongMaterial } from '@pixi/3d';
import { RootPerspectiveCamera, RootRaycaster, RootScene, createRoot } from '@react-fiber/core';
import type { ReconcilerRoot, RootState } from '@react-fiber/core';
import { act } from 'react';
import type { ReactNode, RefObject } from 'react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import '@react-fiber/3d';

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

// What a root is made of without threejs-compat isn't in a picture: its classes, and that nothing
// three-shaped was installed on @pixi/3d's.
it("gives a root @pixi/3d's own scene, camera and raycaster, and installs nothing of three's", async () => {
  const state = await mount(null);

  expect(state.scene).toBeInstanceOf(RootScene);
  expect(state.camera).toBeInstanceOf(RootPerspectiveCamera);
  expect(state.camera).toBeInstanceOf(Camera3D);
  expect(state.camera.parent).toBe(state.scene);
  expect(state.raycaster).toBeInstanceOf(RootRaycaster);
  for (const member of ['isObject3D', 'uuid', 'traverseAncestors', 'add', 'dispose']) {
    expect(member in Container3D.prototype, member).toBe(false);
  }
  expect('isBufferGeometry' in Geometry3D.prototype).toBe(false);
});

// A picture can't tell a mesh updated in place from one rebuilt, nor show that GPU resources were released.
it('updates a mesh in place on re-render, and destroys it with its geometry and material on unmount', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  const material: RefObject<PhongMaterial | null> = { current: null };
  const sphere = (x: number) => (
    <mesh3D ref={ref} position={[x, 0, 0]}>
      <sphereGeometry3D />
      <phongMaterial3D ref={material} />
    </mesh3D>
  );
  const state = await mount(sphere(1));
  const mesh = ref.current!;
  const geometry = mesh.geometry as unknown as { _destroyed: boolean };
  const phong = material.current!;

  expect(mesh.material).toBe(phong);
  await act(async () => root!.render(sphere(5)));
  expect(ref.current).toBe(mesh);
  expect(mesh.position.x).toBe(5);

  await act(async () => root!.render(null));
  expect(state.scene.children).not.toContain(mesh);
  expect(mesh.destroyed).toBe(true);
  expect(geometry._destroyed).toBe(true);
  expect(phong.destroyed).toBe(true);
});

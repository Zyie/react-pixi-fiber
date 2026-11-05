import { act } from 'react';
import type { ElementRef, ReactNode, RefObject } from 'react';
import { createRoot } from 'react-pixi-fiber';
import type { ReconcilerRoot } from 'react-pixi-fiber';
import { Color, MeshBasicMaterial } from 'react-pixi-fiber/three';
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

async function mount(element: ReactNode): Promise<void> {
  canvas = document.body.appendChild(document.createElement('canvas'));
  root = createRoot(canvas);
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });
  await act(async () => root!.render(element));
}

type Instanced = ElementRef<'instancedMesh'>;

/** The material an instanced mesh's slots draw with, the instance colour copy once it has colours */
const drawnWith = (mesh: Instanced) => mesh.items[0].material;

// No picture shows a material copy freed or a material's own methods given back.
it('frees the instance colour copy of a shared material with the last mesh that drew with it', async () => {
  const material = new MeshBasicMaterial({ color: 'orange' });
  const first: RefObject<Instanced | null> = { current: null };
  const second: RefObject<Instanced | null> = { current: null };
  const meshes = (both: boolean) => (
    <>
      <instancedMesh ref={first} args={[undefined, material, 2]} />
      {both && <instancedMesh ref={second} args={[undefined, material, 2]} />}
    </>
  );

  await mount(meshes(true));
  first.current!.setColorAt(0, new Color('red'));
  second.current!.setColorAt(1, new Color('blue'));

  const copy = drawnWith(first.current!);
  const secondMesh = second.current!;

  expect(copy).not.toBe(material);
  expect(drawnWith(secondMesh)).toBe(copy);
  expect(Object.hasOwn(material, 'update')).toBe(true);

  material.color.set('green');
  expect([...copy.data.baseColor!]).toEqual([...material.data.baseColor!]);

  await act(async () => root!.render(meshes(false)));
  expect(secondMesh.destroyed).toBe(true);
  expect(copy.destroyed).toBe(false);

  await act(async () => root!.render(null));
  expect(copy.destroyed).toBe(true);
  expect(Object.hasOwn(material, 'update')).toBe(false);
  expect(Object.hasOwn(material, '_setTextureSlot')).toBe(false);
  expect(material.destroyed).toBe(false);
  material.destroy();
});

it('disposes an instanced mesh and its child geometry and material on unmount', async () => {
  const ref: RefObject<Instanced | null> = { current: null };

  await mount(
    <instancedMesh ref={ref} args={[undefined, undefined, 3]}>
      <boxGeometry />
      <meshStandardMaterial />
    </instancedMesh>,
  );

  const mesh = ref.current!;
  const geometry = mesh.geometry as unknown as { _destroyed: boolean };
  const material = mesh.material;

  mesh.setColorAt(2, new Color('hotpink'));
  const copy = drawnWith(mesh);

  await act(async () => root!.render(null));
  expect(mesh.destroyed).toBe(true);
  expect(copy.destroyed).toBe(true);
  expect(geometry._destroyed).toBe(true);
  expect(material.destroyed).toBe(true);
});

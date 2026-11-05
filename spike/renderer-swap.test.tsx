import { AmbientLight, CubeGeometry, FlatMaterial, Material3D, Mesh3D, type Container3D } from '@pixi/3d';
import type { WebGLRenderer } from 'pixi.js';
import { Suspense, act, useRef, type RefObject } from 'react';
import { createRoot as createDomRoot } from 'react-dom/client';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';

import {
  Canvas,
  createRoot,
  events,
  useFrame,
  useLoader,
  type ReconcilerRoot,
  type RenderProps,
  type RootState,
} from './index';
import type { Pixi3DRenderer } from './support/pixi3d';
import { TextureLoader } from './support/three-compat';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

let root: ReconcilerRoot<HTMLCanvasElement> | undefined;
let canvas: HTMLCanvasElement;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  canvas?.remove();
});

async function mount(element: React.ReactNode, props: RenderProps<HTMLCanvasElement> = {}) {
  canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  root = createRoot(canvas);
  let state!: RootState;
  await root.configure({
    frameloop: 'never',
    size: { width: 64, height: 64, top: 0, left: 0 },
    dpr: 1,
    onCreated: (s) => void (state = s),
    ...props,
  });
  await act(async () => root!.render(element));
  return state ?? undefined;
}

const meshesIn = (node: Container3D): Mesh3D[] =>
  node.children.flatMap((child) => (child instanceof Mesh3D ? [child, ...meshesIn(child)] : meshesIn(child)));

it('mounts a pixi-3d Mesh3D (CubeGeometry + Material3D) into the scene with props applied', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  const state = await mount(
    <mesh3D ref={ref} position={[1, 2, 3]} rotation={[0, Math.PI / 2, 0]}>
      <cubeGeometry />
      <material3D />
    </mesh3D>,
  );

  const mesh = ref.current!;
  expect(mesh).toBeInstanceOf(Mesh3D);
  expect(state.scene.children).toContain(mesh);
  expect(mesh.geometry).toBeInstanceOf(CubeGeometry);
  expect(mesh.material).toBeInstanceOf(Material3D);
  expect(mesh.position.toArray()).toEqual([1, 2, 3]);
  expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2);

  state.advance(performance.now());
  const renderer = state.renderer as unknown as Pixi3DRenderer;
  expect(renderer.view?.root).toBe(state.scene);
  expect(meshesIn(renderer.view!.root)).toContain(mesh);
});

it('useFrame rotates the mesh across advance() steps', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  function Spinner() {
    const mesh = useRef<Mesh3D>(null);
    useFrame((_, delta) => {
      mesh.current!.rotation.y += delta;
      ref.current = mesh.current;
    });
    return (
      <mesh3D ref={mesh}>
        <cubeGeometry />
        <material3D />
      </mesh3D>
    );
  }
  const state = await mount(<Spinner />);

  const start = performance.now();
  state.advance(start);
  const first = ref.current!.rotation.y;
  state.advance(start + 500);
  state.advance(start + 1000);
  expect(ref.current!.rotation.y).toBeGreaterThan(first + 0.5);
});

it('updates the Mesh3D on re-render and destroys it on unmount', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  const scene = (x: number) => (
    <mesh3D ref={ref} position={[x, 0, 0]} visible>
      <cubeGeometry />
      <material3D />
    </mesh3D>
  );
  const state = await mount(scene(1));
  const mesh = ref.current!;
  const geometry = mesh.geometry as unknown as { _destroyed: boolean };
  const material = mesh.material;

  await act(async () => root!.render(scene(5)));
  expect(ref.current).toBe(mesh);
  expect(mesh.position.x).toBe(5);

  await act(async () => root!.render(null));
  expect(state.scene.children).not.toContain(mesh);
  expect(mesh.destroyed).toBe(true);
  expect(geometry._destroyed).toBe(true);
  expect(material.destroyed).toBe(true);
});

function pointer(type: string, x: number, y: number) {
  const rect = canvas.getBoundingClientRect();
  const init = { clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, bubbles: true, isPrimary: true };
  canvas.dispatchEvent(new PointerEvent(type, init));
}

it('routes onClick / onPointerOver to a Mesh3D through the pixi-3d raycaster', async () => {
  const hits: string[] = [];
  const state = await mount(
    <mesh3D onClick={() => hits.push('click')} onPointerOver={() => hits.push('over')}>
      <cubeGeometry />
      <material3D />
    </mesh3D>,
    { events },
  );
  state.advance(performance.now());

  await act(async () => {
    pointer('pointermove', 2, 2);
    pointer('pointerdown', 2, 2);
    pointer('click', 2, 2);
  });
  expect(hits).toEqual([]);

  await act(async () => {
    pointer('pointermove', 32, 32);
    pointer('pointerdown', 32, 32);
    pointer('pointerup', 32, 32);
    pointer('click', 32, 32);
  });
  expect(hits).toEqual(['over', 'click']);
});

it('renders three.js element names through the alias catalog', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  const state = await mount(
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} />
      <mesh ref={ref} position={[0, 1, 0]} scale={2}>
        <boxGeometry args={[1, 2, 3]} />
        <meshStandardMaterial color="hotpink" roughness={0.25} metalness={0.5} />
      </mesh>
    </>,
  );
  state.advance(performance.now());

  const mesh = ref.current!;
  expect(mesh).toBeInstanceOf(Mesh3D);
  expect(mesh.scale.toArray()).toEqual([2, 2, 2]);
  expect(mesh.geometry).toBeInstanceOf(CubeGeometry);
  expect(mesh.geometry.bounds3D.max.y).toBeCloseTo(1);
  const material = mesh.material as Material3D;
  expect(material.baseColor).toBe(0xff69b4);
  expect(material.roughness).toBe(0.25);
  expect(material.metallic).toBe(0.5);
  expect(state.camera.position.z).toBe(5);
  expect(state.scene.children.some((c) => c instanceof AmbientLight)).toBe(true);
});

it('attaches a mesh inserted before an existing sibling to the View3D', async () => {
  const a: RefObject<Mesh3D | null> = { current: null };
  const list = (showA: boolean) => (
    <>
      {showA && <mesh ref={a} key="a" />}
      <mesh key="b" />
    </>
  );
  const state = await mount(list(false));
  state.advance(performance.now());

  await act(async () => root!.render(list(true)));
  state.advance(performance.now());

  expect(state.scene.children.indexOf(a.current!)).toBe(state.scene.children.length - 2);
  expect(a.current!.view3d).not.toBeNull();
});

it('draws the mesh: the centre pixel takes the material colour', async () => {
  const state = await mount(
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="red" />
    </mesh>,
  );
  state.advance(performance.now());

  const { gl } = (state.renderer as unknown as Pixi3DRenderer).pixi as WebGLRenderer;
  const read = (x: number, y: number) => {
    const pixel = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return [...pixel];
  };
  const [r, g, b] = read(32, 32);
  expect(r).toBeGreaterThan(200);
  expect(g + b).toBeLessThan(60);
  expect(read(1, 1)[0]).toBeLessThan(60);
});

it('mounts through <Canvas> from react-dom with the default frameloop', async () => {
  const host = document.createElement('div');
  host.style.cssText = 'width: 64px; height: 48px';
  document.body.appendChild(host);
  const dom = createDomRoot(host);
  const ref: RefObject<Mesh3D | null> = { current: null };
  let frames = 0;
  function Spin() {
    useFrame((_, delta) => {
      ref.current!.rotation.y += delta;
      frames++;
    });
    return (
      <mesh ref={ref}>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    );
  }
  let state: RootState | undefined;
  await act(async () =>
    dom.render(
      <Canvas onCreated={(s) => void (state = s)}>
        <Spin />
      </Canvas>,
    ),
  );
  await vi.waitFor(() => expect(frames).toBeGreaterThan(3), { timeout: 5000 });

  expect(state!.size.width).toBe(64);
  expect(state!.size.height).toBe(48);
  expect(state!.scene.children).toContain(ref.current);
  expect(ref.current!.rotation.y).toBeGreaterThan(0);
  expect(host.querySelector('canvas')).toBe((state!.renderer as unknown as Pixi3DRenderer).domElement);

  await act(async () => dom.unmount());
  host.remove();
});

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

it('suspends on useLoader with a pixi Assets-backed TextureLoader', async () => {
  const ref: RefObject<Mesh3D | null> = { current: null };
  function Textured() {
    const texture = useLoader(TextureLoader, PNG_1X1);
    return (
      <mesh ref={ref}>
        <boxGeometry />
        <flatMaterial args={[{ baseColorTexture: texture }]} />
      </mesh>
    );
  }
  const state = await mount(
    <Suspense fallback={null}>
      <Textured />
    </Suspense>,
  );
  await vi.waitFor(() => expect(ref.current).not.toBeNull());
  state.advance(performance.now());

  expect(state.scene.children).toContain(ref.current);
  expect((ref.current!.material as FlatMaterial).textures.baseColor.width).toBe(1);
});

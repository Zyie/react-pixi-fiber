/**
 * The spike's behaviours, kept passing while the library core is built. Temporary: the harness turns
 * each of these into a visual scene.
 */
import { AmbientLight as PixiAmbientLight, CubeGeometry, Material3D, Mesh3D } from '@pixi/3d';
import type { Container3D, FlatMaterial } from '@pixi/3d';
import type { WebGLRenderer } from 'pixi.js';
import { Suspense, act, useRef } from 'react';
import type { RefObject } from 'react';
import { createRoot as createDomRoot } from 'react-dom/client';
import {
  Canvas,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  TextureLoader,
  Vector2,
  createRoot,
  events,
  useFrame,
  useLoader,
} from 'react-pixi-fiber';
import type { DirectionalLight, ReconcilerRoot, RenderProps, RootState, ThreeEvent } from 'react-pixi-fiber';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';

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

async function mount(element: React.ReactNode, props: RenderProps<HTMLCanvasElement> = {}): Promise<RootState> {
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
  return state;
}

const meshesIn = (node: Container3D): Mesh3D[] =>
  node.children.flatMap((child) => (child instanceof Mesh3D ? [child, ...meshesIn(child)] : meshesIn(child)));

function readPixel(state: RootState, x: number, y: number): number[] {
  const { gl } = state.renderer.pixi as WebGLRenderer;
  const pixel = new Uint8Array(4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
  return [...pixel];
}

function pointer(type: string, x: number, y: number): void {
  const rect = canvas.getBoundingClientRect();
  const init = { clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, bubbles: true, isPrimary: true };
  canvas.dispatchEvent(new PointerEvent(type, init));
}

it('mounts pixi-3d classes by their own names and attaches them into the scene', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
  const native: RefObject<Mesh3D | null> = { current: null };
  const state = await mount(
    <>
      <mesh ref={ref} position={[1, 2, 3]} rotation={[0, Math.PI / 2, 0]}>
        <cubeGeometry />
        <material3D />
      </mesh>
      <mesh3D ref={native} args={[{ geometry: new CubeGeometry(), material: new Material3D() }]} />
    </>,
  );

  const mesh = ref.current!;
  expect(state.scene.children).toContain(mesh);
  expect(mesh.geometry).toBeInstanceOf(CubeGeometry);
  expect(mesh.material).toBeInstanceOf(Material3D);
  expect(mesh.position.toArray()).toEqual([1, 2, 3]);
  expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2);
  expect(native.current).toBeInstanceOf(Mesh3D);

  state.advance(performance.now());
  const view = state.renderer.getView(state.scene)!;
  expect(view.root).toBe(state.scene);
  expect(meshesIn(view.root)).toContain(mesh);
});

it('useFrame rotates the mesh across advance() steps', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
  function Spinner() {
    const mesh = useRef<Mesh>(null);
    useFrame((_, delta) => {
      mesh.current!.rotation.y += delta;
      ref.current = mesh.current;
    });
    return (
      <mesh ref={mesh}>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
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

it('updates the mesh on re-render and destroys it on unmount', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
  const scene = (x: number) => (
    <mesh ref={ref} position={[x, 0, 0]} visible>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
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

it('routes onClick / onPointerOver through the raycaster, with face, faceIndex, uv and point', async () => {
  const hits: string[] = [];
  let clicked: ThreeEvent<MouseEvent> | undefined;
  const state = await mount(
    <mesh
      onClick={(event) => {
        hits.push('click');
        clicked = event;
      }}
      onPointerOver={() => hits.push('over')}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial />
    </mesh>,
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
  expect(clicked!.point.z).toBeCloseTo(1);
  expect(clicked!.distance).toBeCloseTo(4);
  expect(clicked!.face!.normal.z).toBeCloseTo(1);
  expect(clicked!.faceIndex).toBeGreaterThanOrEqual(0);
  expect(clicked!.uv!.x).toBeCloseTo(0.5, 1);
});

it('renders three.js element names through the alias catalog', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
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
  expect(mesh).toBeInstanceOf(Mesh);
  expect(mesh.castShadow).toBe(false);
  expect(mesh.scale.toArray()).toEqual([2, 2, 2]);
  expect(mesh.geometry.bounds3D.max.y).toBeCloseTo(1);
  const material = mesh.material as Material3D;
  expect(material.baseColor).toBe(0xff69b4);
  expect(material.roughness).toBe(0.25);
  expect(material.metallic).toBe(0.5);
  expect(state.camera.position.z).toBe(5);
  expect(state.scene.children.some((c) => c instanceof PixiAmbientLight)).toBe(true);
});

it('attaches a mesh inserted before an existing sibling to the view', async () => {
  const a: RefObject<Mesh | null> = { current: null };
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
  expect(a.current!.view3d).toBe(state.renderer.getView(state.scene));
});

it('draws the mesh over a transparent background', async () => {
  const state = await mount(
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="red" />
    </mesh>,
  );
  state.advance(performance.now());

  const [r, g, b] = readPixel(state, 32, 32);
  expect(r).toBeGreaterThan(200);
  expect(g + b).toBeLessThan(60);
  expect(readPixel(state, 1, 1)).toEqual([0, 0, 0, 0]);
});

it('works out camera matrices before the first frame', async () => {
  const state = await mount(null);
  const { camera } = state;
  expect(camera.matrixWorldInverse.elements[14]).toBeCloseTo(-5);
  expect(camera.projectionMatrix.elements[11]).toBe(-1);
  expect(state.frustum.containsPoint({ x: 0, y: 0, z: 0 })).toBe(true);
});

it('picks from a camera that is in no view', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
  const state = await mount(
    <mesh ref={ref}>
      <boxGeometry />
      <meshBasicMaterial />
    </mesh>,
  );
  const outside = new PerspectiveCamera(50, 1, 0.1, 100);
  outside.position.set(0, 0, -10);
  outside.lookAt(0, 0, 0);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(0, 0), outside);
  const [hit] = raycaster.intersectObject(state.scene, true);
  expect(hit.object).toBe(ref.current);
  expect(hit.point.z).toBeCloseTo(-0.5);
  expect(hit.distance).toBeCloseTo(9.5);
});

it('fires onFramed as a mesh leaves the frustum', async () => {
  const framed: boolean[] = [];
  const ref: RefObject<Mesh | null> = { current: null };
  const state = await mount(
    <mesh ref={ref} onFramed={(inView) => framed.push(inView)}>
      <boxGeometry />
    </mesh>,
  );
  state.advance(performance.now());
  ref.current!.position.x = 100;
  state.advance(performance.now() + 16);
  expect(framed).toEqual([true, false]);
});

it('keeps one view per scene and draws a foreign camera through a proxy', async () => {
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

it('forwards tone mapping and gates shadows on shadowMap.enabled', async () => {
  const light: RefObject<DirectionalLight | null> = { current: null };
  const state = await mount(<directionalLight ref={light} castShadow />, { renderer: { shadows: true } });
  state.advance(performance.now());
  const view = state.renderer.getView(state.scene)!;
  expect(view.toneMapping).toBe('aces');
  expect(light.current!.canCastShadow).toBe(true);

  state.renderer.shadowMap.enabled = false;
  state.advance(performance.now() + 16);
  expect(light.current!.canCastShadow).toBe(false);
});

it('aims a directional light at its target', async () => {
  const light: RefObject<DirectionalLight | null> = { current: null };
  const state = await mount(<directionalLight ref={light} position={[5, 0, 0]} />);
  state.advance(performance.now());
  const zAxis = light.current!.matrixWorld.elements;
  expect([zAxis[8], zAxis[9], zAxis[10]].map((v) => Math.round(v))).toEqual([1, 0, 0]);
});

it('mounts through <Canvas> from react-dom with the default frameloop', async () => {
  const host = document.createElement('div');
  host.style.cssText = 'width: 64px; height: 48px';
  document.body.appendChild(host);
  const dom = createDomRoot(host);
  const ref: RefObject<Mesh | null> = { current: null };
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
      <Canvas onCreated={(s) => void (state = s)} background="#336699">
        <Spin />
      </Canvas>,
    ),
  );
  await vi.waitFor(() => expect(frames).toBeGreaterThan(3), { timeout: 5000 });

  expect(state!.size.width).toBe(64);
  expect(state!.size.height).toBe(48);
  expect(state!.scene.children).toContain(ref.current);
  expect(state!.scene.background).toBe('#336699');
  expect(ref.current!.rotation.y).toBeGreaterThan(0);
  expect(host.querySelector('canvas')).toBe(state!.renderer.domElement);

  await act(async () => dom.unmount());
  host.remove();
});

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

it('suspends on useLoader with a pixi Assets-backed TextureLoader', async () => {
  const ref: RefObject<Mesh | null> = { current: null };
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
  expect((ref.current!.material as FlatMaterial).textures.baseColor!.width).toBe(1);
});

import { createRoot, useLoader, useTexture, useTextures } from '@react-fiber/threejs-compat';
import type { ObjectMap, ReconcilerRoot, RootStore, UseTexturesReturn } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { Group, Loader, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from '@react-fiber/threejs-compat/three';
import { Texture as PixiTexture } from 'pixi.js';
import { act, Suspense } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installObject3DSurface } from '~threejs-compat/compat/installObject3DSurface';

// What useLoader, useTextures and the textures do that no picture shows: caching, cache keys, aborts,
// progress, the registry's reference counts, and what freeing a texture releases. Ported from r3f's
// own tests (packages/fiber/tests/useLoader.test.tsx, useTextures.test.tsx), on real loaders.

let root: ReconcilerRoot<HTMLCanvasElement> | undefined;
let canvas: HTMLCanvasElement | undefined;

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  installObject3DSurface();
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  canvas?.remove();
});

async function mount(element: ReactNode, settle = 0): Promise<RootStore> {
  canvas = document.body.appendChild(document.createElement('canvas'));
  root = createRoot(canvas);
  await root.configure({ frameloop: 'never', size: { width: 64, height: 64, top: 0, left: 0 }, dpr: 1 });

  return act(async () => {
    const store = root!.render(element);

    if (settle) await new Promise((resolve) => setTimeout(resolve, settle));

    return store;
  });
}

/**
 * Lets a root take what loads, a short act at a time, until `done` holds: a download takes as long as
 * the machine's load makes it, and React renders what it pinged at the end of each act
 * @param done - Whether the root has what the test waits for
 */
async function until(done: () => boolean): Promise<void> {
  const end = performance.now() + 10_000;

  while (!done() && performance.now() < end) await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
}

describe('useLoader', () => {
  it('adds the nodes of a loaded scene, as r3f does for a glTF', async () => {
    const mesh = new Mesh();

    mesh.name = 'Scene';

    class SceneLoader extends Loader<{ scene: Mesh }> {
      public override load(_url: string, onLoad?: (data: { scene: Mesh }) => void): void {
        onLoad?.({ scene: mesh });
      }
    }

    let gltf!: { scene: Mesh } & ObjectMap;

    function Component() {
      gltf = useLoader(SceneLoader, '/scene.glb');

      return <primitive object={gltf.scene} />;
    }

    const store = await mount(<Component />);

    expect(store.getState().scene.children).toContain(mesh);
    expect(gltf.nodes.Scene).toBe(mesh);
  });

  it('loads a list of URLs in order, running the extensions for each', async () => {
    const first = new Mesh();
    const second = new Group();
    const extensions = vi.fn<(loader: Loader) => void>();

    class ListLoader extends Loader<Mesh | Group> {
      public override load(url: string, onLoad?: (data: Mesh | Group) => void): void {
        onLoad?.(url === '/first' ? first : second);
      }
    }

    function Component() {
      const [a, b] = useLoader(ListLoader, ['/first', '/second'], extensions);

      return (
        <>
          <primitive object={a} />
          <primitive object={b} />
        </>
      );
    }

    const store = await mount(<Component />);

    expect(store.getState().scene.children.slice(-2)).toEqual([first, second]);
    expect(extensions.mock.calls.length).toBeGreaterThanOrEqual(2);
    useLoader.clear(ListLoader, ['/first', '/second']);
  });

  it('hands an instance to the extensions as it was given, and a class as the instance it made', async () => {
    class NullLoader extends Loader<null> {
      public override load(_url: string, onLoad?: (data: null) => void): void {
        onLoad?.(null);
      }
    }

    const instance = new NullLoader();
    let fromInstance: unknown;
    let fromClass: unknown;

    function Component() {
      useLoader(instance, '/instance', (loader) => (fromInstance = loader));
      useLoader(NullLoader, '/class', (loader) => (fromClass = loader));

      return null;
    }

    await mount(<Component />);

    expect(fromInstance).toBe(instance);
    expect(fromClass).toBeInstanceOf(NullLoader);
    expect(useLoader.loader(NullLoader)).toBe(fromClass);
  });

  it('serves preloaded URLs from the cache, and a custom cache key across changing URLs', async () => {
    const calls: string[] = [];

    class CountingLoader extends Loader<string> {
      public override load(url: string, onLoad?: (data: string) => void): void {
        calls.push(url);
        onLoad?.(`loaded:${url}`);
      }
    }

    useLoader.preload(CountingLoader, ['/a', '/b']);
    await new Promise((resolve) => setTimeout(resolve, 10));

    let a: string | undefined;
    let signed: string | undefined;

    function Component({ url }: { url: string }) {
      a = useLoader(CountingLoader, '/a');
      signed = useLoader(CountingLoader, url, undefined, undefined, '/model');

      return null;
    }

    await mount(<Component url="/model?token=1" />);
    await act(async () => root!.render(<Component url="/model?token=2" />));

    expect(calls).toEqual(['/a', '/b', '/model?token=1']);
    expect(a).toBe('loaded:/a');
    expect(signed).toBe('loaded:/model?token=1');
    useLoader.clear(CountingLoader, ['/a', '/b']);
    useLoader.clear(CountingLoader, '/model?token=1', '/model');
  });

  it('starts a fresh load after an abort and a clear', async () => {
    let started = 0;
    let aborted = 0;

    class SlowLoader extends Loader<string> {
      private _cancel: (() => void) | null = null;

      public override loadAsync(url: string): Promise<string> {
        started++;

        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(url), 5000);

          this._cancel = () => {
            aborted++;
            clearTimeout(timer);
            reject(new Error('aborted'));
          };
        });
      }

      public override abort(): this {
        this._cancel?.();
        this._cancel = null;

        return this;
      }
    }

    function Component() {
      useLoader(SlowLoader, '/slow');

      return null;
    }

    await mount(
      <Suspense fallback={null}>
        <Component />
      </Suspense>,
      50,
    );
    useLoader.loader(SlowLoader).abort();
    useLoader.clear(SlowLoader, '/slow');
    await act(async () => {
      root!.render(
        <Suspense fallback={null}>
          <Component key="again" />
        </Suspense>,
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(aborted).toBe(1);
    expect(started).toBe(2);
    useLoader.loader(SlowLoader).abort();
    useLoader.clear(SlowLoader, '/slow');
  });

  it("reports a glTF's download progress", async () => {
    const progress = vi.fn<(event: ProgressEvent) => void>();

    function Component() {
      useLoader(GLTFLoader, '/models/box.glb?progress', undefined, progress);

      return null;
    }

    await mount(
      <Suspense fallback={null}>
        <Component />
      </Suspense>,
    );
    await until(() => progress.mock.calls.length > 0);

    expect(progress).toHaveBeenCalled();
    expect(progress.mock.calls[0][0]).toBeInstanceOf(ProgressEvent);
    useLoader.clear(GLTFLoader, '/models/box.glb?progress');
  });
});

describe('useTextures', () => {
  async function probe(): Promise<{ store: RootStore; api: () => UseTexturesReturn }> {
    let api!: UseTexturesReturn;

    function Probe() {
      api = useTextures();

      return null;
    }

    const store = await mount(<Probe />);

    return { store, api: () => api };
  }

  it('adds and reads textures by key, list and record', async () => {
    const { api } = await probe();
    const a = new Texture();
    const b = new Texture();

    await act(async () => {
      api().add('a', a);
      api().add({ b });
    });

    expect(api().has('a')).toBe(true);
    expect(api().get('a')).toBe(a);
    expect(api().get(['a', 'b', 'missing'])).toEqual([a, b, undefined]);
    expect(api().get({ map: 'a', normalMap: 'b' })).toEqual({ map: a, normalMap: b });
  });

  it("frees a three texture's GPU copy and keeps it usable, and destroys a plain pixi texture", async () => {
    const { store, api } = await probe();
    const three = new Texture();
    const pixi = new PixiTexture({ source: new Texture().source });
    const unload = vi.spyOn(three.source, 'unload');
    const disposed = vi.fn<() => void>();

    three.addEventListener('dispose', disposed);
    await act(async () => api().add({ three, pixi }));
    await act(async () => api().disposeAll());

    expect(unload).toHaveBeenCalled();
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(three.destroyed).toBe(false);
    expect(pixi.destroyed).toBe(true);
    expect(store.getState().textures.size).toBe(0);
  });

  it('keeps a texture a mounted useTexture holds unless forced', async () => {
    const url = '/textures/quadrants.png?registry';
    let api!: UseTexturesReturn;

    function Consumer() {
      useTexture(url);
      api = useTextures();

      return null;
    }

    const store = await mount(
      <Suspense fallback={null}>
        <Consumer />
      </Suspense>,
    );
    await until(() => store.getState()._textureRefs.has(url));

    expect(store.getState()._textureRefs.get(url)).toBe(1);

    let skipped!: boolean;
    let forced!: boolean;

    await act(async () => void (skipped = api.dispose(url)));
    expect(skipped).toBe(false);
    expect(store.getState().textures.has(url)).toBe(true);

    await act(async () => void (forced = api.dispose(url, { force: true })));
    expect(forced).toBe(true);
    expect(store.getState().textures.has(url)).toBe(false);
  });
});

describe('Texture', () => {
  it('forgets a material once it is destroyed, and frees its GPU copy without ending', () => {
    const texture = new Texture();
    const material = new MeshBasicMaterial({ map: texture });

    expect(texture._users.has(material)).toBe(true);

    material.destroy();
    expect(texture._users.size).toBe(0);

    texture.dispose();
    texture.dispose();
    expect(texture.destroyed).toBe(false);
    expect(texture.source.destroyed).toBe(false);
  });

  it("puts its transform on a material's UVs, and takes it off when it leaves", () => {
    const texture = new Texture();
    const material = new MeshBasicMaterial();
    const mesh = new Mesh(new PlaneGeometry(), material);

    material.map = texture;
    expect(material.uvTransform).toBeUndefined();

    texture.repeat.set(2, 3);
    expect(material.uvTransform?.a).toBe(2);
    expect(material.uvTransform?.d).toBe(3);

    material.map = null;
    expect(material.uvTransform).toBeUndefined();
    expect(texture._users.size).toBe(0);
    mesh.destroy();
  });

  it('clones with a pixi source of its own, so its sampling stays its own', () => {
    const texture = new Texture();
    const copy = texture.clone();

    texture.wrapS = 1000;
    expect(copy.source).not.toBe(texture.source);
    expect(copy.source.style.addressModeU).toBe('clamp-to-edge');
    expect(texture.source.style.addressModeU).toBe('repeat');
  });
});

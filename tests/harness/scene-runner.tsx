import { createRoot, events } from '@react-fiber/threejs-compat';
import type { PixiRenderer, ReconcilerRoot, RenderProps, RootState, RootStore } from '@react-fiber/threejs-compat';
import { Component, Suspense, useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import '@react-fiber/2d';

import { FRAME_STEP, PIXI_ONLY, SCENE_BACKGROUND, SCENE_HEIGHT, SCENE_WIDTH, isPixiOnlyKey } from './scene-constants';
import { createSceneClock, nextTask, syntheticPointers } from './scene-input';
import type { PointerSource, SceneInput } from './scene-input';

/**
 * The pixi-3d renderers every scene runs on, in the order the tests create them. WebGPU goes first:
 * under SwiftShader, a page whose first WebGPU renderer comes after a WebGL one fails every WebGPU frame.
 */
export const PIXI_RENDERERS = ['webgpu', 'webgl'] as const;

/**
 * A renderer a scene runs on: pixi-3d on WebGPU or WebGL through this library, or three.js's
 * `WebGLRenderer` through r3f's own entry, which is what parity is measured against
 */
export type RendererType = (typeof PIXI_RENDERERS)[number] | 'three';

/** Skips a scene, on every renderer or on some */
export interface SceneSkip {
  /** The renderers to skip it on; all of them when omitted */
  renderers?: RendererType[];
  /** Why, which the test's title shows */
  reason: string;
}

/** How a scene's pixi-3d pictures are held to its three.js picture */
export interface SceneParity {
  /**
   * The largest share of drawn pixels, from 0 to 1, that may differ from three.js on each pixi-3d
   * renderer. The scene fails when more differ. 2% when omitted (`DEFAULT_PARITY_MAX_DIFF`).
   */
  maxDiff?: number;
}

/** What a `*.scene.tsx` file exports as `scene` */
export interface TestScene {
  /**
   * Returns the JSX the scene's root renders, as the children of an r3f `<Canvas>` would be: three.js
   * element names (`<mesh>`, `<boxGeometry>`, ...) and hooks imported from `react-pixi-fiber`
   */
  render: () => ReactNode;
  /** The canvas in CSS px and its device pixel ratio; 400 by 300 at a ratio of 1 when omitted */
  size?: { width: number; height: number; dpr?: number };
  /** The default camera, as `<Canvas camera>` takes it; r3f's default (fov 50 at z 5) when omitted */
  camera?: RenderProps<HTMLCanvasElement>['camera'];
  /**
   * More root props, as `<Canvas>` takes them: `renderer={{ shadows: true }}`, `orthographic`, `scene`.
   * A `renderer` settings object is merged with the backend the harness picks.
   */
  canvas?: SceneCanvas;
  /**
   * How many frames the root advances before it is captured, or before `act` runs; 1 when omitted.
   * Each is a sixtieth of a second of the scene's clock after the one before.
   */
  frames?: number;
  /**
   * Drives the scene before it is captured: mouse input, frames of the scene's clock, and new JSX for
   * its root. It runs after the scene's `frames`, and one more frame is rendered after it returns.
   */
  act?: (input: SceneInput, state: RootState) => Promise<void> | void;
  /** How many pixels may differ from the reference image; 16 when omitted */
  pixelMatch?: number;
  /** Skips the scene, with the reason */
  skip?: SceneSkip;
  /** Milliseconds to wait between the last frame and the screenshot */
  delay?: number;
  /**
   * Marks a scene that can't pass yet: text the failure message has to contain, for every renderer or
   * per renderer. Its tests then pass while it fails that way, and fail once it passes or fails another
   * way. Delete it when the scene is meant to pass.
   */
  fails?: string | Partial<Record<RendererType, string>>;
  /** `false` leaves the scene out of the three.js comparison; held to 2% of drawn pixels when omitted */
  parity?: false | SceneParity;
}

/**
 * Why a scene is skipped on a renderer, or `null` when it runs there
 * @param scene - The scene
 * @param renderer - The renderer about to run
 */
export function skipReason(scene: TestScene, renderer: RendererType): string | null {
  const { skip } = scene;

  if (!skip || (skip.renderers && !skip.renderers.includes(renderer))) return null;

  return skip.reason;
}

/**
 * A scene with the defaults of its folder: one under `PIXI_ONLY_FOLDERS` is `PIXI_ONLY`, skipping
 * three.js and the parity comparison, unless it says otherwise
 * @param key - The scene's key, such as `2d/graphics` or `docs/2d/first-2d-scene`
 * @param scene - The scene
 */
export function withFolderDefaults<T extends TestScene>(key: string, scene: T): T {
  return isPixiOnlyKey(key) ? { ...PIXI_ONLY, ...scene } : scene;
}

/** The root props a scene may set beyond its size, camera and the harness's own */
export type SceneCanvas = Partial<Pick<RenderProps<HTMLCanvasElement>, 'orthographic' | 'scene'>> & {
  /** Renderer settings, such as `{ shadows: true }`; a scene runs on several renderers, so never one renderer */
  renderer?: Exclude<
    RenderProps<HTMLCanvasElement>['renderer'],
    boolean | PixiRenderer | ((...args: never[]) => unknown)
  >;
};

/** A scene on a live root, and the way to take it down */
export interface MountedScene {
  canvas: HTMLCanvasElement;
  /** The root's state as it is now */
  getState: () => RootState;
  /** Unmounts the root, removes its canvas from the page and gives the page its real clock back */
  destroy: () => void;
}

/**
 * The root props of a scene on a renderer: its `canvas` props, with the renderer settings where that
 * renderer's entry reads them. This library takes them as `renderer`, with pixi-3d's backend added;
 * r3f's WebGL entry takes them as `gl` and rejects `renderer`, which is for its WebGPU entry.
 * @param renderer - The renderer the scene runs on
 * @param canvas - The scene's `canvas` props
 */
export function canvasProps(
  renderer: RendererType,
  { renderer: settings, ...canvas }: SceneCanvas = {},
): Partial<RenderProps<HTMLCanvasElement>> {
  if (renderer === 'three') return settings ? { ...canvas, gl: settings } : canvas;

  return { ...canvas, renderer: { ...settings, preference: renderer } };
}

/** Calls back once a commit has put it, and the scene rendered before it, in the root */
function Committed({ onCommit }: { onCommit: () => void }): null {
  useLayoutEffect(onCommit, [onCommit]);

  return null;
}

/**
 * An error boundary that hands on an error its children throw while they render, which would otherwise
 * only be logged. Once it has caught one it renders nothing.
 */
export class SceneBoundary extends Component<
  { onError: (error: unknown) => void; children: ReactNode },
  { failed: boolean }
> {
  public override state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidCatch(error: unknown): void {
    this.props.onError(error);
  }

  public override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Renders children into a root and resolves once React has committed them, after anything they
 * suspended on has loaded. An error they throw while they render rejects it.
 * @param root - The scene's root
 * @param children - What the root renders
 * @returns The root's store
 */
function commit(root: ReconcilerRoot<HTMLCanvasElement>, children: ReactNode): Promise<RootStore> {
  let store: RootStore | undefined;

  return new Promise<void>((resolve, reject) => {
    // The first render commits before it returns, so `store` is only read once the promise settles.
    store = root.render(
      <SceneBoundary onError={reject}>
        <Suspense fallback={null}>
          {children}
          <Committed onCommit={resolve} />
        </Suspense>
      </SceneBoundary>,
    );
  }).then(() => store!);
}

/**
 * Builds a scene on a new root and adds its canvas to the page. The vitest harness and the playground
 * both mount scenes through this, so a scene looks the same in a test as it does in the playground.
 *
 * The root's frameloop is `never` and `performance.now()` stands still, so the only frames are the ones
 * asked for here, each a fixed step of the scene's clock after the last. A scene that throws while it is
 * built or driven takes its root down with it.
 * @param scene - The scene to build
 * @param renderer - The renderer to build it on; the `three` renderer needs `react-pixi-fiber` resolved
 * to r3f's own entry
 * @param pointers - Makes the mouse a scene's `act` moves; DOM events dispatched on the canvas when omitted
 */
export async function mountScene(
  scene: TestScene,
  renderer: RendererType,
  pointers: PointerSource = syntheticPointers,
): Promise<MountedScene> {
  const { width = SCENE_WIDTH, height = SCENE_HEIGHT, dpr = 1 } = scene.size ?? {};
  const canvas = document.createElement('canvas');

  canvas.style.cssText = `display:block;width:${width}px;height:${height}px;background:${SCENE_BACKGROUND}`;
  document.body.appendChild(canvas);

  const clock = createSceneClock();
  const root = createRoot(canvas);
  const destroy = (): void => {
    root.unmount();
    canvas.remove();
    clock.restore();
  };

  try {
    await root.configure({
      frameloop: 'never',
      size: { width, height, top: 0, left: 0 },
      dpr,
      camera: scene.camera,
      events,
      ...canvasProps(renderer, scene.canvas),
    });

    const store = await commit(root, scene.render());
    const frames = async (count = 1, step = FRAME_STEP): Promise<void> => {
      for (let frame = 0; frame < count; frame++) {
        // React schedules a state change made outside a DOM event, such as one `act` sets off through
        // `events.update()`, from a microtask; it commits before the frame draws, as it would in an app.
        await Promise.resolve();
        await nextTask();
        store.getState().advance(clock.tick(step));
        // A React commit that the frame queued, such as a state change in `useFrame`, lands before the next one.
        await nextTask();
      }
    };

    await frames(scene.frames ?? 1);

    if (scene.act) {
      const update = async (children: ReactNode): Promise<void> => void (await commit(root, children));

      await scene.act({ mouse: pointers(canvas), frames, update }, store.getState());
      await frames();
    }

    return { canvas, getState: store.getState, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

import type { Container3D } from '@pixi/3d';
import type { SchedulerApi } from '@pmndrs/scheduler';
import type { Container, Texture } from 'pixi.js';
import type { RefObject } from 'react';
import type { StoreApi } from 'zustand';
import type { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

import type { PixiSupport } from '../support/pixiSupport';
import type { Camera, DomEvent, EventManager, PointerCaptureTarget, ThreeEvent } from './events';
import type { RegisteredInstance } from './register';

/**
 * A size and offset in CSS pixels
 * @category types
 * @standard
 */
export interface Size {
  /** Width in CSS pixels */
  width: number;
  /** Height in CSS pixels */
  height: number;
  /** Distance from the top of the page in CSS pixels */
  top: number;
  /** Distance from the left of the page in CSS pixels */
  left: number;
}

/**
 * A pixel ratio, or a range the device's ratio is clamped to
 * @category types
 * @standard
 */
export type Dpr = number | [min: number, max: number];

/**
 * When the root renders: every frame, on `invalidate()`, or only on `advance()`
 * @category types
 * @standard
 */
export type Frameloop = 'always' | 'demand' | 'never';

/**
 * The canvas size in world units at a distance from the camera
 * @category types
 * @standard
 */
export interface Viewport extends Size {
  /** The pixel ratio at creation */
  initialDpr: number;
  /** The current pixel ratio */
  dpr: number;
  /** CSS pixels per world unit */
  factor: number;
  /** Distance from the camera */
  distance: number;
  /** Width over height */
  aspect: number;
}

/**
 * A legacy per-frame callback
 * @category types
 * @advanced
 */
export type RenderCallback = (state: RootState, delta: number, frame?: unknown) => void;

/**
 * Adaptive performance settings
 * @category types
 * @standard
 */
export interface Performance {
  /** Current level, between `min` and `max` */
  current: number;
  /** Lowest level, 0 to `max` */
  min: number;
  /** Highest level, `min` to 1 */
  max: number;
  /** Milliseconds before `current` returns to `max` */
  debounce: number;
  /** Drops `current` to `min` for `debounce` milliseconds */
  regress: () => void;
}

/**
 * A legacy frame subscription
 * @category types
 * @advanced
 */
export interface Subscription {
  /** The callback, kept current across renders */
  ref: RefObject<RenderCallback>;
  /** Its priority; one above 0 takes over rendering */
  priority: number;
  /** The root it runs in */
  store: RootStore;
}

/**
 * Hover, capture and click state for one pointer
 * @category types
 * @advanced
 */
export interface PointerState {
  /** Objects this pointer is over */
  hovered: Map<string, ThreeEvent<DomEvent>>;
  /** Objects capturing this pointer */
  captured: Map<Container3D, PointerCaptureTarget>;
  /** Where the last click started */
  initialClick: [x: number, y: number];
  /** What the last click started on */
  initialHits: Container3D[];
}

/**
 * The parts of `state.internal` code outside r3f reads; the rest is r3f's own bookkeeping
 * @category types
 * @advanced
 */
export interface InternalState {
  /** Objects with event handlers */
  interaction: Container3D[];
  /** Legacy frame subscriptions */
  subscribers: Subscription[];
  /** Per-pointer state */
  pointerMap: Map<number, PointerState>;
  /** Whether the root renders */
  active: boolean;
  /** Legacy render priority */
  priority: number;
  /** Frames left to render on demand */
  frames: number;
  /** The renderer; use `state.renderer` */
  actualRenderer: RegisteredInstance<'Renderer'>;
  /** The renderer support this root loaded */
  support: PixiSupport;
  /** The global scheduler */
  scheduler: SchedulerApi | null;
  /** This root's id in the scheduler */
  rootId?: string;
  /** What children attach to: the scene, or a portal's container */
  container?: Container3D;
  /** What r3f and extensions keep beside these */
  [key: string]: unknown;
}

/**
 * A root's XR session wiring
 * @category types
 * @advanced
 */
export interface XRManager {
  /** Starts listening for an XR session */
  connect: () => void;
  /** Stops listening for an XR session */
  disconnect: () => void;
}

/**
 * Everything a root knows, from `useThree()` and in `useFrame` callbacks, typed against pixi-3d
 * @example
 * ```tsx
 * import { useThree } from '@react-fiber/core';
 *
 * const { camera, scene, size, viewport } = useThree();
 * ```
 * @category types
 * @standard
 */
export interface RootState {
  /** Sets state */
  set: StoreApi<RootState>['setState'];
  /** Gets state */
  get: StoreApi<RootState>['getState'];
  /** The store of the root that owns the renderer: this one */
  primaryStore: RootStore;
  /**
   * The renderer, by r3f's older name
   * @deprecated Use `renderer`.
   */
  gl: RegisteredInstance<'Renderer'>;
  /** The renderer */
  renderer: RegisteredInstance<'Renderer'>;
  /** Unused: three's WebGPU inspector */
  inspector: unknown;
  /** The default camera */
  camera: Camera;
  /** The camera's frustum, updated every frame while `autoUpdateFrustum` is on */
  frustum: RegisteredInstance<'Frustum'>;
  /** Update `frustum` every frame @default true */
  autoUpdateFrustum: boolean;
  /** The scene, or a portal's container inside a portal */
  scene: RegisteredInstance<'Scene'>;
  /** The root's scene, even inside a portal */
  rootScene: RegisteredInstance<'Scene'>;
  /**
   * The screen layer: the pixi.js container the 2D elements placed directly in the canvas are children
   * of, drawn over the 3D in CSS pixels from the canvas's top-left corner. Its 3D view sits at a zIndex
   * just under 0, so a top-level 2D element with a negative `zIndex` draws behind the 3D.
   */
  screen: Container;
  /** The raycaster pointer events use */
  raycaster: RegisteredInstance<'Raycaster'>;
  /** The event layer */
  events: EventManager<HTMLElement>;
  /** XR wiring; inert on pixi-3d */
  xr: XRManager;
  /** Camera controls registered with `makeDefault` */
  /** Camera controls an app registers as the default, which events and helpers read */
  controls: object | null;
  /** Normalised pointer coordinates, -1 to 1 */
  pointer: RegisteredInstance<'Vector2'>;
  /**
   * Normalised pointer coordinates, by r3f's older name
   * @deprecated Use `pointer`.
   */
  mouse: RegisteredInstance<'Vector2'>;
  /** Colour space for 8-bit colour textures */
  textureColorSpace: string;
  /** When the root renders */
  frameloop: Frameloop;
  /** Adaptive performance */
  performance: Performance;
  /** The canvas size in CSS pixels */
  size: Size;
  /** The canvas size in world units */
  viewport: Viewport & {
    /** The viewport at a distance from a camera */
    getCurrentViewport: (
      camera?: Camera,
      target?: RegisteredInstance<'Vector3'> | [x: number, y: number, z: number],
      size?: Size,
    ) => Omit<Viewport, 'dpr' | 'initialDpr'>;
  };
  /** Requests frames, for `frameloop="demand"` */
  invalidate: (frames?: number, stackFrames?: boolean) => void;
  /** Renders one frame at `timestamp` */
  advance: (timestamp: number, runGlobalEffects?: boolean) => void;
  /** Changes the event layer */
  setEvents: (events: Partial<EventManager<HTMLElement>>) => void;
  /** Sets the size; no arguments go back to the container's */
  setSize: (width?: number, height?: number, top?: number, left?: number) => void;
  /** Sets the pixel ratio */
  setDpr: (dpr: Dpr) => void;
  /** Sets when the root renders; no argument means `'always'` */
  setFrameloop: (frameloop?: Frameloop) => void;
  /** Sets the error the error boundary throws */
  setError: (error: Error | null) => void;
  /** The current error */
  error: Error | null;
  /** Textures loaded with `useTexture`, by URL */
  textures: Map<string, Texture>;
  /** How many mounted `useTexture` calls hold each texture */
  _textureRefs: Map<string, number>;
  /** Whether `setSize` owns the size */
  _sizeImperative: boolean;
  /** The size props of `<Canvas>` */
  _sizeProps: { width?: number; height?: number } | null;
  /** A click that hit nothing */
  onPointerMissed?: (event: MouseEvent) => void;
  /** A drag-over that hit nothing */
  onDragOverMissed?: (event: DragEvent) => void;
  /** A drop that hit nothing */
  onDropMissed?: (event: DragEvent) => void;
  /** Inside a portal, the state of the layer outside it */
  previousRoot?: RootStore;
  /** r3f's bookkeeping */
  internal: InternalState;
  /** Always `false`: this renderer is not three's WebGL renderer */
  isLegacy: boolean;
  /** Whether pixi.js picked its WebGPU backend */
  webGPUSupported: boolean;
  /** Always `false` */
  isNative: boolean;
}

/**
 * A root's zustand store
 * @category types
 * @advanced
 */
export type RootStore = UseBoundStoreWithEqualityFn<StoreApi<RootState>>;

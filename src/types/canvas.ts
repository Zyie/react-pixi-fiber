import type { ColorSource } from 'pixi.js';
import type * as React from 'react';
import type { Options as ResizeOptions } from 'react-use-measure';

import type { OrthographicCamera } from '../catalog/OrthographicCamera';
import type { PerspectiveCamera } from '../catalog/PerspectiveCamera';
import type { Scene } from '../catalog/Scene';
import type { Raycaster } from '../compat/Raycaster';
import type { PixiRenderer, PixiRendererParameters } from '../renderer/PixiRenderer';
import type { ThreeElement } from './elements';
import type { ComputeFunction, EventManager } from './events';
import type { Dpr, Frameloop, Performance, RootState, RootStore, Size } from './state';
import type { Properties } from './utils';

/**
 * A promise tagged with its state, the protocol React's `use` reads
 * @category types
 * @advanced
 */
export type TrackedPromise<T> = Promise<T> &
  ({ status: 'pending' } | { status: 'fulfilled'; value: T } | { status: 'rejected'; reason: unknown });

/**
 * three's shadow settings: `true` for PCF, a named type, or `shadowMap` fields
 * @category types
 * @standard
 */
export type ShadowsConfig = boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<PixiRenderer['shadowMap']>;

/**
 * Renderer settings r3f reads itself instead of passing to the renderer
 * @category types
 * @standard
 */
export interface RendererSettings {
  /** Turn shadows on, and pick the filter */
  shadows?: ShadowsConfig;
  /** Colour space for 8-bit colour textures */
  textureColorSpace?: string;
}

/**
 * The `renderer` prop: renderer parameters and properties, a renderer, or a function that makes one
 * @category types
 * @standard
 */
export type RendererProps =
  | boolean
  | PixiRenderer
  | ((defaults: PixiRendererParameters) => PixiRenderer | Promise<PixiRenderer>)
  | (Partial<Omit<PixiRendererParameters, 'canvas'> & Properties<PixiRenderer>> & RendererSettings);

/**
 * The `camera` prop: a camera, or props for the default one
 * @category types
 * @standard
 */
export type CameraProps = (
  | PerspectiveCamera
  | OrthographicCamera
  | Partial<ThreeElement<typeof PerspectiveCamera> & ThreeElement<typeof OrthographicCamera>>
) & {
  /** When `true`, r3f leaves the projection alone on resize */
  manual?: boolean;
};

/**
 * How a root is configured, by `createRoot().configure()` and the props of `<Canvas>`
 * @category types
 * @standard
 */
export interface RenderProps<_TCanvas extends HTMLCanvasElement | OffscreenCanvas> {
  /** The root's id in the scheduler */
  id?: string;
  /** Ignored: pixi.js can't share a renderer between canvases, so each canvas has its own */
  primary?: boolean;
  /** Ignored: pixi.js can't share a renderer between canvases, so each canvas has its own */
  share?: string | false;
  /** Where the root renders among other roots in the scheduler */
  scheduler?: { before?: string | string[]; after?: string | string[]; order?: number; fps?: number };
  /** The same as `renderer`, so code written for `@react-three/fiber/legacy` runs unchanged */
  gl?: RendererProps;
  /** Renderer parameters and properties, a renderer, or a function that makes one */
  renderer?: RendererProps;
  /** The canvas size; measured from the container when left out */
  size?: Size;
  /** Use an orthographic default camera */
  orthographic?: boolean;
  /** When the root renders @default 'always' */
  frameloop?: Frameloop;
  /** Adaptive performance settings */
  performance?: Partial<Omit<Performance, 'regress'>>;
  /** The pixel ratio, or a range the device's is clamped to @default [1, 2] */
  dpr?: Dpr;
  /** Raycaster settings */
  raycaster?: Partial<Omit<Raycaster, 'params'>> & { params?: Partial<Raycaster['params']> };
  /** A scene, or props for the default one */
  scene?: Scene | Partial<Scene>;
  /** A camera, or props for the default one */
  camera?: CameraProps;
  /** The event layer; `events` from this package */
  events?: (store: RootStore) => EventManager<HTMLElement>;
  /** Called once the root is set up, before the first frame */
  onCreated?: (state: RootState) => void;
  /** A click that hit nothing */
  onPointerMissed?: (event: MouseEvent) => void;
  /** A drag-over that hit nothing */
  onDragOverMissed?: (event: DragEvent) => void;
  /** A drop that hit nothing */
  onDropMissed?: (event: DragEvent) => void;
  /** Update `state.frustum` every frame @default true */
  autoUpdateFrustum?: boolean;
  /** Ignored: pixi-3d has no occlusion queries */
  occlusion?: boolean;
  /** Round the size up to even numbers */
  forceEven?: boolean;
}

/**
 * A root on a canvas, from `createRoot`
 * @category types
 * @standard
 */
export interface ReconcilerRoot<TCanvas extends HTMLCanvasElement | OffscreenCanvas> {
  /** Settles once every configure call so far has applied */
  readonly ready: TrackedPromise<unknown>;
  /** Configures the root; the first call creates the renderer */
  configure: (config?: RenderProps<TCanvas>) => TrackedPromise<ReconcilerRoot<TCanvas>>;
  /** Renders a React tree into the scene */
  render: (element: React.ReactNode) => RootStore;
  /** Unmounts the tree and frees the renderer */
  unmount: () => void;
}

/**
 * The props of `<Canvas>`
 * @category types
 * @standard
 */
export interface CanvasProps
  extends Omit<RenderProps<HTMLCanvasElement>, 'size'>, Omit<React.HTMLAttributes<HTMLDivElement>, 'onCopy'> {
  /** The scene */
  children?: React.ReactNode;
  /** Receives the canvas element */
  ref?: React.Ref<HTMLCanvasElement>;
  /** Shown when the renderer can't be created */
  fallback?: React.ReactNode;
  /** Options for measuring the container */
  resize?: ResizeOptions;
  /** The element events are read from; the canvas's container by default */
  eventSource?: HTMLElement | React.RefObject<HTMLElement | null>;
  /** Which event coordinates map to the canvas @default 'offset' */
  eventPrefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen';
  /** Forward Vite hot updates to root extensions @default true */
  hmr?: boolean;
  /** Canvas width in CSS pixels; the container's when left out */
  width?: number;
  /** Canvas height in CSS pixels; the container's when left out */
  height?: number;
  /** Colour drawn behind the scene; three's presets and image URLs are not supported */
  background?: ColorSource;
}

/**
 * State a portal overrides
 * @category types
 * @advanced
 */
export type InjectState = Partial<
  Omit<RootState, 'events'> & {
    events?: { enabled?: boolean; priority?: number; compute?: ComputeFunction; connected?: unknown };
    injectScene?: boolean;
  }
>;

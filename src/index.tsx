/**
 * react-pixi-fiber: react-three-fiber v10 rendering with pixi-3d
 *
 * The values are r3f's own core, unchanged (vendored in `src/r3f`), re-exported with types that
 * name pixi-3d instead of three. An r3f app should only have to swap its import.
 */
import type { Container3D } from '@pixi/3d';
import { getScheduler as pmndrsGetScheduler, Scheduler as PmndrsScheduler } from '@pmndrs/scheduler';
import type {
  AddPhaseOptions as PmndrsAddPhaseOptions,
  FrameCallback as SchedulerFrameCallback,
  FrameControls as PmndrsFrameControls,
  RootOptions as PmndrsRootOptions,
  SchedulerApi as PmndrsSchedulerApi,
  FrameNextControls as PmndrsFrameNextControls,
  FrameTimingState as PmndrsFrameTimingState,
  UseFrameOptions as PmndrsUseFrameOptions,
} from '@pmndrs/scheduler';
import type { Texture as PixiTexture } from 'pixi.js';
import * as React from 'react';
import type Reconciler from 'react-reconciler';

import type { PixiCatalog } from './catalog/catalog';
import type { OrthographicCamera } from './catalog/scene/OrthographicCamera';
import type { Texture as ThreeTexture } from './catalog/textures/Texture';
import type { Frustum } from './math/Frustum';
import {
  createEvents as coreCreateEvents,
  createPointerEvents as coreEvents,
  removeInteractivity as coreRemoveInteractivity,
  swapInteractivity as coreSwapInteractivity,
} from './r3f/src/core/events';
import {
  registerRootExtension as coreRegisterRootExtension,
  setRenderOverride as coreSetRenderOverride,
} from './r3f/src/core/extensions';
import { useGraph as coreUseGraph, useInstanceHandle as coreUseInstanceHandle } from './r3f/src/core/hooks';
import { useFrame as coreUseFrame } from './r3f/src/core/hooks/useFrame';
import { useLoader as coreUseLoader } from './r3f/src/core/hooks/useLoader';
import { useStore as coreUseStore, useThree as coreUseThree } from './r3f/src/core/hooks/useStore';
import {
  IsObject as coreIsObject,
  Texture as coreTexture,
  useTexture as coreUseTexture,
} from './r3f/src/core/hooks/useTexture';
import {
  addAfterEffect as coreAddAfterEffect,
  addEffect as coreAddEffect,
  addTail as coreAddTail,
  advance as coreAdvance,
  invalidate as coreInvalidate,
} from './r3f/src/core/loop';
import { Portal as corePortal, createPortal as coreCreatePortal } from './r3f/src/core/portal';
import {
  extend as coreExtend,
  flushSync as coreFlushSync,
  reconciler as coreReconciler,
} from './r3f/src/core/reconciler';
import { isRenderer as coreIsRenderer } from './r3f/src/core/renderer';
import { _roots as coreRoots, unmountComponentAtNode as coreUnmount } from './r3f/src/core/root';
import { context as coreContext, createStore as coreCreateStore } from './r3f/src/core/store';
import { getThree as coreGetThree, hasThree as coreHasThree, whenThree as coreWhenThree } from './r3f/src/core/three';
import {
  Block as coreBlock,
  ErrorBoundary as coreErrorBoundary,
  FROM_REF as coreFromRefKey,
  ONCE as coreOnceKey,
  REACT_INTERNAL_PROPS as coreReactInternalProps,
  RESERVED_PROPS as coreReservedProps,
  applyProps as coreApplyProps,
  attach as coreAttach,
  buildGraph as coreBuildGraph,
  calculateDpr as coreCalculateDpr,
  detach as coreDetach,
  diffProps as coreDiffProps,
  dispose as coreDispose,
  findInitialRoot as coreFindInitialRoot,
  fromRef as coreFromRef,
  getInstanceProps as coreGetInstanceProps,
  getRootState as coreGetRootState,
  getUuidPrefix as coreGetUuidPrefix,
  hasConstructor as coreHasConstructor,
  invalidateInstance as coreInvalidateInstance,
  is as coreIs,
  isColorRepresentation as coreIsColorRepresentation,
  isCopyable as coreIsCopyable,
  isFromRef as coreIsFromRef,
  isLayers as coreIsLayers,
  isObject3D as coreIsObject3D,
  isOnce as coreIsOnce,
  isOrthographicCamera as coreIsOrthographicCamera,
  isRef as coreIsRef,
  isTexture as coreIsTexture,
  isUniform as coreIsUniform,
  isVectorLike as coreIsVectorLike,
  once as coreOnce,
  prepare as corePrepare,
  resolve as coreResolve,
  updateCamera as coreUpdateCamera,
  updateFrustum as coreUpdateFrustum,
  useBridge as coreUseBridge,
  useIsomorphicLayoutEffect as coreUseIsomorphicLayoutEffect,
  useMutableCallback as coreUseMutableCallback,
} from './r3f/src/core/utils';
import type { InjectState, Root } from './types/canvas';
import type { HostConfig, Instance, ThreeElement, ThreeElementsOf } from './types/elements';
import type { Camera, DomEvent, EventManager } from './types/events';
import type { Extensions, InputLike, LoaderLike, LoaderResult, ObjectMap } from './types/loader';
import type { Color } from './types/math';
import type * as ReactThreeFiber from './types/namespace';
import type { Dpr, RootState, RootStore, Size } from './types/state';
import type { Act, Bridge, ConstructorRepresentation, EquConfig, UnblockProps } from './types/utils';

export { Canvas } from './root/Canvas';
export { createRoot } from './root/createRoot';

export { aliases, catalog, type AliasCatalog, type PixiCatalog } from './catalog/catalog';
export type { CameraMembers, Object3DMembers } from './compat/installObject3DSurface';
export type { ThreeMatrix4Members, ThreeQuaternionMembers, ThreeVector3Members } from './compat/threeMembers';
export { PixiRenderer, type PixiRendererParameters, type PixiShadowMap } from './renderer/PixiRenderer';
export { pixiSupport, type PixiSupport } from './support/pixiSupport';
export {
  useTextures,
  type DisposeOptions,
  type TextureInput,
  type TextureResult,
  type UseTexturesReturn,
} from './loaders/useTextures';
export type * from './types/canvas';
export type * from './types/elements';
export type * from './types/events';
export type * from './types/loader';
export type * from './types/math';
export type * from './types/state';
export type * from './types/utils';

/**
 * The scheduler every root's frameloop runs on, one per page; r3f's, from `@pmndrs/scheduler`
 * @category core
 * @advanced
 */
export const getScheduler: () => PmndrsScheduler = pmndrsGetScheduler;

/**
 * The class of the scheduler {@link getScheduler} returns, from `@pmndrs/scheduler`
 * @category core
 * @advanced
 */
export const Scheduler: typeof PmndrsScheduler = PmndrsScheduler;

/**
 * An instance of {@link Scheduler}
 * @category core
 * @advanced
 */
export type Scheduler = PmndrsScheduler;

/**
 * What {@link useFrame} returns: controls for its job, such as pausing and stepping it
 * @category hooks
 * @advanced
 */
export type FrameNextControls = PmndrsFrameNextControls;

/**
 * The clock a {@link useFrame} callback gets: elapsed time, delta, frame count
 * @category hooks
 * @advanced
 */
export type FrameTimingState = PmndrsFrameTimingState;

/**
 * The options of {@link useFrame}: phase, priority, fps, and the jobs to run before or after
 * @category hooks
 * @advanced
 */
export type UseFrameOptions = PmndrsUseFrameOptions;

/**
 * The options of {@link useFrame}, by its older name
 * @category hooks
 * @advanced
 */
export type UseFrameNextOptions = PmndrsUseFrameOptions;

/**
 * The options of `getScheduler().addPhase`, from `@pmndrs/scheduler`
 * @category core
 * @advanced
 */
export type AddPhaseOptions = PmndrsAddPhaseOptions;

/**
 * The options a root registers with in the scheduler, from `@pmndrs/scheduler`
 * @category core
 * @advanced
 */
export type RootOptions = PmndrsRootOptions;

/**
 * What {@link getScheduler} returns, from `@pmndrs/scheduler`
 * @category core
 * @advanced
 */
export type SchedulerApi = PmndrsSchedulerApi;

/**
 * Controls for a scheduler job, from `@pmndrs/scheduler`
 * @category hooks
 * @advanced
 */
export type FrameControls = PmndrsFrameControls;

/**
 * Whether this entry builds three's WebGL renderer: never, it renders with pixi-3d
 * @category core
 * @advanced
 */
export const R3F_BUILD_LEGACY = false;

/**
 * Whether this entry builds three's WebGPU renderer: never, it renders with pixi-3d
 * @category core
 * @advanced
 */
export const R3F_BUILD_WEBGPU = false;

/**
 * The callback `useFrame` runs every frame: the root's state with the frame's timing, and the
 * seconds since the last frame
 * @category hooks
 * @standard
 */
export type FrameCallback = SchedulerFrameCallback<RootState>;

/**
 * r3f's name for {@link FrameCallback}
 * @category hooks
 * @advanced
 */
export type FrameNextCallback = FrameCallback;

/**
 * The state a {@link FrameCallback} gets: the root's state with the frame's timing
 * @category hooks
 * @advanced
 */
export interface FrameNextState extends RootState, PmndrsFrameTimingState {}

/**
 * r3f's short name for {@link FrameNextState}
 * @category hooks
 * @advanced
 */
export type FrameState = FrameNextState;

/**
 * The type of {@link useThree}
 * @category hooks
 * @advanced
 */
export type UseThree = <T = RootState>(
  selector?: (state: RootState) => T,
  equalityFn?: <U>(state: U, newState: U) => boolean,
) => T;

/**
 * Reads the root's state, or a slice of it, and re-renders when that changes
 * @example
 * ```tsx
 * const size = useThree((state) => state.size);
 * const { camera, scene } = useThree();
 * ```
 * @category hooks
 * @standard
 */
export const useThree: UseThree = coreUseThree as unknown as UseThree;

/**
 * Returns the root's zustand store, for reading state without re-rendering
 * @example
 * ```tsx
 * const store = useStore();
 * const camera = store.getState().camera;
 * ```
 * @category hooks
 * @advanced
 */
export const useStore: () => RootStore = coreUseStore as unknown as () => RootStore;

/**
 * The type of {@link useFrame}
 * @category hooks
 * @advanced
 */
export type UseFrame = (
  callback?: FrameCallback,
  priorityOrOptions?: number | UseFrameNextOptions,
) => FrameNextControls;

/**
 * Runs a callback every frame, before the scene renders
 * @example
 * ```tsx
 * const mesh = useRef<Mesh>(null);
 * useFrame((state, delta) => {
 *   mesh.current!.rotation.y += delta;
 * });
 * ```
 * @category hooks
 * @standard
 */
export const useFrame: UseFrame = coreUseFrame as unknown as UseFrame;

/**
 * The type of {@link useLoader}
 * @category hooks
 * @advanced
 */
export interface UseLoader {
  /** Loads assets with a loader and suspends until they are ready */
  <I extends InputLike, L extends LoaderLike | ConstructorRepresentation<LoaderLike>>(
    loader: L,
    input: I,
    extensions?: Extensions<L>,
    onProgress?: (event: ProgressEvent) => void,
    cacheKey?: InputLike,
  ): I extends unknown[] ? LoaderResult<L>[] : LoaderResult<L>;
  /** Starts loading into the cache without suspending */
  preload<I extends InputLike, L extends LoaderLike | ConstructorRepresentation<LoaderLike>>(
    loader: L,
    input: I,
    extensions?: Extensions<L>,
    onProgress?: (event: ProgressEvent) => void,
    cacheKey?: InputLike,
  ): void;
  /** Removes an asset from the cache */
  clear<I extends InputLike, L extends LoaderLike | ConstructorRepresentation<LoaderLike>>(
    loader: L,
    input: I,
    cacheKey?: InputLike,
  ): void;
  /** The loader instance `useLoader` made for a loader class, or the instance it was given, to reach `abort()` */
  loader<L extends LoaderLike | ConstructorRepresentation<LoaderLike>>(
    loader: L,
  ): L extends ConstructorRepresentation<infer T> ? T : L;
}

/**
 * Loads assets with a loader and suspends until they are ready; wrap the caller in `<Suspense>`
 * @example
 * ```tsx
 * import { useLoader } from 'react-pixi-fiber';
 * import { TextureLoader } from 'react-pixi-fiber/three';
 *
 * const texture = useLoader(TextureLoader, '/crate.png');
 * ```
 * @category hooks
 * @standard
 */
export const useLoader: UseLoader = coreUseLoader as unknown as UseLoader;

/**
 * What {@link useTexture} returns for each input shape
 * @category hooks
 * @advanced
 */
export type MappedTextures<Url> = Url extends string
  ? ThreeTexture
  : Url extends string[]
    ? ThreeTexture[]
    : { [K in keyof Url]: ThreeTexture };

/**
 * r3f's name for {@link MappedTextures}
 * @category hooks
 * @advanced
 */
export type MappedTextureType<Url extends string | string[] | Record<string, string>> = MappedTextures<Url>;

/**
 * The options of {@link useTexture}
 * @category hooks
 * @advanced
 */
export interface UseTextureOptions<Url extends string | string[] | Record<string, string>> {
  /** Runs once the textures have loaded */
  onLoad?: (textures: MappedTextures<Url>) => void;
  /** Keep the textures in the loader's cache @default true */
  cache?: boolean;
}

/**
 * The type of {@link useTexture}
 * @category hooks
 * @advanced
 */
export interface UseTexture {
  /** Loads textures by URL and suspends until they are ready */
  <Url extends string | string[] | Record<string, string>>(
    input: Url,
    optionsOrOnLoad?: UseTextureOptions<Url> | ((textures: MappedTextures<Url>) => void),
  ): MappedTextures<Url>;
  /** Starts loading into the cache without suspending */
  preload(url: string | string[]): void;
  /** Removes textures from the cache */
  clear(input: string | string[]): void;
}

/**
 * Loads three {@link ThreeTexture | textures} by URL with `TextureLoader` and suspends until they
 * are ready: one URL, a list, or a record whose result spreads into a material
 * @example
 * ```tsx
 * const { map, normal } = useTexture({ map: '/color.png', normal: '/normal.png' });
 * ```
 * @category hooks
 * @standard
 */
export const useTexture: UseTexture = coreUseTexture as unknown as UseTexture;

/**
 * Indexes an object's descendants by name: nodes, meshes and materials
 * @example
 * ```tsx
 * const { nodes } = useGraph(model);
 * ```
 * @category hooks
 * @standard
 */
export const useGraph: (object: Container3D) => ObjectMap = coreUseGraph as unknown as (
  object: Container3D,
) => ObjectMap;

/**
 * Returns r3f's instance record for an element's ref; an escape hatch into r3f's internals
 * @category hooks
 * @advanced
 */
export const useInstanceHandle: <T>(ref: React.RefObject<T>) => React.RefObject<Instance<T>> =
  coreUseInstanceHandle as unknown as <T>(ref: React.RefObject<T>) => React.RefObject<Instance<T>>;

/**
 * The type of {@link extend}
 * @category core
 * @advanced
 */
export interface Extend {
  /** Makes one class a JSX element and returns a component for it */
  <T extends ConstructorRepresentation>(objects: T): React.ExoticComponent<ThreeElement<T>>;
  /** Makes classes JSX elements, named in camelCase */
  (objects: Record<string, unknown>): void;
}

/**
 * Makes classes available as JSX elements: `extend({ MyMesh })` adds `<myMesh>`, and
 * `extend(MyMesh)` returns a component for it
 * @example
 * ```tsx
 * import { Mesh3D } from '@pixi/3d';
 * import { extend } from 'react-pixi-fiber';
 *
 * class Spinner extends Mesh3D {}
 * const SpinnerElement = extend(Spinner);
 * ```
 * @category core
 * @standard
 */
export const extend: Extend = coreExtend as unknown as Extend;

/**
 * Renders children into another node or scene, optionally with their own state
 * @example
 * ```tsx
 * const [hud] = useState(() => new Scene());
 * return createPortal(<mesh />, hud, { events: { priority: 2 } });
 * ```
 * @category core
 * @standard
 */
export const createPortal: (
  children: React.ReactNode,
  container: Container3D | React.RefObject<Container3D | null>,
  state?: InjectState,
) => React.JSX.Element = coreCreatePortal as unknown as (
  children: React.ReactNode,
  container: Container3D | React.RefObject<Container3D | null>,
  state?: InjectState,
) => React.JSX.Element;

/**
 * Applies props to an object the way r3f applies element props: math props, pierced paths, events
 * @example
 * ```ts
 * applyProps(mesh, { position: [0, 1, 0], 'scale-x': 2 });
 * ```
 * @category core
 * @advanced
 */
export const applyProps: <T>(object: T, props: Record<string, unknown>) => T = coreApplyProps as unknown as <T>(
  object: T,
  props: Record<string, unknown>,
) => T;

/**
 * Calls `dispose` on an object and on each of its properties that has one; scenes are skipped
 * @category core
 * @advanced
 */
export const dispose: (object: object) => void = coreDispose as unknown as (object: object) => void;

/**
 * The state of the root an object was rendered in
 * @category core
 * @advanced
 */
export const getRootState: (object: Container3D) => RootState | undefined = coreGetRootState as unknown as (
  object: Container3D,
) => RootState | undefined;

/**
 * Indexes an object's descendants by name, as `useGraph` does outside React
 * @category core
 * @advanced
 */
export const buildGraph: (object: Container3D) => ObjectMap = coreBuildGraph as unknown as (
  object: Container3D,
) => ObjectMap;

/**
 * Marks a prop to be read from another element's ref once it is set: `target={fromRef(targetRef)}`
 * @category core
 * @standard
 */
export const fromRef: <T, R = T>(ref: React.RefObject<T | null>, selector?: (value: T) => R) => R =
  coreFromRef as unknown as <T, R = T>(ref: React.RefObject<T | null>, selector?: (value: T) => R) => R;

/**
 * Marks a prop as a method to call once on mount: `rotateX={once(Math.PI / 2)}`
 * @category core
 * @standard
 */
export const once: <A extends unknown[]>(...args: A) => never = coreOnce as unknown as <A extends unknown[]>(
  ...args: A
) => never;

/**
 * The pointer event layer `<Canvas>` uses; pass it to `createRoot().configure({ events })`
 * @category events
 * @standard
 */
export const events: (store: RootStore) => EventManager<HTMLElement> = coreEvents as unknown as (
  store: RootStore,
) => EventManager<HTMLElement>;

/**
 * The same as {@link events}
 * @category events
 * @advanced
 */
export const createPointerEvents: (store: RootStore) => EventManager<HTMLElement> = events;

/**
 * Unmounts the root on a canvas and frees its renderer
 * @category core
 * @standard
 */
export const unmountComponentAtNode: <TCanvas extends HTMLCanvasElement | OffscreenCanvas>(
  canvas: TCanvas,
  callback?: (canvas: TCanvas) => void,
) => void = coreUnmount;

/**
 * Requests frames for a root on `frameloop="demand"`, or for every root without one
 * @category core
 * @standard
 */
export const invalidate: (state?: RootState, frames?: number, stackFrames?: boolean) => void =
  coreInvalidate as unknown as (state?: RootState, frames?: number, stackFrames?: boolean) => void;

/**
 * Renders one frame of a root, or of every root, at `timestamp`; for `frameloop="never"`
 * @category core
 * @standard
 */
export const advance: (timestamp: number, runGlobalEffects?: boolean, state?: RootState) => void =
  coreAdvance as unknown as (timestamp: number, runGlobalEffects?: boolean, state?: RootState) => void;

/**
 * Runs a callback before every frame of every root
 * @deprecated Use `useFrame(callback, { phase: 'start' })`.
 * @category core
 * @advanced
 */
export const addEffect: (callback: (timestamp: number) => void) => () => void = coreAddEffect;

/**
 * Runs a callback after every frame of every root
 * @deprecated Use `useFrame(callback, { phase: 'finish' })`.
 * @category core
 * @advanced
 */
export const addAfterEffect: (callback: (timestamp: number) => void) => () => void = coreAddAfterEffect;

/**
 * Runs a callback when the frameloop goes idle
 * @deprecated Use `getScheduler().onIdle(callback)`.
 * @category core
 * @advanced
 */
export const addTail: (callback: (timestamp: number) => void) => () => void = coreAddTail;

/**
 * Runs `fn` and flushes the scene updates it makes synchronously
 * @category core
 * @advanced
 */
export const flushSync: <R>(fn: () => R) => R = coreFlushSync;

/**
 * React's `act`, for tests that render into a root
 * @category core
 * @advanced
 */
export const act: Act = (React as unknown as { act: Act }).act;

/**
 * The React context holding the current root's store
 * @category core
 * @advanced
 */
export const context: React.Context<RootStore> = coreContext as unknown as React.Context<RootStore>;

/**
 * The catalog roots resolve classes from, once a root has loaded it
 * @category core
 * @advanced
 */
export const getThree: () => PixiCatalog = coreGetThree as unknown as () => PixiCatalog;

/**
 * Whether a root has loaded the catalog yet
 * @category core
 * @advanced
 */
export const hasThree: () => boolean = coreHasThree;

/**
 * Resolves with the catalog once a root has loaded it
 * @category core
 * @advanced
 */
export const whenThree: () => Promise<PixiCatalog> = coreWhenThree as unknown as () => Promise<PixiCatalog>;

/**
 * A package's per-root setup, run after a root's renderer exists and before `onCreated`
 * @category core
 * @advanced
 */
export interface RootExtension {
  /** Unique name; registering it again replaces the entry */
  name: string;
  /** Runs once per root; returns fields to merge into its state */
  setup?(store: RootStore): Partial<RootState> | void;
  /** Runs when a root it set up unmounts */
  dispose?(store: RootStore): void;
  /** Runs on hot module replacement */
  hmr?(store: RootStore): void;
}

/**
 * Registers a {@link RootExtension} for every root, current and future
 * @category core
 * @advanced
 */
export const registerRootExtension: (extension: RootExtension) => () => void = coreRegisterRootExtension as unknown as (
  extension: RootExtension,
) => () => void;

/**
 * Replaces a root's `renderer.render(scene, camera)` with another function, or restores it with `null`
 * @category core
 * @advanced
 */
export const setRenderOverride: (store: RootStore, render: (() => void) | null) => void =
  coreSetRenderOverride as unknown as (store: RootStore, render: (() => void) | null) => void;

/**
 * The props of {@link Texture}
 * @category hooks
 * @advanced
 */
export interface TextureProps<Url extends string | string[] | Record<string, string>> {
  /** The URLs to load, as {@link useTexture} takes them */
  input: Url;
  /** Renders the loaded textures */
  children?: (textures: MappedTextures<Url>) => React.ReactNode;
  /** Runs once the textures have loaded, or the options of {@link useTexture} */
  onLoad?: UseTextureOptions<Url> | ((textures: MappedTextures<Url>) => void);
  /** Keep the textures in the loader's cache @default true */
  cache?: boolean;
}

/**
 * {@link useTexture} as a component: loads textures and renders `children` with them
 * @example
 * ```tsx
 * <Texture input="/crate.png">{(map) => <meshBasicMaterial map={map} />}</Texture>
 * ```
 * @category hooks
 * @advanced
 */
export const Texture: <Url extends string | string[] | Record<string, string>>(
  props: TextureProps<Url>,
) => React.JSX.Element = coreTexture as unknown as <Url extends string | string[] | Record<string, string>>(
  props: TextureProps<Url>,
) => React.JSX.Element;

/**
 * Whether a {@link useTexture} input is a record of URLs rather than one URL or a list
 * @category hooks
 * @advanced
 */
export const IsObject: (url: unknown) => url is Record<string, string> = coreIsObject;

/**
 * The props of {@link Portal}
 * @category core
 * @advanced
 */
export interface PortalProps {
  /** What to render into the container */
  children: React.ReactNode;
  /** State the portal's children see in place of the root's */
  state?: InjectState;
  /** The node or scene to render into, or a ref to it */
  container: Container3D | React.RefObject<Container3D | null>;
}

/**
 * The component {@link createPortal} renders, which waits for a container ref to be set
 * @category core
 * @advanced
 */
export const Portal: (props: PortalProps) => React.JSX.Element = corePortal as unknown as (
  props: PortalProps,
) => React.JSX.Element;

/**
 * The handlers a root's event layer attaches to the canvas, from {@link createEvents}
 * @category events
 * @advanced
 */
export interface EventHandlersFactory {
  /** Returns the DOM listener for an r3f event name, such as `onPointerMove` */
  handlePointer(name: string): (event: DomEvent) => void;
  /** Raycasts the pointer moves deferred to the frame, when `events.frameTimedRaycasts` is on */
  flushDeferredPointers(): void;
  /** Raycasts one deferred pointer move */
  processDeferredPointer(event: DomEvent, pointerId: number): void;
}

/**
 * Builds the pointer handling of a root, which {@link events} wires to the canvas; for a custom event layer
 * @category events
 * @advanced
 */
export const createEvents: (store: RootStore) => EventHandlersFactory = coreCreateEvents as unknown as (
  store: RootStore,
) => EventHandlersFactory;

/**
 * Moves an object's event registration, hover and pointer capture over to the object replacing it
 * @category events
 * @advanced
 */
export const swapInteractivity: (store: RootStore, object: Container3D, newObject: Container3D) => void =
  coreSwapInteractivity as unknown as (store: RootStore, object: Container3D, newObject: Container3D) => void;

/**
 * Removes an object from a root's event handling: its handlers, hovers and captures
 * @category events
 * @advanced
 */
export const removeInteractivity: (store: RootStore, object: Container3D) => void =
  coreRemoveInteractivity as unknown as (store: RootStore, object: Container3D) => void;

/**
 * r3f's React reconciler, which `createRoot`, `createPortal` and `flushSync` drive
 * @category core
 * @advanced
 */
export const reconciler: Reconciler.Reconciler<
  HostConfig['container'],
  HostConfig['instance'],
  HostConfig['textInstance'],
  HostConfig['suspenseInstance'],
  HostConfig['formInstance'],
  HostConfig['publicInstance']
> = coreReconciler as unknown as Reconciler.Reconciler<
  HostConfig['container'],
  HostConfig['instance'],
  HostConfig['textInstance'],
  HostConfig['suspenseInstance'],
  HostConfig['formInstance'],
  HostConfig['publicInstance']
>;

/**
 * Every root, by its canvas
 * @category core
 * @advanced
 */
export const _roots: Map<HTMLCanvasElement | OffscreenCanvas, Root> = coreRoots as unknown as Map<
  HTMLCanvasElement | OffscreenCanvas,
  Root
>;

/**
 * Makes a root's store; `createRoot` calls it
 * @category core
 * @advanced
 */
export const createStore: (
  invalidate: (state?: RootState, frames?: number, stackFrames?: boolean) => void,
  advance: (timestamp: number, runGlobalEffects?: boolean, state?: RootState) => void,
) => RootStore = coreCreateStore as unknown as (
  invalidate: (state?: RootState, frames?: number, stackFrames?: boolean) => void,
  advance: (timestamp: number, runGlobalEffects?: boolean, state?: RootState) => void,
) => RootStore;

/**
 * Whether a value is a renderer, by its `render` method
 * @category core
 * @advanced
 */
export const isRenderer: (value: unknown) => boolean = coreIsRenderer;

/**
 * `useLayoutEffect` in a browser and `useEffect` on a server, where layout effects warn
 * @category hooks
 * @advanced
 */
export const useIsomorphicLayoutEffect: typeof React.useLayoutEffect = coreUseIsomorphicLayoutEffect;

/**
 * A ref that always holds the latest `fn`, to call from effects without listing it as a dependency
 * @category hooks
 * @advanced
 */
export const useMutableCallback: <T>(fn: T) => React.RefObject<T> = coreUseMutableCallback;

/**
 * Returns a component that carries the React context, StrictMode and Activity of the renderer it is
 * called in, for rendering into another renderer
 * @category hooks
 * @advanced
 */
export const useBridge: () => Bridge = coreUseBridge;

/**
 * Suspends rendering while it is mounted, by handing `set` a promise that never settles
 * @category core
 * @advanced
 */
export const Block: (props: Omit<UnblockProps, 'children'>) => null = coreBlock as unknown as (
  props: Omit<UnblockProps, 'children'>,
) => null;

/**
 * An error boundary that renders nothing after an error and hands the error to `set`
 * @category core
 * @advanced
 */
export const ErrorBoundary: React.ComponentClass<
  { set: React.Dispatch<Error | undefined>; children: React.ReactNode },
  { error: boolean }
> = coreErrorBoundary;

/**
 * Comparison helpers r3f uses on props: type checks, and `equ` for equality by reference or shallowly
 * @category core
 * @advanced
 */
export const is: {
  /** Whether `a` is a plain object: not an array or a function */
  obj: (a: unknown) => boolean;
  /** Whether `a` is a function */
  fun: (a: unknown) => a is (...args: never[]) => unknown;
  /** Whether `a` is a string */
  str: (a: unknown) => a is string;
  /** Whether `a` is a number */
  num: (a: unknown) => a is number;
  /** Whether `a` is a boolean */
  boo: (a: unknown) => a is boolean;
  /** Whether `a` is `undefined` */
  und: (a: unknown) => boolean;
  /** Whether `a` is `null` */
  nul: (a: unknown) => boolean;
  /** Whether `a` is an array */
  arr: (a: unknown) => boolean;
  /** Whether `a` and `b` are equal, as `config` says to compare them */
  equ: (a: unknown, b: unknown, config?: EquConfig) => boolean;
} = coreIs as unknown as typeof is;

/**
 * Whether a camera is orthographic
 * @category core
 * @advanced
 */
export const isOrthographicCamera: (camera: Camera) => camera is OrthographicCamera & Camera =
  coreIsOrthographicCamera as unknown as (camera: Camera) => camera is OrthographicCamera & Camera;

/**
 * Whether a value is a React ref object
 * @category core
 * @advanced
 */
export const isRef: (value: unknown) => value is React.RefObject<unknown> = coreIsRef;

/**
 * Whether a value is a colour a colour prop takes: a string, a number or a colour object
 * @category core
 * @advanced
 */
export const isColorRepresentation: (value: unknown) => value is Color = coreIsColorRepresentation as unknown as (
  value: unknown,
) => value is Color;

/**
 * Whether a value is a scene node, by its `isObject3D` flag
 * @category core
 * @advanced
 */
export const isObject3D: (value: unknown) => value is Container3D = coreIsObject3D as unknown as (
  value: unknown,
) => value is Container3D;

/**
 * Whether a value is a texture, by its `isTexture` flag
 * @category core
 * @advanced
 */
export const isTexture: (value: unknown) => value is PixiTexture = coreIsTexture as unknown as (
  value: unknown,
) => value is PixiTexture;

/**
 * Whether a value is shaped like three's `Layers`; nothing in pixi-3d is
 * @category core
 * @advanced
 */
export const isLayers: (value: unknown) => boolean = coreIsLayers;

/**
 * Whether a value is shaped like a shader uniform: a `value` and a `clone`
 * @category core
 * @advanced
 */
export const isUniform: (value: unknown) => boolean = coreIsUniform;

/**
 * Whether a value has a `set` method, as a math prop's target does
 * @category core
 * @advanced
 */
export const isVectorLike: (value: unknown) => value is { set: (...args: never[]) => unknown } =
  coreIsVectorLike as unknown as (value: unknown) => value is { set: (...args: never[]) => unknown };

/**
 * Whether a value has `set` and `copy` methods
 * @category core
 * @advanced
 */
export const isCopyable: (
  value: unknown,
) => value is { set: (...args: never[]) => unknown; copy: (...args: never[]) => unknown } =
  coreIsCopyable as unknown as (
    value: unknown,
  ) => value is { set: (...args: never[]) => unknown; copy: (...args: never[]) => unknown };

/**
 * Whether a value has a constructor
 * @category core
 * @advanced
 */
export const hasConstructor: (value: unknown) => value is { constructor?: unknown } = coreHasConstructor;

/**
 * Element props r3f never applies to the object: `children`, `key`, `ref`, `args`, `dispose`,
 * `attach`, `object`
 * @category core
 * @advanced
 */
export const RESERVED_PROPS: string[] = coreReservedProps;

/**
 * Props React keeps for itself: `children`, `key`, `ref`
 * @category core
 * @advanced
 */
export const REACT_INTERNAL_PROPS: string[] = coreReactInternalProps;

/**
 * Follows a dashed prop path to the object and key it sets: `material-color` on a mesh is `color`
 * on its material
 * @category core
 * @advanced
 */
export const resolve: (root: object, key: string) => { root: object; key: string; target: unknown } =
  coreResolve as unknown as (root: object, key: string) => { root: object; key: string; target: unknown };

/**
 * Attaches a child instance to its parent, as its `attach` prop says
 * @category core
 * @advanced
 */
export const attach: (parent: Instance, child: Instance) => void = coreAttach as unknown as (
  parent: Instance,
  child: Instance,
) => void;

/**
 * Detaches a child instance from its parent and restores what it replaced
 * @category core
 * @advanced
 */
export const detach: (parent: Instance, child: Instance) => void = coreDetach as unknown as (
  parent: Instance,
  child: Instance,
) => void;

/**
 * The props that changed between an instance's props and new ones
 * @category core
 * @advanced
 */
export const diffProps: <T = unknown>(instance: Instance<T>, newProps: Instance<T>['props']) => Instance<T>['props'] =
  coreDiffProps as unknown as <T = unknown>(
    instance: Instance<T>,
    newProps: Instance<T>['props'],
  ) => Instance<T>['props'];

/**
 * The store of the root an instance was first rendered in, before portals
 * @category core
 * @advanced
 */
export const findInitialRoot: <T>(instance: Instance<T>) => RootStore = coreFindInitialRoot as unknown as <T>(
  instance: Instance<T>,
) => RootStore;

/**
 * An element's props without React's own (`children`, `key`, `ref`)
 * @category core
 * @advanced
 */
export const getInstanceProps: <T = unknown>(pendingProps: Record<string, unknown>) => Instance<T>['props'] =
  coreGetInstanceProps as unknown as <T = unknown>(pendingProps: Record<string, unknown>) => Instance<T>['props'];

/**
 * Makes the instance record for an object, as the reconciler does for each element
 * @category core
 * @advanced
 */
export const prepare: <T = unknown>(
  target: T,
  root: RootStore,
  type: string,
  props: Instance<T>['props'],
) => Instance<T> = corePrepare as unknown as <T = unknown>(
  target: T,
  root: RootStore,
  type: string,
  props: Instance<T>['props'],
) => Instance<T>;

/**
 * Requests a frame for the root an instance is in, on `frameloop="demand"`
 * @category core
 * @advanced
 */
export const invalidateInstance: (instance: Instance) => void = coreInvalidateInstance as unknown as (
  instance: Instance,
) => void;

/**
 * The pixel ratio a `dpr` setting gives on this device: the number, or the device's ratio clamped
 * to `[min, max]`
 * @category core
 * @advanced
 */
export const calculateDpr: (dpr: Dpr) => number = coreCalculateDpr;

/**
 * The first part of a UUID, for short names in logs
 * @category core
 * @advanced
 */
export const getUuidPrefix: (uuid: string) => string = coreGetUuidPrefix;

/**
 * Fits a camera's projection to a size, as r3f does on resize, unless the camera is `manual`
 * @category core
 * @advanced
 */
export const updateCamera: (camera: Camera, size: Size) => void = coreUpdateCamera as unknown as (
  camera: Camera,
  size: Size,
) => void;

/**
 * Sets a frustum from a camera's current matrices, making one when none is given
 * @category core
 * @advanced
 */
export const updateFrustum: (camera: Camera, frustum?: Frustum) => Frustum = coreUpdateFrustum as unknown as (
  camera: Camera,
  frustum?: Frustum,
) => Frustum;

/**
 * The key a {@link fromRef} marker keeps its ref under
 * @category core
 * @advanced
 */
export const FROM_REF: unique symbol = coreFromRefKey as unknown as typeof FROM_REF;

/**
 * What {@link fromRef} returns before the reconciler resolves it
 * @category core
 * @advanced
 */
export interface FromRefMarker<T = unknown, R = T> {
  /** The ref to read once it is set */
  [FROM_REF]: React.RefObject<T | null>;
  /** Maps the ref's value to what the prop takes */
  transform?: (value: T) => R;
}

/**
 * Whether a prop value is a {@link fromRef} marker
 * @category core
 * @advanced
 */
export const isFromRef: (value: unknown) => value is FromRefMarker = coreIsFromRef as unknown as (
  value: unknown,
) => value is FromRefMarker;

/**
 * The key a {@link once} marker keeps its arguments under
 * @category core
 * @advanced
 */
export const ONCE: unique symbol = coreOnceKey as unknown as typeof ONCE;

/**
 * What a {@link once} prop reads as in a type: nothing for no arguments, the argument for one,
 * the tuple for more
 * @category core
 * @advanced
 */
export type OnceValue<A extends unknown[]> = A extends [] ? true : A extends [infer Single] ? Single : A;

/**
 * Whether a prop value is a {@link once} marker
 * @category core
 * @advanced
 */
export const isOnce: (value: unknown) => value is { [ONCE]: unknown[] | true } = coreIsOnce as unknown as (
  value: unknown,
) => value is { [ONCE]: unknown[] | true };

export type { ReactThreeFiber };

/**
 * The classes elements resolve to, r3f's `ThreeExports`: pixi-3d's exports and the catalog's
 * three-named classes
 * @category types
 * @advanced
 */
export type ThreeExports = PixiCatalog;

/**
 * Every element a scene can use: pixi-3d's classes (`<mesh3D>`, `<cubeGeometry>`) and three's names
 * (`<mesh>`, `<boxGeometry>`). Augment it to type elements added with `extend`.
 * @category types
 * @standard
 */
export interface ThreeElements extends ThreeElementsOf<PixiCatalog> {}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

/**
 * react-pixi-fiber: react-three-fiber v10 rendering with pixi-3d
 *
 * The values are r3f's own core, unchanged (vendored in `src/r3f`), re-exported with types that
 * name pixi-3d instead of three. An r3f app should only have to swap its import.
 */
import type { Container3D } from '@pixi/3d';
import type {
  FrameCallback as SchedulerFrameCallback,
  FrameNextControls,
  UseFrameNextOptions,
} from '@pmndrs/scheduler';
import type { Texture } from 'pixi.js';
import * as React from 'react';

import type { PixiCatalog } from './catalog/catalog';
import { createPointerEvents as coreEvents } from './r3f/src/core/events';
import {
  registerRootExtension as coreRegisterRootExtension,
  setRenderOverride as coreSetRenderOverride,
} from './r3f/src/core/extensions';
import { useGraph as coreUseGraph, useInstanceHandle as coreUseInstanceHandle } from './r3f/src/core/hooks';
import { useFrame as coreUseFrame } from './r3f/src/core/hooks/useFrame';
import { useLoader as coreUseLoader } from './r3f/src/core/hooks/useLoader';
import { useStore as coreUseStore, useThree as coreUseThree } from './r3f/src/core/hooks/useStore';
import { useTexture as coreUseTexture } from './r3f/src/core/hooks/useTexture';
import {
  addAfterEffect as coreAddAfterEffect,
  addEffect as coreAddEffect,
  addTail as coreAddTail,
  advance as coreAdvance,
  invalidate as coreInvalidate,
} from './r3f/src/core/loop';
import { createPortal as coreCreatePortal } from './r3f/src/core/portal';
import { extend as coreExtend, flushSync as coreFlushSync } from './r3f/src/core/reconciler';
import { unmountComponentAtNode as coreUnmount } from './r3f/src/core/root';
import { context as coreContext } from './r3f/src/core/store';
import { getThree as coreGetThree, hasThree as coreHasThree, whenThree as coreWhenThree } from './r3f/src/core/three';
import {
  applyProps as coreApplyProps,
  buildGraph as coreBuildGraph,
  dispose as coreDispose,
  fromRef as coreFromRef,
  getRootState as coreGetRootState,
  once as coreOnce,
} from './r3f/src/core/utils';
import type { InjectState, ObjectMap } from './types/canvas';
import type { ThreeElement, ThreeElementsOf, Instance } from './types/elements';
import type { EventManager } from './types/events';
import type { Extensions, InputLike, LoaderLike, LoaderResult } from './types/loader';
import type { RootState, RootStore } from './types/state';
import type { Act, ConstructorRepresentation } from './types/utils';

export { Canvas } from './root/Canvas';
export { createRoot } from './root/createRoot';

export { AmbientLight } from './catalog/AmbientLight';
export { BoxGeometry } from './catalog/BoxGeometry';
export { aliases, catalog, type AliasCatalog, type PixiCatalog } from './catalog/catalog';
export * from './catalog/constants';
export { DirectionalLight } from './catalog/DirectionalLight';
export { Group } from './catalog/Group';
export { Mesh } from './catalog/Mesh';
export { MeshBasicMaterial, type MeshBasicMaterialParameters } from './catalog/MeshBasicMaterial';
export { MeshStandardMaterial, type MeshStandardMaterialParameters } from './catalog/MeshStandardMaterial';
export { Object3D } from './catalog/Object3D';
export { OrthographicCamera } from './catalog/OrthographicCamera';
export { PerspectiveCamera } from './catalog/PerspectiveCamera';
export { PlaneGeometry } from './catalog/PlaneGeometry';
export { PointLight } from './catalog/PointLight';
export { Scene } from './catalog/Scene';
export { SphereGeometry } from './catalog/SphereGeometry';
export { TextureLoader } from './catalog/TextureLoader';
export { Frustum } from './compat/Frustum';
export type { CameraMembers, Object3DMembers } from './compat/installObject3DSurface';
export {
  Raycaster,
  type Face,
  type Intersection as RaycastIntersection,
  type RaycasterParameters,
} from './compat/Raycaster';
export { Vector2 } from './compat/Vector2';
export { Vector3 } from './compat/Vector3';
export { PixiRenderer, type PixiRendererParameters, type PixiShadowMap } from './renderer/PixiRenderer';
export { pixiSupport, type PixiSupport } from './support/pixiSupport';
export type * from './types/canvas';
export type * from './types/elements';
export type * from './types/events';
export type * from './types/loader';
export type * from './types/state';
export type * from './types/utils';
export { getScheduler, Scheduler } from '@pmndrs/scheduler';
export type { FrameNextControls, FrameTimingState, UseFrameNextOptions, UseFrameOptions } from '@pmndrs/scheduler';

//* Build flags ==============================

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

//* Hooks ==============================

/**
 * The callback `useFrame` runs every frame: the root's state with the frame's timing, and the
 * seconds since the last frame
 * @category hooks
 * @standard
 */
export type FrameCallback = SchedulerFrameCallback<RootState>;

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
}

/**
 * Loads assets with a loader and suspends until they are ready; wrap the caller in `<Suspense>`
 * @example
 * ```tsx
 * import { TextureLoader, useLoader } from 'react-pixi-fiber';
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
  ? Texture
  : Url extends string[]
    ? Texture[]
    : { [K in keyof Url]: Texture };

/**
 * The type of {@link useTexture}
 * @category hooks
 * @advanced
 */
export interface UseTexture {
  <Url extends string | string[] | Record<string, string>>(
    input: Url,
    optionsOrOnLoad?:
      | { onLoad?: (textures: MappedTextures<Url>) => void; cache?: boolean }
      | ((textures: MappedTextures<Url>) => void),
  ): MappedTextures<Url>;
  /** Starts loading into the cache without suspending */
  preload(url: string | string[]): void;
  /** Removes textures from the cache */
  clear(input: string | string[]): void;
}

/**
 * Loads pixi textures by URL and suspends until they are ready
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

//* Elements ==============================

/**
 * The type of {@link extend}
 * @category core
 * @advanced
 */
export interface Extend {
  <T extends ConstructorRepresentation>(objects: T): React.ExoticComponent<ThreeElement<T>>;
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

//* Roots and frames ==============================

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
 * @deprecated Use `useFrame(callback, { phase: 'start' })`.
 * @category core
 * @advanced
 */
export const addEffect: (callback: (timestamp: number) => void) => () => void = coreAddEffect;

/**
 * @deprecated Use `useFrame(callback, { phase: 'finish' })`.
 * @category core
 * @advanced
 */
export const addAfterEffect: (callback: (timestamp: number) => void) => () => void = coreAddAfterEffect;

/**
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

//* JSX elements ==============================

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

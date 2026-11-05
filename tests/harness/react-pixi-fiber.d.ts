import type { JSX } from 'react';
import type * as THREE from 'three';

import type {
  CanvasProps,
  EventManager,
  FrameNextCallback,
  FrameNextControls,
  ReconcilerRoot,
  RootState,
  RootStore,
  ThreeElementsOf,
  UseFrameNextOptions,
} from '#types';

// The types of `react-pixi-fiber` for the scenes, examples and playground, until the package entry in
// `src` type-checks: r3f's own API with three.js's element catalog, which is the API a scene is written
// against. `tsconfig.json` points the package name here; point it at the entry in `src` and delete this
// file once that entry has its own types.

export type { CanvasProps, ReconcilerRoot, RenderProps, RootState, RootStore, ThreeEvent } from '#types';

/** Creates a root on a canvas */
export declare function createRoot<TCanvas extends HTMLCanvasElement | OffscreenCanvas>(
  canvas: TCanvas,
): ReconcilerRoot<TCanvas>;

/** A DOM canvas that renders its children with the library's renderer */
export declare function Canvas(props: CanvasProps): JSX.Element;

/** The DOM pointer events of a root */
export declare function events(store: RootStore): EventManager<Element>;

/** Runs a callback on every frame of the root */
export declare function useFrame(
  callback?: FrameNextCallback,
  priorityOrOptions?: number | UseFrameNextOptions,
): FrameNextControls;

/** The root's state, or a slice of it */
export declare function useThree<T = RootState>(
  selector?: (state: RootState) => T,
  equalityFn?: <U>(state: U, newState: U) => boolean,
): T;

/** Loads a texture through the renderer's texture loader, suspending until it has */
export declare function useTexture(url: string): THREE.Texture;

/** The JSX elements of the catalog */
export interface ThreeElements extends ThreeElementsOf<typeof THREE> {}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

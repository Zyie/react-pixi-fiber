import type { BaseMaterial3D, Container3D } from '@pixi/3d';

import type { ConstructorRepresentation } from './utils';

/**
 * One URL, or several
 * @category types
 * @advanced
 */
export type InputLike = string | string[] | string[][] | Readonly<string | string[] | string[][]>;

/**
 * Anything with three's `Loader.load` signature
 * @category types
 * @advanced
 */
export interface LoaderLike {
  /** Loads a URL and calls back with the result, its progress, or an error */
  load(
    url: InputLike,
    onLoad?: Callback<unknown>,
    onProgress?: Callback<ProgressEvent>,
    onError?: Callback<unknown>,
  ): unknown;
}

/** A callback checked bivariantly, so a loader whose callback takes a narrower result still fits */
type Callback<T> = { bivarianceHack(value: T): void }['bivarianceHack'];

type LoaderInstance<T> = T extends ConstructorRepresentation<infer L> ? L : T;

/**
 * What a loader's `load` hands its callback
 * @category types
 * @advanced
 */
export type LoaderResult<T> =
  LoaderInstance<T> extends { load(url: never, onLoad?: (result: infer R) => void, ...rest: never[]): unknown }
    ? R
    : unknown;

/**
 * Configures a loader before it loads
 * @category types
 * @advanced
 */
export type Extensions<T> = (loader: LoaderInstance<T>) => void;

/**
 * What `useGraph` returns: named nodes, materials and meshes
 * @category types
 * @standard
 */
export interface ObjectMap {
  /** Every node, by name */
  nodes: Record<string, Container3D>;
  /** Every material, by name */
  materials: Record<string, BaseMaterial3D>;
  /** Every mesh, by name */
  meshes: Record<string, Container3D>;
}

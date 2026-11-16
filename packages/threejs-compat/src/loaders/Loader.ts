import { DefaultLoadingManager } from './LoadingManager';
import type { LoadingManager } from './LoadingManager';

/**
 * three's `Loader`, the base of every loader: where files load from, how they are requested, and
 * `loadAsync` over `load`
 *
 * r3f's `useLoader` takes any loader with three's `load(url, onLoad, onProgress, onError)`; one that
 * extends this gets `loadAsync`, which `useLoader` prefers, and `abort`, which `useLoader.loader(...)`
 * reaches. Subclasses override `load`, and `parse` when they read data already in memory.
 * @example
 * ```ts
 * class JsonLoader extends Loader<unknown> {
 *   public override load(url: string, onLoad?: (data: unknown) => void, _onProgress?: unknown, onError?: (error: unknown) => void) {
 *     fetch(this.path + url).then((response) => response.json()).then(onLoad, onError);
 *   }
 * }
 * ```
 * @category catalog
 * @advanced
 */
export class Loader<TData = unknown, TUrl = string> {
  /** The material name three's loaders give a material the file leaves unnamed */
  public static DEFAULT_MATERIAL_NAME: string = '__DEFAULT';

  /** Counts this loader's files */
  public manager: LoadingManager;
  /** The `crossOrigin` of image requests @default 'anonymous' */
  public crossOrigin: string = 'anonymous';
  /** Whether requests send cookies @default false */
  public withCredentials: boolean = false;
  /** Put in front of every URL this loader loads */
  public path: string = '';
  /** Where a file's own files (a model's textures) load from, when not beside it */
  public resourcePath: string = '';
  /** Headers every request sends */
  public requestHeader: Record<string, string> = {};

  /** @param manager - Counts this loader's files; {@link DefaultLoadingManager} when omitted */
  constructor(manager?: LoadingManager) {
    this.manager = manager ?? DefaultLoadingManager;
  }

  /**
   * Loads a file and calls back with the result; the base does nothing
   * @param _url - The file
   * @param _onLoad - Called with the result
   * @param _onProgress - Called as it downloads
   * @param _onError - Called when it fails
   */
  public load(
    _url: TUrl,
    _onLoad?: (data: TData) => void,
    _onProgress?: (event: ProgressEvent) => void,
    _onError?: (error: unknown) => void,
  ): unknown {
    return undefined;
  }

  /**
   * Loads a file, as `load` does, as a promise
   * @param url - The file
   * @param onProgress - Called as it downloads
   * @returns The result
   */
  public loadAsync(url: TUrl, onProgress?: (event: ProgressEvent) => void): Promise<TData> {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, onProgress, reject);
    });
  }

  /**
   * Reads data already in memory; the base does nothing
   * @param _data - The data
   */
  public parse(_data: unknown, ..._rest: unknown[]): unknown {
    return undefined;
  }

  /**
   * Sets `crossOrigin`
   * @param crossOrigin - The `crossOrigin` of image requests
   * @returns This loader
   */
  public setCrossOrigin(crossOrigin: string): this {
    this.crossOrigin = crossOrigin;
    return this;
  }

  /**
   * Sets `withCredentials`
   * @param value - Whether requests send cookies
   * @returns This loader
   */
  public setWithCredentials(value: boolean): this {
    this.withCredentials = value;
    return this;
  }

  /**
   * Sets `path`
   * @param path - Put in front of every URL
   * @returns This loader
   */
  public setPath(path: string): this {
    this.path = path;
    return this;
  }

  /**
   * Sets `resourcePath`
   * @param resourcePath - Where a file's own files load from
   * @returns This loader
   */
  public setResourcePath(resourcePath: string): this {
    this.resourcePath = resourcePath;
    return this;
  }

  /**
   * Sets `requestHeader`
   * @param requestHeader - Headers every request sends
   * @returns This loader
   */
  public setRequestHeader(requestHeader: Record<string, string>): this {
    this.requestHeader = requestHeader;
    return this;
  }

  /**
   * Stops requests in flight; the base has none
   * @returns This loader
   */
  public abort(): this {
    return this;
  }
}

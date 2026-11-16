import { setDracoDecoderPath } from '@pixi/3d';

import { Loader } from '../../loaders/Loader';

/**
 * three's `DRACOLoader`, as `GLTFLoader.setDRACOLoader` takes it: where the Draco decoder loads from
 *
 * pixi-3d decodes a glTF file's Draco meshes itself, on a worker, with Google's decoder.
 * `setDecoderPath` points it at a folder holding `draco_wasm_wrapper.js` and `draco_decoder.wasm`,
 * as three's does; without one pixi-3d fetches them from gstatic.com. It loads no `.drc` files of its
 * own: `load` and `parse` report an error.
 * @example
 * ```ts
 * const draco = new DRACOLoader().setDecoderPath('/draco/');
 * const loader = new GLTFLoader().setDRACOLoader(draco);
 * ```
 * @category catalog
 * @advanced
 */
export class DRACOLoader extends Loader<never> {
  /** The folder the decoder loads from */
  public decoderPath: string = '';
  /** three's decoder settings; kept, as pixi-3d always uses the WebAssembly decoder */
  public decoderConfig: Record<string, unknown> = {};

  /**
   * Sets the folder the decoder loads from
   * @param path - A folder holding `draco_wasm_wrapper.js` and `draco_decoder.wasm`
   * @returns This loader
   */
  public setDecoderPath(path: string): this {
    this.decoderPath = path;
    return this;
  }

  /**
   * Sets three's decoder settings, which are kept
   * @param config - The settings
   * @returns This loader
   */
  public setDecoderConfig(config: Record<string, unknown>): this {
    this.decoderConfig = config;
    return this;
  }

  /**
   * Sets three's worker count; pixi-3d runs its own worker
   * @param _workerLimit - The count
   * @returns This loader
   */
  public setWorkerLimit(_workerLimit: number): this {
    return this;
  }

  /** Nothing to load ahead: pixi-3d loads the decoder the first time a file needs it */
  public preload(): this {
    return this;
  }

  /** Nothing to free: pixi-3d keeps its decoder for the page */
  public dispose(): this {
    return this;
  }

  /**
   * Points pixi-3d's Draco decoder at `decoderPath`, when one is set; `GLTFLoader` calls it before
   * each parse
   * @internal
   */
  public applyDecoderPath(): void {
    if (!this.decoderPath) return;

    setDracoDecoderPath({
      jsUrl: `${this.decoderPath}draco_wasm_wrapper.js`,
      wasmUrl: `${this.decoderPath}draco_decoder.wasm`,
    });
  }

  /**
   * Not supported: Draco meshes load inside a glTF file only
   * @param url - The file
   * @param _onLoad - Not called
   * @param _onProgress - Not called
   * @param onError - Called with the error
   */
  public override load(
    url: string,
    _onLoad?: (data: never) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    onError?.(new Error(`DRACOLoader: loading "${url}" on its own isn't supported; load the glTF file that holds it`));
  }
}

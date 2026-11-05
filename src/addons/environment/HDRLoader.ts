import { BufferImageSource, Texture } from 'pixi.js';

import { EquirectangularReflectionMapping, HalfFloatType } from '../../catalog/constants';
import type { EnvironmentTexture } from '../../environment/environmentTexture';
import { parseRGBE } from '../../environment/hdr/parseRGBE';
import type { RGBEImage } from '../../environment/hdr/parseRGBE';

/**
 * three's `HDRLoader`: loads a Radiance `.hdr` image as a half-float pixi texture of linear radiance
 *
 * The texture's `colorSpace` is `'srgb-linear'` and its `mapping` `EquirectangularReflectionMapping`,
 * so `scene.environment = texture` lights a scene with it and `scene.background = texture` draws it,
 * as in three. The file is decoded on the CPU, as three's is. `setDataType` is kept for three's shape:
 * the texels are always half floats.
 * @example
 * ```tsx
 * import { useLoader } from 'react-pixi-fiber';
 * import { HDRLoader } from 'react-pixi-fiber/addons';
 *
 * const sky = useLoader(HDRLoader, '/sky.hdr');
 * ```
 * @category catalog
 * @standard
 */
export class HDRLoader {
  /** Prefixed to every URL @default '' */
  public path = '';
  /** three's texel type; always `HalfFloatType` here */
  public type: number = HalfFloatType;

  /**
   * Sets the prefix of every URL
   * @param path - The prefix
   * @returns This loader
   */
  public setPath(path: string): this {
    this.path = path;
    return this;
  }

  /**
   * Kept for three's shape; the texels are always half floats
   * @param _type - three's `HalfFloatType` or `FloatType`
   * @returns This loader
   */
  public setDataType(_type: number): this {
    return this;
  }

  /**
   * Decodes a file's bytes, three's `parse`
   * @param buffer - The `.hdr` file
   * @returns The image: its size, half-float texels, gamma and exposure
   */
  public parse(buffer: ArrayBuffer): RGBEImage {
    return parseRGBE(buffer);
  }

  /**
   * Loads and decodes an `.hdr` into a texture
   * @param url - Where the file is, after `path`
   * @returns The texture
   */
  public async loadAsync(url: string): Promise<EnvironmentTexture> {
    const response = await fetch(this.path + url);
    if (!response.ok) throw new Error(`HDRLoader: ${response.status} loading ${this.path + url}`);
    const { width, height, data } = this.parse(await response.arrayBuffer());
    const texture: EnvironmentTexture = new Texture({
      source: new BufferImageSource({ resource: data, width, height, format: 'rgba16float', label: url }),
      label: url,
    });
    texture.colorSpace = 'srgb-linear';
    texture.mapping = EquirectangularReflectionMapping;
    return texture;
  }

  /**
   * Loads an `.hdr` with three's callback signature
   * @param url - Where the file is, after `path`
   * @param onLoad - Called with the texture
   * @param _onProgress - Not called
   * @param onError - Called when the load or the decoding fails
   */
  public load(
    url: string,
    onLoad?: (texture: EnvironmentTexture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    void this.loadAsync(url).then(onLoad, onError);
  }
}

/**
 * three's older name for {@link HDRLoader}
 * @category catalog
 * @advanced
 */
export class RGBELoader extends HDRLoader {}

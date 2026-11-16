import { BufferImageSource, Texture } from 'pixi.js';

import { EquirectangularReflectionMapping, HalfFloatType } from '../../catalog/constants';
import type { EnvironmentTexture } from '../../environment/environmentTexture';
import { parseRGBE } from '../../environment/hdr/parseRGBE';
import type { RGBEImage } from '../../environment/hdr/parseRGBE';
import { FileLoader } from '../../loaders/FileLoader';
import { Loader } from '../../loaders/Loader';

/**
 * three's `HDRLoader`: loads a Radiance `.hdr` image as a half-float pixi texture of linear radiance
 *
 * The texture's `colorSpace` is `'srgb-linear'` and its `mapping` `EquirectangularReflectionMapping`,
 * so `scene.environment = texture` lights a scene with it and `scene.background = texture` draws it,
 * as in three. The file is decoded on the CPU, as three's is. `setDataType` is kept for three's shape:
 * the texels are always half floats.
 * @example
 * ```tsx
 * import { useLoader } from '@react-fiber/threejs-compat';
 * import { HDRLoader } from '@react-fiber/threejs-compat/addons';
 *
 * const sky = useLoader(HDRLoader, '/sky.hdr');
 * ```
 * @category catalog
 * @standard
 */
export class HDRLoader extends Loader<EnvironmentTexture> {
  /** three's texel type; always `HalfFloatType` here */
  public type: number = HalfFloatType;

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
  public override parse(buffer: ArrayBuffer): RGBEImage {
    return parseRGBE(buffer);
  }

  /**
   * Loads and decodes an `.hdr` into a texture, through a `FileLoader` on this loader's manager, so
   * the manager's URL modifier and progress apply
   * @param url - Where the file is, after `path`
   * @param onLoad - Called with the texture
   * @param onProgress - Called as the file downloads
   * @param onError - Called when the load or the decoding fails
   */
  public override load(
    url: string,
    onLoad?: (texture: EnvironmentTexture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    new FileLoader(this.manager)
      .setResponseType('arraybuffer')
      .setRequestHeader(this.requestHeader)
      .setWithCredentials(this.withCredentials)
      .setPath(this.path)
      .load(
        url,
        (buffer) => {
          let texture: EnvironmentTexture;
          try {
            const { width, height, data } = this.parse(buffer as ArrayBuffer);
            texture = new Texture({
              source: new BufferImageSource({ resource: data, width, height, format: 'rgba16float', label: url }),
              label: url,
            });
          } catch (error) {
            onError?.(error);
            return;
          }
          texture.colorSpace = 'srgb-linear';
          texture.mapping = EquirectangularReflectionMapping;
          onLoad?.(texture);
        },
        onProgress,
        onError,
      );
  }
}

/**
 * three's older name for {@link HDRLoader}
 * @category catalog
 * @advanced
 */
export class RGBELoader extends HDRLoader {}

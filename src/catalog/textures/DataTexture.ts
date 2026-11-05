import { BufferImageSource } from 'pixi.js';
import type { TEXTURE_FORMATS } from 'pixi.js';

import {
  ClampToEdgeWrapping,
  FloatType,
  HalfFloatType,
  NearestFilter,
  NoColorSpace,
  RedFormat,
  RGFormat,
  RGBAFormat,
  UnsignedByteType,
} from '../constants';
import { Texture } from './Texture';

/**
 * Pixel data a {@link DataTexture} shows, as three's `image` holds it
 * @category catalog
 * @advanced
 */
export interface DataTextureImage {
  /** The pixels, row by row from the first row of the image */
  data: Uint8Array | Uint8ClampedArray | Uint16Array | Float32Array;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

const CHANNELS: Record<number, string> = { [RGBAFormat]: 'rgba', [RGFormat]: 'rg', [RedFormat]: 'r' };
const TYPES: Record<number, string> = {
  [UnsignedByteType]: '8unorm',
  [HalfFloatType]: '16float',
  [FloatType]: '32float',
};

/** pixi's GPU format for three's format and type */
function pixiFormat(format: number, type: number): TEXTURE_FORMATS {
  return `${CHANNELS[format] ?? 'rgba'}${TYPES[type] ?? '8unorm'}` as TEXTURE_FORMATS;
}

/**
 * three's `DataTexture`: a texture made from pixel data, over a pixi `BufferImageSource`
 *
 * As in three, it starts with nearest filtering, no mipmaps and `flipY` off, so the first row of
 * `data` is the bottom of a plane. `RGBAFormat`, `RGFormat` and `RedFormat` map to pixi's formats, with
 * `UnsignedByteType`, `HalfFloatType` or `FloatType` channels. Change `image.data` and set
 * `needsUpdate` to upload it again.
 * @example
 * ```ts
 * const data = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
 * const texture = new DataTexture(data, 2, 2);
 * texture.needsUpdate = true;
 * ```
 * @category catalog
 * @standard
 */
export class DataTexture extends Texture {
  /** Always `true`, as on three's `DataTexture` */
  public readonly isDataTexture = true;
  private readonly _pixels: DataTextureImage;

  /**
   * @param data - The pixels, row by row
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param format - `RGBAFormat`, `RGFormat` or `RedFormat`
   * @param type - `UnsignedByteType`, `HalfFloatType` or `FloatType`
   * @param mapping - How the image maps onto a surface
   * @param wrapS - How it wraps across
   * @param wrapT - How it wraps up and down
   * @param magFilter - How it is sampled when magnified
   * @param minFilter - How it is sampled when minified
   * @param anisotropy - Samples taken along a slanted surface
   * @param colorSpace - `SRGBColorSpace` for colour, `NoColorSpace` for data
   */
  constructor(
    data: DataTextureImage['data'] | null = null,
    width: number = 1,
    height: number = 1,
    format: number = RGBAFormat,
    type: number = UnsignedByteType,
    mapping?: number,
    wrapS: number = ClampToEdgeWrapping,
    wrapT: number = ClampToEdgeWrapping,
    magFilter: number = NearestFilter,
    minFilter: number = NearestFilter,
    anisotropy?: number,
    colorSpace: string = NoColorSpace,
  ) {
    const pixels = data ?? new Uint8Array(width * height * 4);

    super(
      new BufferImageSource({ resource: pixels, width, height, format: pixiFormat(format, type) }),
      mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format,
      type,
      anisotropy,
      colorSpace,
    );
    this._pixels = { data: pixels, width, height };
    this.generateMipmaps = false;
    this.flipY = false;
    this.unpackAlignment = 1;
  }

  /** The pixel data and its size; change `data` in place, or replace it, then set `needsUpdate` */
  public override get image(): DataTextureImage {
    return this._pixels;
  }

  public override set image(value: DataTextureImage) {
    Object.assign(this._pixels, value);
  }

  /** Set to `true` after changing `image`, so it uploads again */
  public override set needsUpdate(value: boolean) {
    if (value) {
      this.source.resource = this._pixels.data;
      this.source.resize(this._pixels.width, this._pixels.height);
    }
    super.needsUpdate = value;
  }
}

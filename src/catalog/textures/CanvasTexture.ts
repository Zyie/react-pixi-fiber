import type { ICanvas } from 'pixi.js';

import { Texture } from './Texture';

/**
 * three's `CanvasTexture`: a texture showing a canvas
 *
 * It uploads the canvas when made; draw on the canvas and set `needsUpdate` to upload it again.
 * @example
 * ```ts
 * const canvas = document.createElement('canvas');
 * canvas.getContext('2d')!.fillRect(0, 0, 64, 64);
 * const texture = new CanvasTexture(canvas);
 * ```
 * @category catalog
 * @standard
 */
export class CanvasTexture extends Texture {
  /** Always `true`, as on three's `CanvasTexture` */
  public readonly isCanvasTexture = true;

  /**
   * @param canvas - The canvas to show
   * @param mapping - How the image maps onto a surface
   * @param wrapS - How it wraps across
   * @param wrapT - How it wraps up and down
   * @param magFilter - How it is sampled when magnified
   * @param minFilter - How it is sampled when minified
   * @param format - The pixel format
   * @param type - The type of each channel
   * @param anisotropy - Samples taken along a slanted surface
   */
  constructor(
    canvas?: HTMLCanvasElement | OffscreenCanvas | ICanvas,
    mapping?: number,
    wrapS?: number,
    wrapT?: number,
    magFilter?: number,
    minFilter?: number,
    format?: number,
    type?: number,
    anisotropy?: number,
  ) {
    super(canvas, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
    this.needsUpdate = true;
  }
}

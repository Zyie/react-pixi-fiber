import { CubeTexture as PixiCubeTexture, CubeTextureSource, ImageSource } from 'pixi.js';
import type { CubeTextureFaces, ImageResource, TextureSource } from 'pixi.js';

import { MathUtils } from '../../math/MathUtils';
import { CubeReflectionMapping, NoColorSpace, RGBAFormat, UnsignedByteType } from '../constants';

/**
 * pixi's face for each of three's images: three samples a cube texture with x negated, so the cube
 * pixi-3d samples as it stands is three's mirrored across x, its +x and -x images swapped
 */
const MIRRORED_FACES = ['left', 'right', 'top', 'bottom', 'front', 'back'] as const;

/** An image drawn mirrored left to right, onto a canvas the face uploads */
function mirrored(image: ImageResource): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const { width, height } = image as { width: number; height: number };
  const context = canvas.getContext('2d')!;

  canvas.width = width;
  canvas.height = height;
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(image as CanvasImageSource, 0, 0);

  return canvas;
}

/**
 * three's `CubeTexture` over a pixi `CubeTexture`: six images, one per side of a cube, for a skybox
 * or reflections
 *
 * The images go in three's order, +x, -x, +y, -y, +z, -z. three samples a cube texture with x
 * negated, so pixi gets each image mirrored, with +x and -x swapped, and draws the cube as three
 * does wherever pixi-3d takes a pixi `CubeTexture`, as a view's background or environment does.
 * @example
 * ```ts
 * const sky = await new CubeTextureLoader().setPath('/sky/').loadAsync(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
 * ```
 * @category catalog
 * @standard
 */
export class CubeTexture extends PixiCubeTexture {
  /** Always `true`, as on three's textures */
  public readonly isTexture = true;
  /** Always `true`, as on three's `CubeTexture` */
  public readonly isCubeTexture = true;
  /** A unique id, as three's */
  public readonly uuid: string = MathUtils.generateUUID();
  /** A name, for your own use */
  public name: string = '';
  /** Anything you want to keep with the texture */
  public userData: Record<string, unknown> = {};
  /** `CubeReflectionMapping` or `CubeRefractionMapping` */
  public mapping: number;
  /** `SRGBColorSpace` for colour images, as r3f sets on an environment map */
  public colorSpace: string;
  /** The pixel format, `RGBAFormat` */
  public format: number = RGBAFormat;
  /** The type of each channel, `UnsignedByteType` */
  public type: number = UnsignedByteType;
  /** `false`, as on three's `CubeTexture`; kept and inert */
  public flipY: boolean = false;
  /** Counts each `needsUpdate = true` */
  public version: number = 0;
  private readonly _images: ImageResource[];

  /**
   * @param images - Six images, +x, -x, +y, -y, +z, -z, all the same size
   * @param mapping - `CubeReflectionMapping` or `CubeRefractionMapping`
   * @param colorSpace - `SRGBColorSpace` for colour images
   */
  constructor(
    images: ImageResource[] = [],
    mapping: number = CubeReflectionMapping,
    colorSpace: string = NoColorSpace,
  ) {
    const blank = images.length === 6 ? undefined : document.createElement('canvas');
    const faces = {} as CubeTextureFaces<TextureSource>;

    MIRRORED_FACES.forEach((face, i) => {
      faces[face] = new ImageSource({ resource: images[i] ? mirrored(images[i]) : blank! });
    });
    super({ source: new CubeTextureSource({ faces }) });
    this._images = images;
    this.mapping = mapping;
    this.colorSpace = colorSpace;
  }

  /** The six images, +x, -x, +y, -y, +z, -z */
  public get images(): ImageResource[] {
    return this._images;
  }

  /** The six images, as `images`; three's `image` on a cube texture */
  public get image(): ImageResource[] {
    return this.images;
  }

  /** Set to `true` after drawing into the images, so they upload again */
  public set needsUpdate(value: boolean) {
    if (!value) return;
    this.version++;
    MIRRORED_FACES.forEach((face, i) => {
      const source = this.source.faces[face];

      source.resource = mirrored(this._images[i]);
      source.update();
    });
  }

  /** Frees the GPU copy and keeps the texture, as three's `dispose` */
  public dispose(): void {
    if (!this.destroyed) this.source.unload();
  }
}

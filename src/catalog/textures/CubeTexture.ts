import { CubeTexture as PixiCubeTexture, CubeTextureSource, ImageSource } from 'pixi.js';
import type { CubeTextureFaces, ImageResource, TextureSource } from 'pixi.js';

import { MathUtils } from '../../math/MathUtils';
import { CubeReflectionMapping, NoColorSpace, RGBAFormat, UnsignedByteType } from '../constants';

/** pixi's names for the faces, in three's order: +x, -x, +y, -y, +z, -z */
const FACES = ['right', 'left', 'top', 'bottom', 'front', 'back'] as const;

/**
 * three's `CubeTexture` over a pixi `CubeTexture`: six images, one per side of a cube, for a skybox
 * or reflections
 *
 * The images go in three's order, +x, -x, +y, -y, +z, -z, which are pixi's right, left, top, bottom,
 * front and back faces. Where pixi-3d takes a pixi `CubeTexture`, as a view's background or
 * environment does, it takes this.
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

    FACES.forEach((face, i) => {
      faces[face] = new ImageSource({ resource: images[i] ?? blank! });
    });
    super({ source: new CubeTextureSource({ faces }) });
    this.mapping = mapping;
    this.colorSpace = colorSpace;
  }

  /** The six images, +x, -x, +y, -y, +z, -z */
  public get images(): ImageResource[] {
    return FACES.map((face) => this.source.faces[face].resource as ImageResource);
  }

  /** The six images, as `images`; three's `image` on a cube texture */
  public get image(): ImageResource[] {
    return this.images;
  }

  /** Set to `true` after drawing into the images, so they upload again */
  public set needsUpdate(value: boolean) {
    if (!value) return;
    this.version++;
    for (const face of FACES) this.source.faces[face].update();
  }

  /** Frees the GPU copy and keeps the texture, as three's `dispose` */
  public dispose(): void {
    if (!this.destroyed) this.source.unload();
  }
}

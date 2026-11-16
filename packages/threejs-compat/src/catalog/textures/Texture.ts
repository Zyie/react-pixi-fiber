import type { BaseMaterial3D } from '@pixi/3d';
import { ImageSource, Texture as PixiTexture, TextureSource } from 'pixi.js';
import type { ImageResource, Matrix, SCALE_MODE, WRAP_MODE } from 'pixi.js';

import { EventDispatcher } from '../../animation/EventDispatcher';
import type { DispatchedEvent, EventListener } from '../../animation/EventDispatcher';
import { MathUtils } from '../../math/MathUtils';
import { Matrix3 } from '../../math/Matrix3';
import { Vector2 } from '../../math/Vector2';
import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
  UVMapping,
} from '../constants';
import { textureTransformChanged } from './textureTransform';

const WRAP_MODES: Record<number, WRAP_MODE> = {
  [RepeatWrapping]: 'repeat',
  [ClampToEdgeWrapping]: 'clamp-to-edge',
  [MirroredRepeatWrapping]: 'mirror-repeat',
};

const NEAREST_FILTERS = new Set([NearestFilter, NearestMipmapNearestFilter, NearestMipmapLinearFilter]);
const NEAREST_MIPMAP_FILTERS = new Set([NearestMipmapNearestFilter, LinearMipmapNearestFilter]);
const MIPMAP_FILTERS = new Set([
  NearestMipmapNearestFilter,
  NearestMipmapLinearFilter,
  LinearMipmapNearestFilter,
  LinearMipmapLinearFilter,
]);

let blankCanvas: HTMLCanvasElement | undefined;

/** The image of a texture made with none: one transparent pixel, which uploads like any image */
function blankImage(): HTMLCanvasElement {
  if (!blankCanvas) {
    blankCanvas = document.createElement('canvas');
    blankCanvas.width = blankCanvas.height = 1;
  }

  return blankCanvas;
}

/**
 * A `Vector2` whose writes call back, so a texture hears `texture.offset.x += 0.1` as three's
 * renderer would on its next frame
 */
function observedVector2(x: number, y: number, onChange: () => void): Vector2 {
  const vector = new Vector2();
  let vx = x;
  let vy = y;

  Object.defineProperties(vector, {
    x: {
      enumerable: true,
      get: () => vx,
      set: (value: number) => {
        if (value === vx) return;
        vx = value;
        onChange();
      },
    },
    y: {
      enumerable: true,
      get: () => vy,
      set: (value: number) => {
        if (value === vy) return;
        vy = value;
        onChange();
      },
    },
  });

  return vector;
}

/**
 * What a three texture's image can be: anything pixi uploads as an image, or a pixi `TextureSource`
 * to wrap, such as the source of a texture pixi-3d loaded
 * @category catalog
 * @advanced
 */
export type TextureImage = ImageResource | TextureSource;

/**
 * three's `Texture` over a pixi `Texture`, so every pixi-3d material slot takes it as it is
 *
 * Each texture owns its pixi `TextureSource`, which holds the image and how it is sampled. three's
 * sampling fields write that source's style: `wrapS` and `wrapT` (`RepeatWrapping`,
 * `ClampToEdgeWrapping`, `MirroredRepeatWrapping`), `magFilter`, `minFilter`, `anisotropy` and
 * `generateMipmaps`, which together say whether pixi builds mipmaps, as three's renderer does.
 *
 * `offset`, `repeat`, `rotation`, `center` and `flipY` reach the material through its `uvTransform`.
 * pixi-3d has one UV transform per material, so the material's `map` sets it, or its first texture
 * when it has no map; three gives each map its own. A texture that is in no material carries them
 * until one takes it, and a change shows at once, as `texture.offset.x += delta` does in three.
 *
 * `colorSpace` is kept, as r3f sets it on colour maps. pixi-3d decodes a material's colour slots
 * from sRGB and reads its data maps as linear whatever the texture says, which is what three does for
 * an sRGB colour map and a linear data map. `dispose()` frees the GPU copy and keeps the texture
 * usable, as three's does; pixi's `destroy()` ends it for good. `source` is pixi's `TextureSource`,
 * where three's is an object holding the image: read `image` instead.
 * @example
 * ```tsx
 * const texture = useLoader(TextureLoader, '/tiles.png');
 * texture.wrapS = texture.wrapT = RepeatWrapping;
 * texture.repeat.set(4, 4);
 *
 * return <meshStandardMaterial map={texture} />;
 * ```
 * @category catalog
 * @standard
 */
export class Texture extends PixiTexture {
  /** The image a texture made with none starts with; `null`, a transparent pixel, as in three */
  public static DEFAULT_IMAGE: TextureImage | null = null;
  /** The mapping a texture starts with, `UVMapping` */
  public static DEFAULT_MAPPING: number = UVMapping;
  /** The anisotropy a texture starts with, 1 */
  public static DEFAULT_ANISOTROPY: number = 1;

  /** Always `true`, as on three's `Texture` */
  public readonly isTexture = true;
  /** A unique id, as three's */
  public readonly uuid: string = MathUtils.generateUUID();
  /** A name, for your own use */
  public name: string = '';
  /** Anything you want to keep with the texture */
  public userData: Record<string, unknown> = {};
  /** How the image maps onto a surface; `UVMapping` for a mesh's UVs */
  public mapping: number;
  /** The UV set the texture reads; pixi-3d reads the first, so it is kept and inert */
  public channel: number = 0;
  /** The pixel format, three's `RGBAFormat` for an image; kept for r3f's colour space check */
  public format: number;
  /** three's GPU format override; kept and inert */
  public internalFormat: string | null = null;
  /** The type of each channel, three's `UnsignedByteType` for an image */
  public type: number;
  /**
   * `SRGBColorSpace` for a colour map, `NoColorSpace` for data; r3f sets it on colour maps. pixi-3d
   * decodes colour slots from sRGB and reads data slots as linear whatever this says.
   */
  public colorSpace: string;
  /** three's upload flag; pixi uploads images premultiplied and pixi-3d undoes it, so it is kept and inert */
  public premultiplyAlpha: boolean = false;
  /** three's row alignment for data; kept and inert */
  public unpackAlignment: number = 4;
  /** Mipmaps you supply; kept and inert, as pixi builds its own when `generateMipmaps` is on */
  public mipmaps: unknown[] = [];
  /** Counts each `needsUpdate = true` */
  public version: number = 0;
  /** Called after each `needsUpdate = true` */
  public onUpdate: ((texture: this) => void) | null = null;
  /**
   * Whether `matrix` is worked out from `offset`, `repeat`, `rotation` and `center` @default true
   */
  public matrixAutoUpdate: boolean = true;
  /** The UV transform, worked out from `offset`, `repeat`, `rotation` and `center` while `matrixAutoUpdate` is on */
  public readonly matrix: Matrix3 = new Matrix3();
  /** How far the image is moved across the surface, in UV units */
  public readonly offset: Vector2;
  /** How many times the image repeats across the surface; set `wrapS` and `wrapT` to repeat */
  public readonly repeat: Vector2;
  /** The point `rotation` turns around, in UV units; (0.5, 0.5) is the middle */
  public readonly center: Vector2;

  /**
   * The materials that hold this texture
   * @internal
   */
  public readonly _users: Set<BaseMaterial3D> = new Set();
  /**
   * Whether this texture is for a loaded glTF mesh, whose UVs pixi-3d keeps as glTF has them;
   * the catalog's geometries give three's UVs upside down
   * @internal
   */
  public _gltfUvs: boolean = false;
  /** @internal */
  public readonly _isThreeTexture = true;

  private _image: unknown = undefined;
  private _rotation: number = 0;
  private _flipY: boolean = true;
  private _wrapS: number = ClampToEdgeWrapping;
  private _wrapT: number = ClampToEdgeWrapping;
  private _magFilter: number = LinearFilter;
  private _minFilter: number = LinearMipmapLinearFilter;
  private _generateMipmaps: boolean = true;
  private _dispatcher?: EventDispatcher;
  private readonly _onTransformChange = (): void => textureTransformChanged(this);

  /**
   * @param image - The image, canvas, video or bitmap to show, or a pixi `TextureSource` to wrap
   * @param mapping - How the image maps onto a surface
   * @param wrapS - How it wraps across
   * @param wrapT - How it wraps up and down
   * @param magFilter - How it is sampled when magnified
   * @param minFilter - How it is sampled when minified
   * @param format - The pixel format
   * @param type - The type of each channel
   * @param anisotropy - Samples taken along a slanted surface, 1 for none
   * @param colorSpace - `SRGBColorSpace` for a colour map, `NoColorSpace` for data
   */
  constructor(
    image: TextureImage | null = Texture.DEFAULT_IMAGE,
    mapping: number = Texture.DEFAULT_MAPPING,
    wrapS: number = ClampToEdgeWrapping,
    wrapT: number = ClampToEdgeWrapping,
    magFilter: number = LinearFilter,
    minFilter: number = LinearMipmapLinearFilter,
    format: number = RGBAFormat,
    type: number = UnsignedByteType,
    anisotropy: number = Texture.DEFAULT_ANISOTROPY,
    colorSpace: string = NoColorSpace,
  ) {
    super({ source: image instanceof TextureSource ? image : new ImageSource({ resource: image ?? blankImage() }) });

    this.mapping = mapping;
    this.format = format;
    this.type = type;
    this.colorSpace = colorSpace;
    this.offset = observedVector2(0, 0, this._onTransformChange);
    this.repeat = observedVector2(1, 1, this._onTransformChange);
    this.center = observedVector2(0, 0, this._onTransformChange);
    this._wrapS = wrapS;
    this._wrapT = wrapT;
    this._magFilter = magFilter;
    this._minFilter = minFilter;
    this.source.style.maxAnisotropy = anisotropy;
    this._applySampling();
  }

  /** A number for this texture, pixi's `uid` */
  public get id(): number {
    return this.uid;
  }

  /** The image, canvas, video or bitmap the texture shows; set `needsUpdate` after replacing it */
  public get image(): unknown {
    return this._image ?? this.source.resource;
  }

  public set image(value: unknown) {
    this._image = value;
    this.source.resource = value;
  }

  /** Rotation of the image around `center`, in radians */
  public get rotation(): number {
    return this._rotation;
  }

  public set rotation(value: number) {
    if (value === this._rotation) return;
    this._rotation = value;
    this._onTransformChange();
  }

  /**
   * Whether the image is flipped upside down to match three's UVs, as three's upload does; `true` for
   * an image, `false` for data and glTF textures
   */
  public get flipY(): boolean {
    return this._flipY;
  }

  public set flipY(value: boolean) {
    if (value === this._flipY) return;
    this._flipY = value;
    this._onTransformChange();
  }

  /** How the image wraps across: `ClampToEdgeWrapping`, `RepeatWrapping` or `MirroredRepeatWrapping` */
  public get wrapS(): number {
    return this._wrapS;
  }

  public set wrapS(value: number) {
    this._wrapS = value;
    this._applySampling();
  }

  /** How the image wraps up and down: `ClampToEdgeWrapping`, `RepeatWrapping` or `MirroredRepeatWrapping` */
  public get wrapT(): number {
    return this._wrapT;
  }

  public set wrapT(value: number) {
    this._wrapT = value;
    this._applySampling();
  }

  /** How the image is sampled when magnified: `LinearFilter` or `NearestFilter` */
  public get magFilter(): number {
    return this._magFilter;
  }

  public set magFilter(value: number) {
    this._magFilter = value;
    this._applySampling();
  }

  /** How the image is sampled when minified, with or without mipmaps */
  public get minFilter(): number {
    return this._minFilter;
  }

  public set minFilter(value: number) {
    this._minFilter = value;
    this._applySampling();
  }

  /** Samples taken along a slanted surface, 1 for none; pixi's `maxAnisotropy` */
  public get anisotropy(): number {
    return this.source.style.maxAnisotropy;
  }

  public set anisotropy(value: number) {
    this.source.style.maxAnisotropy = value;
    this._applySampling();
  }

  /** Whether mipmaps are built, when `minFilter` reads them @default true */
  public get generateMipmaps(): boolean {
    return this._generateMipmaps;
  }

  public set generateMipmaps(value: boolean) {
    this._generateMipmaps = value;
    this._applySampling();
  }

  /** Set to `true` after changing the image, so it uploads again */
  public set needsUpdate(value: boolean) {
    if (!value) return;
    this.version++;
    this.source.update();
    this._onTransformChange();
    this.onUpdate?.(this);
  }

  /** Works out `matrix` from `offset`, `repeat`, `rotation` and `center` */
  public updateMatrix(): void {
    this.matrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this._rotation,
      this.center.x,
      this.center.y,
    );
  }

  /**
   * Moves a UV through the texture's transform and wrapping, as three's `transformUv`
   * @param uv - The UV, changed in place
   * @returns The same UV
   */
  public transformUv(uv: Vector2): Vector2 {
    if (this.mapping !== UVMapping) return uv;

    uv.applyMatrix3(this.matrix);

    const wrap = (value: number, mode: number): number => {
      if (mode === RepeatWrapping) return value - Math.floor(value);
      if (mode === ClampToEdgeWrapping) return value < 0 ? 0 : value > 1 ? 1 : value;
      const period = Math.abs(value) % 2;

      return period > 1 ? 2 - period : period;
    };

    uv.x = wrap(uv.x, this._wrapS);
    uv.y = wrap(uv.y, this._wrapT);
    if (this._flipY) uv.y = 1 - uv.y;

    return uv;
  }

  /**
   * Copies another texture's settings and shares its image, as three's `copy`; this texture keeps
   * its own pixi source, so its sampling stays its own
   * @param source - The texture to copy
   * @returns This texture
   */
  public copy(source: Texture): this {
    this.name = source.name;
    this._image = source._image;
    this.source.resource = source.source.resource;
    this.source.update();
    this.mapping = source.mapping;
    this.channel = source.channel;
    this.format = source.format;
    this.internalFormat = source.internalFormat;
    this.type = source.type;
    this.colorSpace = source.colorSpace;
    this.premultiplyAlpha = source.premultiplyAlpha;
    this.unpackAlignment = source.unpackAlignment;
    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrix.copy(source.matrix);
    this._wrapS = source._wrapS;
    this._wrapT = source._wrapT;
    this._magFilter = source._magFilter;
    this._minFilter = source._minFilter;
    this._generateMipmaps = source._generateMipmaps;
    this._gltfUvs = source._gltfUvs;
    this.source.style.maxAnisotropy = source.anisotropy;
    this._applySampling();
    this.offset.copy(source.offset);
    this.repeat.copy(source.repeat);
    this.center.copy(source.center);
    this._rotation = source._rotation;
    this._flipY = source._flipY;
    this.userData = structuredClone(source.userData);
    this._onTransformChange();

    return this;
  }

  /** A new texture with this one's settings and image, as three's `clone` */
  public clone(): Texture {
    return new (this.constructor as typeof Texture)().copy(this);
  }

  /**
   * Frees the texture's GPU copy and keeps the texture, which uploads again the next time it draws,
   * as three's `dispose` does; fires a `dispose` event
   */
  public dispose(): void {
    if (this.destroyed) return;
    this.source.unload();
    this.dispatchEvent({ type: 'dispose' });
  }

  /**
   * Calls a listener on a three event of this texture, such as `dispose`
   * @param type - The event's name
   * @param listener - The function to call
   */
  public addEventListener(type: string, listener: EventListener): void {
    (this._dispatcher ??= new EventDispatcher()).addEventListener(type, listener);
  }

  /**
   * Whether a listener is added for a three event
   * @param type - The event's name
   * @param listener - The function
   */
  public hasEventListener(type: string, listener: EventListener): boolean {
    return this._dispatcher?.hasEventListener(type, listener) ?? false;
  }

  /**
   * Stops calling a listener on a three event
   * @param type - The event's name
   * @param listener - The function
   */
  public removeEventListener(type: string, listener: EventListener): void {
    this._dispatcher?.removeEventListener(type, listener);
  }

  /**
   * Sends a three event to its listeners
   * @param event - The event, with its `type`
   */
  public dispatchEvent(event: DispatchedEvent): void {
    this._dispatcher?.dispatchEvent(event);
  }

  /**
   * Writes the UV transform pixi-3d needs to show this texture as three would: three's `matrix`, with
   * `flipY` folded in for the UVs it is drawn with
   * @param out - Receives the transform, as `BaseMaterial3D.uvTransform` takes it
   * @returns Whether the transform is the identity
   * @internal
   */
  public _writeUvTransform(out: Matrix): boolean {
    if (this.matrixAutoUpdate) this.updateMatrix();

    const e = this.matrix.elements;
    const a = e[0];
    let b = e[3];
    let tx = e[6];
    let c = e[1];
    let d = e[4];
    let ty = e[7];

    if (!this._gltfUvs) {
      tx += b;
      ty += d;
      b = -b;
      d = -d;
    }
    if (this._flipY) {
      c = -c;
      d = -d;
      ty = 1 - ty;
    }

    out.set(a, b, c, d, tx, ty);

    return a === 1 && b === 0 && c === 0 && d === 1 && tx === 0 && ty === 0;
  }

  /**
   * Writes wrapping, filtering and mipmapping onto the pixi source, and makes it upload again when
   * mipmapping changes, since pixi sets a texture's mip levels when it first uploads it
   */
  private _applySampling(): void {
    const source = this.source;
    const style = source.style;
    const mipmaps = this._generateMipmaps && MIPMAP_FILTERS.has(this._minFilter);

    style.addressModeU = WRAP_MODES[this._wrapS] ?? 'clamp-to-edge';
    style.addressModeV = WRAP_MODES[this._wrapT] ?? 'clamp-to-edge';
    if (style.maxAnisotropy <= 1) {
      style.magFilter = (this._magFilter === NearestFilter ? 'nearest' : 'linear') as SCALE_MODE;
      style.minFilter = (NEAREST_FILTERS.has(this._minFilter) ? 'nearest' : 'linear') as SCALE_MODE;
      style.mipmapFilter = (NEAREST_MIPMAP_FILTERS.has(this._minFilter) ? 'nearest' : 'linear') as SCALE_MODE;
    }

    if (source.autoGenerateMipmaps !== mipmaps) {
      source.autoGenerateMipmaps = mipmaps;
      if (!mipmaps) source.mipLevelCount = 1;
      source.unload();
    }
  }
}

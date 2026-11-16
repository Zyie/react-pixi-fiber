import { RenderTexture } from 'pixi.js';
import type { SCALE_MODE, TEXTURE_FORMATS } from 'pixi.js';

import { EventDispatcher } from '../animation/EventDispatcher';
import { FloatType, HalfFloatType, NearestFilter } from '../catalog/constants';
import { Vector4 } from '../math/Vector4';

/**
 * three's render target options, as `useRenderTarget` and `new WebGLRenderTarget(w, h, options)` take them
 * @category catalog
 * @standard
 */
export interface RenderTargetOptions {
  /** Keep a depth buffer; pixi-3d always gives a drawn scene one @default true */
  depthBuffer?: boolean;
  /** Keep a stencil buffer @default false */
  stencilBuffer?: boolean;
  /** Multisample the colour: any count above 0 turns pixi's antialiasing on @default 0 */
  samples?: number;
  /** three's texture type: `HalfFloatType` and `FloatType` store floats, anything else 8 bits per channel @default UnsignedByteType */
  type?: number;
  /** Kept for three's shape: the texture is always RGBA @default RGBAFormat */
  format?: number;
  /** `NearestFilter` samples the nearest texel; anything else filters linearly @default LinearFilter */
  magFilter?: number;
  /** Kept for three's shape; `magFilter` decides the filter @default LinearFilter */
  minFilter?: number;
  /** Build mipmaps after each render into the target @default false */
  generateMipmaps?: boolean;
  /** Kept for three's shape: a target always has one texture @default 1 */
  count?: number;
  /** Kept for three's shape: pixi-3d stores a target's picture in sRGB @default '' */
  colorSpace?: string;
}

/**
 * What a texture format of three's `type` stores in pixi. 8 bits per channel is pixi's own default,
 * `bgra8unorm`, which WebGL2 stores as `RGBA8`: pixi hands WebGL `rgba8unorm` as the unsized `RGBA`,
 * which a multisampled renderbuffer can't take, so a target with `samples` would draw nothing.
 * @param type - three's texture type constant
 */
const formatOf = (type: number | undefined): TEXTURE_FORMATS =>
  type === HalfFloatType ? 'rgba16float' : type === FloatType ? 'rgba32float' : 'bgra8unorm';

/**
 * three's `RenderTarget`: a texture a renderer draws a scene into, to use as a map, a portal or a
 * post effect
 *
 * `texture` is a pixi `RenderTexture`, so it goes wherever a texture does: `map={target.texture}`.
 * Draw into it with `renderer.setRenderTarget(target)` and `renderer.render(scene, camera)`, as in
 * three. `viewport`, `scissor` and `scissorTest` are the target's own, in its pixels from the
 * bottom-left corner, as in three.
 *
 * Unlike three's, the picture is stored as pixi-3d draws it to the screen, encoded for display
 * without tone mapping, and the materials decode it again when they sample it; three stores linear
 * values. `readRenderTargetPixels` hands back three's linear values. `dispose()` destroys the
 * texture for good, where three's lets a target be drawn into again.
 * @example
 * ```tsx
 * const target = useMemo(() => new WebGLRenderTarget(512, 512), []);
 * useEffect(() => () => target.dispose(), [target]);
 * ```
 * @category catalog
 * @standard
 */
export class RenderTarget extends EventDispatcher {
  /** Always `true`; three's flag for render targets */
  public readonly isRenderTarget = true;
  /** Width in pixels */
  public width: number = 1;
  /** Height in pixels */
  public height: number = 1;
  /** Layers: 1 for a 2D target */
  public depth: number = 1;
  /** The rect drawn into, in the target's pixels from its bottom-left corner */
  public readonly viewport: Vector4;
  /** The rect `scissorTest` limits clears to, in the target's pixels from its bottom-left corner */
  public readonly scissor: Vector4;
  /** Limit clears to `scissor` @default false */
  public scissorTest = false;
  /** Whether the target keeps a depth buffer */
  public depthBuffer: boolean;
  /** Whether the target keeps a stencil buffer */
  public stencilBuffer: boolean;
  /** Multisample count; above 0, pixi antialiases the target */
  public samples: number;
  /** The texture drawn into: a pixi `RenderTexture` */
  public texture: RenderTexture;
  /** Kept for three's shape: depth is the drawn scene's own */
  public depthTexture: null = null;
  /**
   * How many times a renderer has drawn into the target, so what reads its texture can tell a new picture
   * @internal
   */
  public _renderCount: number = 0;

  private _disposed = false;

  /**
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param options - three's render target options
   */
  constructor(width = 1, height = 1, options: RenderTargetOptions = {}) {
    super();
    this.width = width;
    this.height = height;
    this.viewport = new Vector4(0, 0, width, height);
    this.scissor = new Vector4(0, 0, width, height);
    this.depthBuffer = options.depthBuffer ?? true;
    this.stencilBuffer = options.stencilBuffer ?? false;
    this.samples = options.samples ?? 0;
    this.texture = this._createTexture(options);
  }

  /** Always `[texture]`: pixi-3d draws a scene into one texture */
  public get textures(): RenderTexture[] {
    return [this.texture];
  }

  /**
   * Resizes the target and resets its viewport and scissor to the whole of it, as three's does
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param depth - Layers; kept for three's shape
   */
  public setSize(width: number, height: number, depth = 1): void {
    if (this.width === width && this.height === height && this.depth === depth) return;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.texture.resize(width, height, 1);
    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
  }

  /** A new target of the same size and options, with its own texture */
  public clone(): this {
    const Target = this.constructor as new (width: number, height: number, options: RenderTargetOptions) => this;
    return new Target(this.width, this.height, this._options()).copy(this);
  }

  /**
   * Copies another target's viewport, scissor and buffer settings, resizing to it
   * @param source - The target to copy
   * @returns This target
   */
  public copy(source: RenderTarget): this {
    this.setSize(source.width, source.height, source.depth);
    this.viewport.copy(source.viewport);
    this.scissor.copy(source.scissor);
    this.scissorTest = source.scissorTest;
    this.depthBuffer = source.depthBuffer;
    this.stencilBuffer = source.stencilBuffer;
    return this;
  }

  /** Destroys the texture and tells listeners with a `dispose` event; three's `dispose`. Idempotent. */
  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this.dispatchEvent({ type: 'dispose' });
    this.texture.destroy(true);
  }

  /** Whether `dispose` has run */
  public get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Makes the texture this target draws into
   * @param options - three's options
   */
  protected _createTexture(options: RenderTargetOptions): RenderTexture {
    const scaleMode: SCALE_MODE = options.magFilter === NearestFilter ? 'nearest' : 'linear';
    return RenderTexture.create({
      width: this.width,
      height: this.height,
      resolution: 1,
      format: formatOf(options.type),
      antialias: this.samples > 0,
      autoGenerateMipmaps: options.generateMipmaps ?? false,
      scaleMode,
      label: 'RenderTarget',
    });
  }

  private _options(): RenderTargetOptions {
    const { format, autoGenerateMipmaps, scaleMode } = this.texture.source;
    return {
      depthBuffer: this.depthBuffer,
      stencilBuffer: this.stencilBuffer,
      samples: this.samples,
      type: format === 'rgba16float' ? HalfFloatType : format === 'rgba32float' ? FloatType : undefined,
      generateMipmaps: autoGenerateMipmaps,
      magFilter: scaleMode === 'nearest' ? NearestFilter : undefined,
    };
  }
}

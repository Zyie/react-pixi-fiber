import { CubeTexture, TextureSource } from 'pixi.js';
import type { CubeTextureSource } from 'pixi.js';

import { FloatType, HalfFloatType } from '../catalog/constants';
import { Vector4 } from '../math/Vector4';
import { EventDispatcher } from './EventDispatcher';
import type { RenderTargetOptions } from './RenderTarget';

/**
 * The cube texture a {@link WebGLCubeRenderTarget} draws into: a pixi `CubeTexture` that three's code
 * can tell from one loaded from images, whose faces three samples mirrored
 * @category catalog
 * @advanced
 */
export class RenderTargetCubeTexture extends CubeTexture {
  /** Always `true`, as on three's cube textures */
  public readonly isCubeTexture = true;
  /** Always `true`: drawn by a renderer, not loaded */
  public readonly isRenderTargetTexture = true;
  /**
   * How many faces a renderer has drawn, so an environment made from the texture can tell a new picture
   * @internal
   */
  public _version: number = 0;
}

/**
 * three's `WebGLCubeRenderTarget`: six square faces a {@link CubeCamera} draws the surroundings into,
 * for an environment map
 *
 * `texture` is a pixi `CubeTexture`, which `scene.environment` and `scene.background` take. Draw a face
 * with `renderer.setRenderTarget(target, face)`, as in three; `CubeCamera.update` draws all six.
 * r3f's `<Environment>` makes one through the support's `CubeRenderTarget` when it has children.
 * @example
 * ```ts
 * const target = new WebGLCubeRenderTarget(256, { type: HalfFloatType });
 * const camera = new CubeCamera(0.1, 100, target);
 * camera.update(renderer, scene);
 * scene.environment = target.texture;
 * ```
 * @category catalog
 * @advanced
 */
export class WebGLCubeRenderTarget extends EventDispatcher {
  /** Always `true`; three's flag for render targets */
  public readonly isRenderTarget = true;
  /** Always `true`; three's flag for cube render targets */
  public readonly isWebGLCubeRenderTarget = true;
  /** Width of each face in pixels */
  public width: number = 1;
  /** Height of each face in pixels, the same as the width */
  public height: number = 1;
  /** The rect drawn into, in a face's pixels from its bottom-left corner */
  public readonly viewport: Vector4;
  /** The rect `scissorTest` limits clears to */
  public readonly scissor: Vector4;
  /** Limit clears to `scissor` @default false */
  public scissorTest = false;
  /** The six faces, as a pixi `CubeTexture` */
  public texture: RenderTargetCubeTexture;

  private _disposed = false;

  /**
   * @param size - Width and height of each face in pixels
   * @param options - three's render target options; `type` picks 8-bit or float faces
   */
  constructor(size = 1, options: RenderTargetOptions = {}) {
    super();
    this.width = size;
    this.height = size;
    this.viewport = new Vector4(0, 0, size, size);
    this.scissor = new Vector4(0, 0, size, size);
    const source = new TextureSource({
      width: size,
      height: size,
      resolution: 1,
      viewDimension: 'cube',
      arrayLayerCount: 6,
      format:
        options.type === HalfFloatType ? 'rgba16float' : options.type === FloatType ? 'rgba32float' : 'rgba8unorm',
      label: 'WebGLCubeRenderTarget',
    }) as CubeTextureSource;
    this.texture = new RenderTargetCubeTexture({ source });
  }

  /**
   * Resizes every face
   * @param width - Width and height of each face in pixels
   */
  public setSize(width: number): void {
    if (width === this.width) return;
    this.width = width;
    this.height = width;
    this.texture.source.resize(width, width, 1);
    this.viewport.set(0, 0, width, width);
    this.scissor.set(0, 0, width, width);
  }

  /**
   * Clears every face, as three's does
   * @param renderer - The renderer to clear with
   * @param color - Clear the colour
   * @param depth - Clear depth
   * @param stencil - Clear stencil
   */
  public clear(
    renderer: {
      getRenderTarget(): unknown;
      setRenderTarget(target: WebGLCubeRenderTarget | null, face?: number): void;
      clear(color?: boolean, depth?: boolean, stencil?: boolean): void;
    },
    color = true,
    depth = true,
    stencil = true,
  ): void {
    const current = renderer.getRenderTarget() as WebGLCubeRenderTarget | null;
    for (let face = 0; face < 6; face++) {
      renderer.setRenderTarget(this, face);
      renderer.clear(color, depth, stencil);
    }
    renderer.setRenderTarget(current);
  }

  /** Destroys the faces and tells listeners with a `dispose` event; three's `dispose`. Idempotent. */
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
   * How many times a renderer has drawn into one of the faces, kept on the texture
   * @internal
   */
  public get _renderCount(): number {
    return this.texture._version;
  }

  public set _renderCount(count: number) {
    this.texture._version = count;
  }
}

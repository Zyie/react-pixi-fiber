import { Vector4 } from '@pixi/3d';
import { RenderTexture } from 'pixi.js';

import type { DrawableTarget } from '../renderer/renderTargets';

/**
 * The options of a {@link RootRenderTarget}
 * @category renderer
 * @advanced
 */
export interface RootRenderTargetOptions {
  /** Multisample the target, for smooth edges, when above 0 @default 0 */
  samples?: number;
  /** Generate mipmaps of the texture @default false */
  generateMipmaps?: boolean;
}

/**
 * The render target `useRenderTarget` and `<RenderTexture2D>` make while no package registers its own:
 * a pixi `RenderTexture` the renderer draws scenes into, with the size, viewport and scissor r3f's
 * renderer calls read. Its `texture` goes wherever a pixi texture does, such as a material's
 * `textures-baseColor`.
 * @category renderer
 * @advanced
 */
export class RootRenderTarget implements DrawableTarget {
  /** Always `true` */
  public readonly isRenderTarget = true;
  /** Width in pixels */
  public width: number = 1;
  /** Height in pixels */
  public height: number = 1;
  /** Where in the target a render draws, from its bottom-left corner */
  public readonly viewport: Vector4;
  /** The rect a render's clear and draw are clipped to while `scissorTest` is on, from the bottom left */
  public readonly scissor: Vector4;
  /** Whether renders are clipped to `scissor` */
  public scissorTest = false;
  /** The texture renders are drawn into */
  public readonly texture: RenderTexture;
  /** How many times the renderer has drawn into it @internal */
  public _renderCount: number = 0;

  private _disposed = false;
  private readonly _listeners = new Set<() => void>();

  /**
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param options - Multisampling and mipmaps
   */
  constructor(width = 1, height = 1, options: RootRenderTargetOptions = {}) {
    this.width = width;
    this.height = height;
    this.viewport = new Vector4(0, 0, width, height);
    this.scissor = new Vector4(0, 0, width, height);
    this.texture = RenderTexture.create({
      width,
      height,
      resolution: 1,
      antialias: (options.samples ?? 0) > 0,
      autoGenerateMipmaps: options.generateMipmaps ?? false,
      label: 'RootRenderTarget',
    });
  }

  /** Whether it has been disposed */
  public get disposed(): boolean {
    return this._disposed;
  }

  /**
   * Resizes the texture, and resets the viewport and scissor to the whole of it
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  public setSize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.texture.resize(width, height, 1);
    this.viewport.set(0, 0, width, height);
    this.scissor.set(0, 0, width, height);
  }

  /**
   * Calls back when the target is disposed, which is how the renderer frees what it made for it
   * @param _type - Always `'dispose'`
   * @param listener - What to call
   */
  public addEventListener(_type: 'dispose', listener: () => void): void {
    this._listeners.add(listener);
  }

  /**
   * Stops calling back on dispose
   * @param _type - Always `'dispose'`
   * @param listener - What was added
   */
  public removeEventListener(_type: 'dispose', listener: () => void): void {
    this._listeners.delete(listener);
  }

  /** Frees the texture, once, and tells the listeners */
  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const listener of this._listeners) listener();
    this._listeners.clear();
    this.texture.destroy(true);
  }
}

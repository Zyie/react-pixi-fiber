import { Camera3D } from '@pixi/3d';
import type { Matrix4 } from '@pixi/3d';
import { Container, CubeTexture, Graphics } from 'pixi.js';
import type { ColorSource, Texture, TextureSource } from 'pixi.js';

import type { Vector4 } from '../math/Vector4';

/**
 * What the renderer can draw into: a {@link RenderTarget} or a {@link WebGLCubeRenderTarget}
 * @internal
 */
export interface DrawableTarget {
  readonly isRenderTarget: true;
  readonly width: number;
  readonly height: number;
  readonly viewport: Vector4;
  readonly scissor: Vector4;
  readonly scissorTest: boolean;
  readonly texture: Texture | CubeTexture;
  readonly disposed: boolean;
  _renderCount: number;
}

/**
 * The pixi surface a target's picture goes to: the texture of a 2D target, the cube source of a cube one
 * @param target - The target
 * @internal
 */
export const surfaceOf = (target: DrawableTarget): Texture | TextureSource =>
  target.texture instanceof CubeTexture ? target.texture.source : target.texture;

/**
 * A rect in pixels from the top-left corner, as pixi places things
 * @internal
 */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Turns three's rect, from the bottom-left corner, into one from the top-left corner
 * @param rect - three's `(x, y, width, height)`
 * @param height - Height of the surface the rect is on
 * @param out - Receives the rect
 * @internal
 */
export function fromBottomLeft(rect: Vector4, height: number, out: PixelRect): PixelRect {
  out.x = rect.x;
  out.y = height - rect.y - rect.w;
  out.width = rect.z;
  out.height = rect.w;
  return out;
}

/**
 * Whether a rect covers the whole of a surface
 * @internal
 */
export const coversSurface = (rect: PixelRect, width: number, height: number): boolean =>
  rect.x <= 0 && rect.y <= 0 && rect.x + rect.width >= width && rect.y + rect.height >= height;

/**
 * The camera a view draws from when it can't draw from the camera it was given: one outside its
 * scene, or one whose aspect differs from the rect it fills. It projects with the given camera's
 * `aspect`, as three's cameras do, where pixi-3d's take the rect's.
 * @internal
 */
export class ProxyCamera extends Camera3D {
  /** Width over height to project with, or `null` for the rect's */
  public aspect: number | null = null;

  /**
   * Writes the projection for this camera's `aspect` when it has one, else for the rect's
   * @param aspect - The rect's width over height
   * @param out - Receives the projection
   */
  public override computeProjection(aspect: number, out: Matrix4): Matrix4 {
    return super.computeProjection(this.aspect ?? aspect, out);
  }
}

/**
 * Two rects drawn before a scene to clear part of what it draws into, for three's scissored clears:
 * one that erases what is there, then one in the clear colour. pixi clears a whole surface or nothing.
 * @internal
 */
export class ClearRect extends Container {
  private readonly _eraser = new Graphics({ blendMode: 'erase' });
  private readonly _fill = new Graphics();

  constructor() {
    super({ label: 'ClearRect' });
    this.addChild(this._eraser, this._fill);
    this.visible = false;
  }

  /**
   * Shows the rects over `rect` in a colour, for the next draw only
   * @param rect - Where to clear, in pixels from the top-left corner
   * @param color - The clear colour
   * @param alpha - Its opacity, 0 to 1
   */
  public show(rect: PixelRect, color: ColorSource, alpha: number): void {
    const { x, y, width, height } = rect;
    this._eraser.clear();
    this._fill.clear();
    if (alpha < 1) this._eraser.rect(x, y, width, height).fill({ color: 0xffffff, alpha: 1 });
    if (alpha > 0) this._fill.rect(x, y, width, height).fill({ color, alpha });
    this.visible = true;
  }
}

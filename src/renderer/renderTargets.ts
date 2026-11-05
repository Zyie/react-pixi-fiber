import { Container, CubeTexture, Graphics, Mesh, MeshGeometry, RenderTexture, Shader, Texture } from 'pixi.js';
import type { CLEAR, ColorSource, Renderer, TextureSource } from 'pixi.js';

import { program } from '../environment/environmentShaders';
import type { Vector4 } from '../math/Vector4';

/** Copies a 2D texture upside down: its last row lands on the first */
const flippedCopyPrograms = () =>
  program('cube-face-copy', () => ({
    gl: /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() {
  finalColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
}
`,
    gpu: /* wgsl */ `
@group(2) @binding(0) var uTexture: texture_2d<f32>;
@group(2) @binding(1) var uSampler: sampler;
@fragment
fn mainFragment(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(uTexture, uSampler, vec2<f32>(vUV.x, 1.0 - vUV.y));
}
`,
  }));

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

/**
 * Draws a scene into one face of a cube target. pixi-3d's view binds its target again for each of its
 * passes, always at layer 0, so a view can't draw into a cube's face itself: it draws into a 2D texture
 * of the face's size, which is then copied into the face upside down, the way up a cube map's faces
 * are stored (three's cube cameras draw them with a negative field of view for the same reason).
 * @internal
 */
export class CubeFaceWriter {
  private _face: RenderTexture | null = null;
  private readonly _copy = new Mesh({
    geometry: new MeshGeometry({
      positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    }),
    shader: new Shader({
      ...flippedCopyPrograms(),
      resources: { uTexture: Texture.EMPTY.source, uSampler: Texture.EMPTY.source.style },
    }),
  });
  private readonly _stage = new Container({ children: [this._copy] });

  /**
   * Renders a stage into a face of a cube target
   * @param pixi - The renderer
   * @param stage - What to draw
   * @param target - The cube target
   * @param face - The face, 0 to 5: +X, -X, +Y, -Y, +Z, -Z
   * @param mipLevel - The mip level of the face
   * @param clear - What to clear before the stage draws
   * @param clearColor - The colour to clear to
   */
  public write(
    pixi: Renderer,
    stage: Container,
    target: DrawableTarget,
    face: number,
    mipLevel: number,
    clear: boolean | CLEAR,
    clearColor: [number, number, number, number],
  ): void {
    const source = (target.texture as CubeTexture).source;
    const size = Math.max(1, source.pixelWidth >> mipLevel);
    if (!this._face || this._face.source.format !== source.format) {
      this._release();
      this._face = RenderTexture.create({ width: size, height: size, resolution: 1, format: source.format });
    } else if (this._face.source.pixelWidth !== size) {
      this._face.resize(size, size, 1);
    }
    pixi.render({ container: stage, target: this._face, clear, clearColor });
    const resources = this._copy.shader!.resources;
    resources.uTexture = this._face.source;
    resources.uSampler = this._face.source.style;
    this._copy.scale.set(size, size);
    pixi.render({
      container: this._stage,
      target: source,
      layer: face,
      mipLevel,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
  }

  /** Frees the face texture and the copy's mesh. Idempotent. */
  public destroy(): void {
    this._release();
    if (this._stage.destroyed) return;
    this._copy.shader!.destroy();
    this._copy.geometry.destroy();
    this._stage.destroy({ children: true });
  }

  private _release(): void {
    if (!this._face) return;
    const resources = this._copy.shader!.resources;
    resources.uTexture = Texture.EMPTY.source;
    resources.uSampler = Texture.EMPTY.source.style;
    this._face.destroy(true);
    this._face = null;
  }
}

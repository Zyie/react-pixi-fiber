import type { ShadowFilter, View3D } from '@pixi/3d';
import { PixiRenderer } from '@react-fiber/core';
import type { PixiRenderTarget, PixiShadowMap } from '@react-fiber/core';
import { updateBackdrop } from '@react-fiber/core/extension';
import type { RenderedScene, ViewSettings } from '@react-fiber/core/extension';
import { CubeTexture, Texture } from 'pixi.js';
import type { ColorSource, WebGPURenderer } from 'pixi.js';

import { EnvironmentMaps, isEnvironmentBackground } from '../environment/EnvironmentMaps';
import type { EnvironmentScene } from '../environment/EnvironmentMaps';
import { Color as ThreeColor, toDisplayColor } from '../math/Color';
import { applyFog } from './sceneFog';
import { finishLights, prepareLights } from './sceneLights';
import { setShadowsEnabled } from './shadowViews';
import { TARGET_OUTPUT, applyToneMapping } from './toneMapping';

const SHADOW_FILTERS: readonly ShadowFilter[] = ['hard', 'pcf', 'pcf-high', 'pcf-high'];

/** The linear byte for each display byte pixi-3d stores, which encodes with a 2.2 gamma */
const DISPLAY_TO_LINEAR = Uint8Array.from({ length: 256 }, (_, i) => Math.round((i / 255) ** 2.2 * 255));

/**
 * Copies rows of pixels, top down in `pixels`, into `buffer` from the bottom row up, as three reads
 * them, decoding the colour to linear, and swapping red and blue when `pixels` is in BGRA order
 */
function copyRows(
  pixels: Uint8Array | Uint8ClampedArray,
  rowBytes: number,
  top: number,
  x: number,
  width: number,
  height: number,
  buffer: Uint8Array | Uint8ClampedArray,
  bgra = false,
): void {
  for (let row = 0; row < height; row++) {
    const from = (top + height - 1 - row) * rowBytes + x * 4;
    const to = row * width * 4;
    for (let i = 0; i < width * 4; i++) {
      const channel = i & 3;
      const at = bgra && (channel & 1) === 0 ? from + i + 2 - 2 * channel : from + i;
      buffer[to + i] = channel === 3 ? pixels[at] : DISPLAY_TO_LINEAR[pixels[at]];
    }
  }
}

/** Whether a scene's environment or background is a texture, which `EnvironmentMaps` turns into what pixi-3d draws */
const isEnvironmentTexture = (value: unknown): value is Texture | CubeTexture =>
  value instanceof Texture || value instanceof CubeTexture;

/**
 * three's renderer surface over core's {@link PixiRenderer}: the renderer roots get with
 * `@react-fiber/threejs-compat` installed
 *
 * three's renderer settings are forwarded to each view as it draws: `toneMapping`,
 * `toneMappingExposure` and `outputColorSpace` become three's own tone curve, exposure and output
 * transform at the end of every material, and `shadowMap.type` the view's shadow filter. They take the
 * place of `PixiRenderer`'s @pixi/3d settings: `toneMapping` takes three's constants, and `exposure`
 * and `shadowFilter` go unread. `shadowMap.enabled` gates which lights cast shadows. The scene's
 * lights, `fog`, `environment` and a texture `background` are read as three reads them. A scene whose
 * `background` is a colour, a three `Color` or a pixi `ColorSource`, clears the canvas to it before it
 * draws, as three's does, untouched by tone mapping; a 2D texture is stretched over the viewport, and
 * a cube or equirectangular texture is drawn around the camera with three's rotation, intensity and
 * blur. Render targets read back as three reads them, in linear light.
 * @example
 * ```tsx
 * import { Canvas, useThree } from '@react-fiber/threejs-compat';
 *
 * <Canvas renderer={{ preference: 'webgpu', shadows: true }}>
 *   <Scene />
 * </Canvas>;
 *
 * // Inside the canvas
 * const renderer = useThree((state) => state.renderer);
 * renderer.toneMappingExposure = 1.5;
 * ```
 * @category renderer
 * @standard
 */
export class ThreeRenderer extends PixiRenderer {
  /** Brightness before tone mapping, which three leaves out with `NoToneMapping` @default 1 */
  public toneMappingExposure: number = 1;
  /** three's output colour space: `'srgb'`, or `'srgb-linear'` to write linear values @default 'srgb' */
  public outputColorSpace: string = 'srgb';
  /** three's shadow map settings, which r3f's core writes from the `shadows` setting */
  public readonly shadowMap: PixiShadowMap = { enabled: false, type: 1, autoUpdate: true, needsUpdate: false };
  private _threeToneMapping: number = 0;
  private _environments: EnvironmentMaps | null = null;

  /**
   * three's tone mapping constant, which r3f's core sets to `ACESFilmicToneMapping` when a root is
   * first configured
   * @default NoToneMapping
   */
  public override get toneMapping(): number {
    return this._threeToneMapping;
  }

  public override set toneMapping(value: number) {
    this._threeToneMapping = value;
  }

  /**
   * Sets what the canvas and targets clear to
   * @param color - The clear colour: a three `Color`, read in the working colour space, or any pixi `ColorSource`
   * @param alpha - Its opacity, 0 to 1
   */
  public override setClearColor(color: ColorSource | ThreeColor, alpha = 1): void {
    super.setClearColor(color instanceof ThreeColor ? toDisplayColor(color) : color, alpha);
  }

  /**
   * Reads a rect of a target's pixels into `buffer`, three's `readRenderTargetPixels`
   *
   * As in three, rows go from the bottom of the rect up, and the values are linear: pixi-3d stores
   * the picture encoded for display, and this decodes it. Only 8-bit 2D targets can be read. On
   * WebGPU, as with three's WebGPU renderer, read with
   * {@link ThreeRenderer#readRenderTargetPixelsAsync | readRenderTargetPixelsAsync}; this leaves
   * `buffer` alone there.
   * @param target - The target to read
   * @param x - Left edge in the target's pixels
   * @param y - Bottom edge in the target's pixels, from its bottom
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @param buffer - Receives 4 bytes per pixel, RGBA
   */
  public readRenderTargetPixels(
    target: PixiRenderTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    buffer: Uint8Array | Uint8ClampedArray,
  ): void {
    const pixi = this.pixi;
    if (!pixi || pixi.name === 'webgpu' || target.disposed || target.texture instanceof CubeTexture) return;
    const { pixels, width: rowWidth } = pixi.extract.pixels(target.texture);
    copyRows(pixels, rowWidth * 4, target.height - y - height, x, width, height, buffer);
  }

  /**
   * Reads a rect of a target's pixels, three's `readRenderTargetPixelsAsync`; on WebGPU it copies the
   * texture into a buffer the GPU maps back
   * @param target - The target to read
   * @param x - Left edge in the target's pixels
   * @param y - Bottom edge in the target's pixels, from its bottom
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @returns The pixels, 4 linear bytes each, rows from the bottom up
   */
  public async readRenderTargetPixelsAsync(
    target: PixiRenderTarget,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<Uint8Array> {
    const buffer = new Uint8Array(width * height * 4);
    const pixi = this.pixi;
    if (!pixi || target.disposed || target.texture instanceof CubeTexture) return buffer;
    if (pixi.name !== 'webgpu') {
      this.readRenderTargetPixels(target, x, y, width, height, buffer);
      return buffer;
    }
    const gpu = pixi as WebGPURenderer;
    const { device } = gpu.gpu;
    const rowBytes = Math.ceil((width * 4) / 256) * 256;
    const readback = device.createBuffer({
      size: rowBytes * height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: gpu.texture.getGpuSource(target.texture.source), origin: { x, y: target.height - y - height } },
      { buffer: readback, bytesPerRow: rowBytes },
      { width, height },
    );
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const bgra = target.texture.source.format === 'bgra8unorm';
    copyRows(new Uint8Array(readback.getMappedRange()), rowBytes, 0, 0, width, height, buffer, bgra);
    readback.destroy();
    return buffer;
  }

  protected override _backgroundColor(background: unknown): ColorSource | null {
    return background instanceof ThreeColor ? toDisplayColor(background) : super._backgroundColor(background);
  }

  /**
   * Copies three's renderer settings onto a scene's view before it draws: its output, then a cube or
   * equirectangular environment or background, which goes through `EnvironmentMaps`
   * @param entry - The scene's view
   * @param scene - The scene
   * @param background - The scene's background
   */
  protected override _applySettings(entry: ViewSettings, scene: RenderedScene, background: unknown): void {
    super._applySettings(entry, scene, background);
    const { view } = entry;
    const toTarget = this._renderTarget !== null;
    const { environment } = scene;
    if (this._environments || isEnvironmentTexture(environment) || isEnvironmentBackground(background)) {
      this._environments ??= new EnvironmentMaps();
      this._environments.apply(
        this.pixi!,
        view,
        entry.stage,
        scene as EnvironmentScene,
        toTarget ? 0 : this.toneMapping,
        this.toneMappingExposure,
        toTarget,
        this._frame,
      );
    }
  }

  /**
   * Gives a view three's tone mapping, output and shadow filter. Into a target, tone mapping is off and
   * exposure 1, as three draws into a target in linear light, and the colour is stored with the 2.2
   * gamma pixi-3d decodes a colour map with.
   * @param view - The view about to draw
   */
  protected override _applyOutput(view: View3D): void {
    if (this._renderTarget !== null) applyToneMapping(view, 0, 1, TARGET_OUTPUT);
    else applyToneMapping(view, this.toneMapping, this.toneMappingExposure, this.outputColorSpace);
    const shadowFilter = SHADOW_FILTERS[this.shadowMap.type] ?? 'pcf';
    if (view.shadowFilter !== shadowFilter) view.shadowFilter = shadowFilter;
    setShadowsEnabled(view, this.shadowMap.enabled);
  }

  /**
   * What three reads off the scene itself: its lights, its fog, and a 2D texture background, which is
   * stretched over the view
   * @param entry - The scene's view
   * @param scene - The scene
   */
  protected override _applySceneSettings(entry: ViewSettings, scene: RenderedScene): void {
    const { view } = entry;
    const environmentScene = scene as EnvironmentScene;
    prepareLights(view, environmentScene);
    applyFog(view, environmentScene);
    const background = isEnvironmentBackground(environmentScene.background) ? null : environmentScene.background;
    updateBackdrop(entry.stage, view, background, environmentScene.backgroundIntensity ?? 1);
  }

  protected override _finishView(view: View3D): void {
    finishLights(view);
  }

  protected override _releaseSettings(view: View3D): void {
    this._environments?.releaseView(view);
    super._releaseSettings(view);
  }

  protected override _disposeSettings(): void {
    this._environments?.dispose();
    this._environments = null;
  }
}

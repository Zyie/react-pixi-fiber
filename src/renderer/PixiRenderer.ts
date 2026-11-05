import { Matrix4, Quaternion, Vector3, View3D } from '@pixi/3d';
import type { Camera3D, Container3D, ShadowFilter, ToneMapping } from '@pixi/3d';
import { CLEAR, Color, Container, CubeTexture, Texture, autoDetectRenderer } from 'pixi.js';
import type { ColorSource, Renderer, WebGPURenderer } from 'pixi.js';

import { DirectionalLight } from '../catalog/lights/DirectionalLight';
import { EnvironmentMaps } from '../environment/EnvironmentMaps';
import type { EnvironmentScene } from '../environment/EnvironmentMaps';
import { Color as ThreeColor, toPixiColor } from '../math/Color';
import { Vector4 } from '../math/Vector4';
import { ClearRect, CubeFaceWriter, ProxyCamera, coversSurface, fromBottomLeft, surfaceOf } from './renderTargets';
import type { DrawableTarget, PixelRect } from './renderTargets';
import { setShadowsEnabled } from './shadowViews';

/**
 * What the renderer is built with; r3f passes `canvas` and `antialias`, and the `renderer` (or
 * `gl`) prop of `<Canvas>` adds to them
 * @category renderer
 * @standard
 */
export interface PixiRendererParameters {
  /** The canvas to draw into */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Smooth edges with multisampling @default true */
  antialias?: boolean;
  /** See through to the page where nothing is drawn, as three's `alpha` @default true */
  alpha?: boolean;
  /** Which pixi.js backend to try first @default 'webgl' */
  preference?: 'webgl' | 'webgpu';
  /** Power preference passed to the GPU adapter */
  powerPreference?: GPUPowerPreference;
}

/**
 * three's `renderer.shadowMap`; r3f writes it from the `shadows` renderer setting
 * @category renderer
 * @standard
 */
export interface PixiShadowMap {
  /** Draw shadows at all; lights cast them only while this is on, as in three @default false */
  enabled: boolean;
  /** three's shadow map type constant (`PCFShadowMap`, ...), mapped to a pixi-3d `shadowFilter` @default 1 */
  type: number;
  /** Kept for three's shape; pixi-3d renders shadows every frame */
  autoUpdate: boolean;
  /** Kept for three's shape; pixi-3d renders shadows every frame */
  needsUpdate: boolean;
}

interface SceneView {
  readonly view: View3D;
  readonly stage: Container;
  readonly clearRect: ClearRect;
  readonly release: () => void;
  proxy: ProxyCamera | null;
  background: unknown;
  drawnAt: number;
}

/**
 * A target `setRenderTarget` takes: a {@link RenderTarget}, a {@link WebGLCubeRenderTarget}, or `null`
 * for the canvas
 * @category renderer
 * @advanced
 */
export type PixiRenderTarget = DrawableTarget;

const TONE_MAPPINGS: readonly ToneMapping[] = [
  'none',
  'none',
  'reinhard',
  'uncharted2',
  'aces',
  'custom',
  'aces',
  'aces',
];
const SHADOW_FILTERS: readonly ShadowFilter[] = ['hard', 'pcf', 'pcf-high', 'pcf-high'];

/** The linear byte for each display byte pixi-3d stores, which encodes with a 2.2 gamma */
const DISPLAY_TO_LINEAR = Uint8Array.from({ length: 256 }, (_, i) => Math.round((i / 255) ** 2.2 * 255));

/**
 * Copies rows of pixels, top down in `pixels`, into `buffer` from the bottom row up, as three reads
 * them, decoding the colour to linear
 */
function copyRows(
  pixels: Uint8Array | Uint8ClampedArray,
  rowBytes: number,
  top: number,
  x: number,
  width: number,
  height: number,
  buffer: Uint8Array | Uint8ClampedArray,
): void {
  for (let row = 0; row < height; row++) {
    const from = (top + height - 1 - row) * rowBytes + x * 4;
    const to = row * width * 4;
    for (let i = 0; i < width * 4; i++) {
      buffer[to + i] = (i & 3) === 3 ? pixels[from + i] : DISPLAY_TO_LINEAR[pixels[from + i]];
    }
  }
}

const sceneWorld = new Matrix4();
const cameraWorld = new Matrix4();
const proxyPosition = new Vector3();
const proxyQuaternion = new Quaternion();
const proxyScale = new Vector3();
const viewRect: PixelRect = { x: 0, y: 0, width: 0, height: 0 };
const scissorRect: PixelRect = { x: 0, y: 0, width: 0, height: 0 };
const clearRGBA: [number, number, number, number] = [0, 0, 0, 0];

type SceneBackground = ThreeColor | ColorSource | Texture | View3D['background'] | null | undefined;

/** Whether a scene's background is a colour, which three clears the canvas to, untouched by tone mapping */
const isColorBackground = (background: SceneBackground): background is ThreeColor | ColorSource =>
  background instanceof ThreeColor ||
  background instanceof Color ||
  typeof background === 'string' ||
  typeof background === 'number' ||
  Array.isArray(background) ||
  ArrayBuffer.isView(background);

/** Whether a scene's environment or background is a texture, which `EnvironmentMaps` turns into what pixi-3d draws */
const isEnvironmentTexture = (value: unknown): value is Texture | CubeTexture =>
  value instanceof Texture || value instanceof CubeTexture;

const isDescendant = (node: Container3D, root: Container3D): boolean => {
  for (let parent = node.parent; parent; parent = parent.parent) if (parent === root) return true;
  return false;
};

/** three's `aspect` of a camera, which its projection uses whatever rect it fills, or `null` when it has none */
const aspectOf = (camera: Camera3D): number | null => {
  const { aspect } = camera as Camera3D & { aspect?: number };
  return typeof aspect === 'number' && Number.isFinite(aspect) && aspect > 0 ? aspect : null;
};

/**
 * three's renderer surface over a pixi.js renderer and pixi-3d views
 *
 * r3f's core drives a renderer through `init`, `setSize`, `setPixelRatio`, `render(scene, camera)`
 * and `dispose`. This facade answers them with a pixi.js renderer on the canvas and one `View3D`
 * per scene it is asked to draw, so a HUD, portal or offscreen scene gets its own view instead of
 * rebuilding one view every frame. A view draws with the camera it is given when that camera is in
 * its scene; any other camera is copied onto a proxy camera in the scene before each frame. A
 * scene's view is freed when the scene is destroyed, or once it has gone
 * {@link PixiRenderer#viewMaxIdleFrames | viewMaxIdleFrames} frames undrawn, and is made again if
 * the scene is drawn after that.
 *
 * three's renderer settings are forwarded to each view as it draws: `toneMapping` and
 * `toneMappingExposure` become the view's tone mapping and exposure, and `shadowMap.type` its shadow
 * filter. `shadowMap.enabled` gates which lights cast shadows. A scene whose `background` is a colour,
 * a three `Color` or a pixi `ColorSource`, clears the canvas to it before it draws, as three's does,
 * untouched by tone mapping; any other background, such as a pixi-3d `CubeTexture`, becomes its view's.
 * The canvas is transparent unless `alpha` is `false`, as in three.
 *
 * `setRenderTarget(target)` points the next renders at a {@link RenderTarget} (or a face of a
 * {@link WebGLCubeRenderTarget}) instead of the canvas, and `setViewport`, `setScissor` and
 * `setScissorTest` take three's rects, in CSS pixels from the canvas's bottom-left corner (a target's
 * own `viewport` and `scissor` apply while it is set). A scene fills the viewport; the scissor limits
 * clears. Each scene's view starts its draw with fresh depth, so `clearDepth` between two scenes
 * changes nothing, and a camera's `aspect` decides its projection, as in three, even where it
 * differs from the viewport's.
 * @example
 * ```tsx
 * import { Canvas, useThree } from 'react-pixi-fiber';
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
export class PixiRenderer {
  /** Always `true`; tells this renderer apart from three's */
  public readonly isPixiRenderer = true;
  /** The canvas drawn into */
  public readonly domElement: HTMLCanvasElement | OffscreenCanvas;
  /** three's backend flag: `isWebGPUBackend` is set when pixi.js picked WebGPU */
  public backend: { isWebGPUBackend?: true } = {};
  /** The pixi.js renderer, once `init` has resolved */
  public pixi: Renderer | null = null;
  /** Which pixi.js backend to try first */
  public preference: 'webgl' | 'webgpu';
  /** Clear the canvas before each `render`, as three's `autoClear` @default true */
  public autoClear = true;
  /** three's tone mapping constant; r3f sets `ACESFilmicToneMapping` @default NoToneMapping */
  public toneMapping = 0;
  /** Brightness before tone mapping, pixi-3d's `exposure` @default 1 */
  public toneMappingExposure = 1;
  /** Kept for three's shape; pixi-3d always writes sRGB @default 'srgb' */
  public outputColorSpace = 'srgb';
  /** three's shadow map settings */
  public readonly shadowMap: PixiShadowMap = { enabled: false, type: 1, autoUpdate: true, needsUpdate: false };
  /**
   * Frames a scene can go undrawn before its view is freed. A frame ends when a scene is drawn a
   * second time, so a HUD that unmounts stops holding a view while the main scene keeps drawing.
   * @default 120
   */
  public viewMaxIdleFrames: number = 120;

  private readonly _antialias: boolean;
  private readonly _powerPreference: PixiRendererParameters['powerPreference'];
  private readonly _views = new Map<Container3D, SceneView>();
  private readonly _emptyClearRect = new ClearRect();
  private readonly _empty = new Container({ children: [this._emptyClearRect] });
  private readonly _clearColor = new Color(0x000000);
  private _clearAlpha: number;
  /** The scene background pixi.js's background holds, or `null` while it holds the clear colour */
  private _backgroundKey: unknown = null;
  private readonly _backgroundRGB: [number, number, number] = [-1, -1, -1];
  private _width = 300;
  private _height = 150;
  private _pixelRatio = 1;
  private _frame = 0;
  private _renderTarget: DrawableTarget | null = null;
  private _environments: EnvironmentMaps | null = null;
  private _cubeFaces: CubeFaceWriter | null = null;
  private _activeCubeFace = 0;
  private _activeMipmapLevel = 0;
  private readonly _viewport = new Vector4(0, 0, 300, 150);
  private readonly _scissor = new Vector4(0, 0, 300, 150);
  private _scissorTest = false;
  private readonly _releaseIfIdle = (entry: SceneView, scene: Container3D): void => {
    if (this._frame - entry.drawnAt > this.viewMaxIdleFrames) this.releaseView(scene);
  };

  /** @param parameters - The canvas and how to draw into it */
  constructor({
    canvas,
    antialias = true,
    alpha = true,
    preference = 'webgl',
    powerPreference,
  }: PixiRendererParameters) {
    this.domElement = canvas;
    this._antialias = antialias;
    this._clearAlpha = alpha ? 0 : 1;
    this.preference = preference;
    this._powerPreference = powerPreference;
  }

  /**
   * Creates the pixi.js renderer on the canvas; r3f awaits it before the first frame
   * @returns This renderer
   */
  public async init(): Promise<this> {
    if (this.pixi) return this;
    this.pixi = await autoDetectRenderer({
      canvas: this.domElement,
      antialias: this._antialias,
      preference: this.preference,
      powerPreference: this._powerPreference,
      width: this._width,
      height: this._height,
      resolution: this._pixelRatio,
      autoDensity: false,
      backgroundColor: this._clearColor,
      backgroundAlpha: this._clearAlpha,
    });
    if (this.pixi.name === 'webgpu') this.backend = { isWebGPUBackend: true };
    return this;
  }

  /** Whether `init` has resolved */
  public hasInitialized(): boolean {
    return this.pixi !== null;
  }

  /**
   * Sets the drawing buffer's pixel ratio
   * @param ratio - Device pixels per CSS pixel
   */
  public setPixelRatio(ratio: number): void {
    this._pixelRatio = ratio;
    this.pixi?.resize(this._width, this._height, ratio);
  }

  /** Device pixels per CSS pixel */
  public getPixelRatio(): number {
    return this._pixelRatio;
  }

  /**
   * Sets the canvas size in CSS pixels
   * @param width - Width in CSS pixels
   * @param height - Height in CSS pixels
   * @param updateStyle - Also set the canvas element's CSS size, as three does
   */
  public setSize(width: number, height: number, updateStyle = true): void {
    this._width = width;
    this._height = height;
    this._viewport.set(0, 0, width, height);
    this.pixi?.resize(width, height, this._pixelRatio);
    if (updateStyle && 'style' in this.domElement) {
      this.domElement.style.width = `${width}px`;
      this.domElement.style.height = `${height}px`;
    }
  }

  /**
   * Writes the canvas size in CSS pixels into `target`
   * @param target - Receives `x` as the width and `y` as the height
   * @returns `target`
   */
  public getSize<T extends { x: number; y: number }>(target: T): T {
    target.x = this._width;
    target.y = this._height;
    return target;
  }

  /**
   * Sets what the canvas and targets clear to
   * @param color - The clear colour: a three `Color`, read in the working colour space, or any pixi `ColorSource`
   * @param alpha - Its opacity, 0 to 1
   */
  public setClearColor(color: ColorSource | ThreeColor, alpha = 1): void {
    this._clearColor.setValue(color instanceof ThreeColor ? toPixiColor(color) : color);
    this._clearAlpha = alpha;
    this._backgroundKey = null;
    if (this.pixi) {
      this.pixi.background.color = this._clearColor;
      this.pixi.background.alpha = alpha;
    }
  }

  /** The colour the canvas clears to */
  public getClearColor(): Color {
    return this._clearColor;
  }

  /**
   * Sets the opacity the canvas clears to
   * @param alpha - 0 to 1
   */
  public setClearAlpha(alpha: number): void {
    this.setClearColor(this._clearColor, alpha);
  }

  /** The opacity the canvas clears to, 0 to 1 */
  public getClearAlpha(): number {
    return this._clearAlpha;
  }

  /**
   * The view a scene is drawn through, made the first time the scene is drawn
   *
   * For pixi-3d settings with no three counterpart: passes, environment, fog, culling. A view that
   * was freed, because its scene went {@link PixiRenderer#viewMaxIdleFrames | viewMaxIdleFrames}
   * frames undrawn, is made new on the scene's next draw without those settings.
   * @param scene - A scene this renderer draws
   * @returns The scene's view, or `undefined` before its first `render` and after it is freed
   */
  public getView(scene: Container3D): View3D | undefined {
    return this._views.get(scene)?.view;
  }

  /**
   * Draws a scene from a camera, three's `renderer.render`, into the canvas or the target
   * `setRenderTarget` set, over its viewport
   * @param scene - The scene's root
   * @param camera - The camera to draw from; it doesn't need to be in the scene
   */
  public render(scene: Container3D, camera: Camera3D): void {
    const pixi = this.pixi;
    const target = this._renderTarget;
    if (!pixi || target?.disposed) return;

    let entry = this._views.get(scene);
    if (entry?.drawnAt === this._frame) {
      this._frame++;
      this._views.forEach(this._releaseIfIdle);
    }
    entry ??= this._createView(scene, camera);
    entry.drawnAt = this._frame;
    const { view } = entry;

    this._placeView(view, target);
    const aspect = aspectOf(camera);
    if (camera.view3d === view && (aspect === null || Math.abs(aspect - view.width / view.height) < 1e-6)) {
      view.camera = camera;
    } else {
      entry.proxy ??= new ProxyCamera();
      this._syncProxy(entry.proxy, camera, scene);
      entry.proxy.aspect = aspect;
      view.camera = entry.proxy;
    }

    const background = (scene as Container3D & { background?: SceneBackground }).background;
    const clearToBackground = target ? isColorBackground(background) : this._applyBackground(pixi, background);
    this._applySettings(entry, scene as EnvironmentScene, background);
    this._draw(
      entry.stage,
      entry.clearRect,
      this.autoClear || clearToBackground,
      clearToBackground ? background : null,
    );
  }

  /**
   * Points the next renders at a target, or back at the canvas; three's `setRenderTarget`
   * @param target - A {@link RenderTarget} or {@link WebGLCubeRenderTarget}, or `null` for the canvas
   * @param activeCubeFace - The face of a cube target to draw into, 0 to 5: +X, -X, +Y, -Y, +Z, -Z
   * @param activeMipmapLevel - The mip level to draw into
   */
  public setRenderTarget(target: PixiRenderTarget | null, activeCubeFace = 0, activeMipmapLevel = 0): void {
    this._renderTarget = target;
    this._activeCubeFace = activeCubeFace;
    this._activeMipmapLevel = activeMipmapLevel;
  }

  /** The target renders go to, or `null` for the canvas */
  public getRenderTarget(): PixiRenderTarget | null {
    return this._renderTarget;
  }

  /** The face of a cube target renders go to */
  public getActiveCubeFace(): number {
    return this._activeCubeFace;
  }

  /** The mip level renders go to */
  public getActiveMipmapLevel(): number {
    return this._activeMipmapLevel;
  }

  /**
   * Sets the rect scenes fill on the canvas, three's `setViewport`
   * @param x - Left edge in CSS pixels, or a vector of all four
   * @param y - Bottom edge in CSS pixels, from the canvas's bottom
   * @param width - Width in CSS pixels
   * @param height - Height in CSS pixels
   */
  public setViewport(x: number | Vector4, y = 0, width = 0, height = 0): void {
    if (typeof x === 'number') this._viewport.set(x, y, width, height);
    else this._viewport.copy(x);
  }

  /**
   * Writes the canvas's viewport into `target`
   * @param target - Receives `(x, y, width, height)` in CSS pixels from the bottom-left corner
   * @returns `target`
   */
  public getViewport<T extends Vector4>(target: T): T {
    return target.copy(this._viewport);
  }

  /**
   * Writes the viewport of the current target, or of the canvas in device pixels, into `target`
   * @param target - Receives `(x, y, width, height)` from the bottom-left corner
   * @returns `target`
   */
  public getCurrentViewport<T extends Vector4>(target: T): T {
    if (this._renderTarget) return target.copy(this._renderTarget.viewport);
    return target.copy(this._viewport).multiplyScalar(this._pixelRatio);
  }

  /**
   * Sets the rect `setScissorTest` limits clears to on the canvas, three's `setScissor`
   * @param x - Left edge in CSS pixels, or a vector of all four
   * @param y - Bottom edge in CSS pixels, from the canvas's bottom
   * @param width - Width in CSS pixels
   * @param height - Height in CSS pixels
   */
  public setScissor(x: number | Vector4, y = 0, width = 0, height = 0): void {
    if (typeof x === 'number') this._scissor.set(x, y, width, height);
    else this._scissor.copy(x);
  }

  /**
   * Writes the canvas's scissor rect into `target`
   * @param target - Receives `(x, y, width, height)` in CSS pixels from the bottom-left corner
   * @returns `target`
   */
  public getScissor<T extends Vector4>(target: T): T {
    return target.copy(this._scissor);
  }

  /**
   * Limits clears on the canvas to the scissor rect, three's `setScissorTest`; pixi-3d already keeps
   * each scene's draw inside its viewport
   * @param enabled - Whether to limit them
   */
  public setScissorTest(enabled: boolean): void {
    this._scissorTest = enabled;
  }

  /** Whether clears on the canvas are limited to the scissor rect */
  public getScissorTest(): boolean {
    return this._scissorTest;
  }

  /**
   * Clears the canvas or the current target, three's `clear`. The colour clears to the clear colour,
   * inside the scissor rect while the scissor test is on. Depth and stencil clear too, though each
   * scene's view clears its own depth before it draws.
   * @param color - Clear the colour
   * @param depth - Clear depth
   * @param stencil - Clear stencil
   */
  public clear(color = true, depth = true, stencil = true): void {
    const pixi = this.pixi;
    if (!pixi || this._renderTarget?.disposed) return;
    if (!this._renderTarget) this._applyBackground(pixi, null);
    const flags = (color ? CLEAR.COLOR : 0) | (depth ? CLEAR.DEPTH : 0) | (stencil ? CLEAR.STENCIL : 0);
    if (flags !== CLEAR.NONE) this._draw(this._empty, this._emptyClearRect, flags, null);
  }

  /** Clears the colour of the canvas or the current target, three's `clearColor` */
  public clearColor(): void {
    this.clear(true, false, false);
  }

  /** Clears depth, three's `clearDepth`; each scene's view clears its own depth anyway */
  public clearDepth(): void {
    this.clear(false, true, false);
  }

  /** Clears stencil, three's `clearStencil` */
  public clearStencil(): void {
    this.clear(false, false, true);
  }

  /**
   * Reads a rect of a target's pixels into `buffer`, three's `readRenderTargetPixels`
   *
   * As in three, rows go from the bottom of the rect up, and the values are linear: pixi-3d stores
   * the picture encoded for display, and this decodes it. Only 8-bit 2D targets can be read. On
   * WebGPU, as with three's WebGPU renderer, read with
   * {@link PixiRenderer#readRenderTargetPixelsAsync | readRenderTargetPixelsAsync}; this leaves
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
    const readback = device.createBuffer({ size: rowBytes * height, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture: gpu.texture.getGpuSource(target.texture.source), origin: { x, y: target.height - y - height } },
      { buffer: readback, bytesPerRow: rowBytes },
      { width, height },
    );
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    copyRows(new Uint8Array(readback.getMappedRange()), rowBytes, 0, 0, width, height, buffer);
    readback.destroy();
    return buffer;
  }

  /**
   * Stops drawing a scene and frees its view, leaving the scene's children in place
   * @param scene - A scene this renderer draws
   */
  public releaseView(scene: Container3D): void {
    const entry = this._views.get(scene);
    if (!entry) return;
    this._views.delete(scene);
    scene.off('destroyed', entry.release);
    if (entry.proxy) scene.removeChild(entry.proxy);
    entry.proxy?.destroy();
    this._environments?.releaseView(entry.view);
    const children = scene.children.slice();
    entry.view.destroy();
    if (!scene.destroyed) for (const child of children) if (!child.destroyed) scene.addChild(child);
    entry.stage.destroy();
  }

  /** Frees every view and the pixi.js renderer; scenes keep their children */
  public dispose(): void {
    for (const scene of this._views.keys()) this.releaseView(scene);
    this._environments?.dispose();
    this._environments = null;
    this._cubeFaces?.destroy();
    this._cubeFaces = null;
    this._empty.destroy({ children: true });
    this.pixi?.destroy();
    this.pixi = null;
  }

  private _createView(scene: Container3D, camera: Camera3D): SceneView {
    const inScene = isDescendant(camera, scene);
    const proxy = inScene ? null : new ProxyCamera();
    const view = new View3D({ root: scene, camera: proxy ?? camera, autoResize: false });
    const stage = new Container();
    const clearRect = new ClearRect();
    stage.addChild(clearRect, view);
    const entry: SceneView = {
      view,
      stage,
      clearRect,
      proxy,
      background: undefined,
      drawnAt: this._frame,
      release: () => this.releaseView(scene),
    };
    scene.once('destroyed', entry.release);
    this._views.set(scene, entry);
    return entry;
  }

  private _syncProxy(proxy: ProxyCamera, camera: Camera3D, scene: Container3D): void {
    proxy.mode = camera.mode;
    proxy.fov = camera.fov;
    proxy.zoom = camera.zoom;
    proxy.near = camera.near;
    proxy.far = camera.far;
    proxy.orthographicSize = camera.orthographicSize;
    sceneWorld.getInverse(scene.getGlobalTransform(sceneWorld));
    sceneWorld.multiply(camera.getGlobalTransform(cameraWorld)).decompose(proxyPosition, proxyQuaternion, proxyScale);
    proxy.position.copyFrom(proxyPosition);
    proxy.quaternion = proxyQuaternion;
    proxy.scale.copyFrom(proxyScale);
  }

  /**
   * Places a view over the viewport of the canvas or of the current target
   * @param view - The view
   * @param target - The current target, or `null` for the canvas
   */
  private _placeView(view: View3D, target: DrawableTarget | null): void {
    if (target) fromBottomLeft(target.viewport, target.height, viewRect);
    else fromBottomLeft(this._viewport, this._height, viewRect);
    view.position.set(viewRect.x, viewRect.y);
    view.setSize(Math.max(1, viewRect.width), Math.max(1, viewRect.height));
  }

  /**
   * Renders a stage into the canvas or the current target, clearing it first as asked: all of it, or
   * only the scissor rect while the scissor test is on, as three's clears go
   * @param stage - What to render
   * @param clearRect - The stage's rects for a scissored clear
   * @param clear - What to clear
   * @param background - A colour background to clear to in place of the clear colour
   */
  private _draw(stage: Container, clearRect: ClearRect, clear: boolean | CLEAR, background: SceneBackground): void {
    const pixi = this.pixi!;
    const target = this._renderTarget;
    const surfaceWidth = target ? target.width : this._width;
    const surfaceHeight = target ? target.height : this._height;
    const scissorTest = target ? target.scissorTest : this._scissorTest;
    const clearsColor = clear === true || (typeof clear === 'number' && (clear & CLEAR.COLOR) !== 0);
    this._clearColorOf(background);

    let fullClear = clear;
    if (clearsColor && scissorTest) {
      fromBottomLeft(target ? target.scissor : this._scissor, surfaceHeight, scissorRect);
      if (!coversSurface(scissorRect, surfaceWidth, surfaceHeight)) {
        clearRect.show(scissorRect, clearRGBA, clearRGBA[3]);
        fullClear = CLEAR.NONE;
      }
    }

    if (target?.texture instanceof CubeTexture) {
      this._cubeFaces ??= new CubeFaceWriter();
      this._cubeFaces.write(pixi, stage, target, this._activeCubeFace, this._activeMipmapLevel, fullClear, clearRGBA);
      target._renderCount++;
    } else if (target) {
      pixi.render({
        container: stage,
        target: surfaceOf(target),
        clear: fullClear,
        clearColor: clearRGBA,
        mipLevel: this._activeMipmapLevel,
      });
      target._renderCount++;
    } else {
      pixi.render({ container: stage, clear: fullClear });
    }
    clearRect.visible = false;
  }

  /** Writes the colour a clear goes to, a colour background or the clear colour, into `clearRGBA` */
  private _clearColorOf(background: SceneBackground): void {
    if (background instanceof ThreeColor) {
      const [r, g, b] = toPixiColor(background);
      clearRGBA[0] = r;
      clearRGBA[1] = g;
      clearRGBA[2] = b;
      clearRGBA[3] = 1;
    } else if (background !== null && background !== undefined && isColorBackground(background)) {
      Color.shared.setValue(background).toArray(clearRGBA);
      clearRGBA[3] = 1;
    } else {
      this._clearColor.toArray(clearRGBA);
      clearRGBA[3] = this._clearAlpha;
    }
  }

  /**
   * Puts a colour background on pixi.js's background, which the canvas clears to before the scene draws,
   * as three clears to a colour background whether `autoClear` is on or not; anything else leaves the
   * clear colour there
   * @returns Whether the scene has a colour background
   */
  private _applyBackground(pixi: Renderer, background: SceneBackground): boolean {
    if (background instanceof ThreeColor) {
      const rgb = toPixiColor(background);
      const last = this._backgroundRGB;
      if (this._backgroundKey !== background || last[0] !== rgb[0] || last[1] !== rgb[1] || last[2] !== rgb[2]) {
        this._backgroundKey = background;
        last[0] = rgb[0];
        last[1] = rgb[1];
        last[2] = rgb[2];
        pixi.background.color = rgb;
        pixi.background.alpha = 1;
      }
      return true;
    }
    if (isColorBackground(background)) {
      if (this._backgroundKey !== background) {
        this._backgroundKey = background;
        pixi.background.color = background;
        pixi.background.alpha = 1;
      }
      return true;
    }
    if (this._backgroundKey !== null) {
      this._backgroundKey = null;
      pixi.background.color = this._clearColor;
      pixi.background.alpha = this._clearAlpha;
    }
    return false;
  }

  /**
   * Copies three's renderer settings onto a scene's view before it draws. Into a target, tone mapping
   * is off and exposure 1, as three draws into a target in linear light. A texture environment or
   * background goes through `EnvironmentMaps`.
   * @param entry - The scene's view
   * @param scene - The scene
   * @param background - The scene's background
   */
  private _applySettings(entry: SceneView, scene: EnvironmentScene, background: SceneBackground): void {
    const { view } = entry;
    const toTarget = this._renderTarget !== null;
    const toneMapping = toTarget ? 'none' : (TONE_MAPPINGS[this.toneMapping] ?? 'aces');
    if (view.toneMapping !== toneMapping) view.toneMapping = toneMapping;
    view.exposure = toTarget ? 1 : this.toneMappingExposure;
    const shadowFilter = SHADOW_FILTERS[this.shadowMap.type] ?? 'pcf';
    if (view.shadowFilter !== shadowFilter) view.shadowFilter = shadowFilter;
    setShadowsEnabled(view, this.shadowMap.enabled);

    if (background !== undefined) {
      const viewBackground = isColorBackground(background) || isEnvironmentTexture(background) ? null : background;
      if (viewBackground !== entry.background) {
        entry.background = viewBackground;
        view.background = viewBackground;
      }
    }

    if (this._environments || isEnvironmentTexture(scene.environment) || isEnvironmentTexture(background)) {
      this._environments ??= new EnvironmentMaps();
      this._environments.apply(
        this.pixi!,
        view,
        entry.stage,
        scene,
        toTarget ? 0 : this.toneMapping,
        this.toneMappingExposure,
        toTarget,
        this._frame,
      );
    }

    for (const light of view.lights) if (light instanceof DirectionalLight) light.aimAtTarget();
  }
}

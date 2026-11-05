import { Camera3D, Matrix4, Quaternion, Vector3, View3D } from '@pixi/3d';
import type { Container3D, ShadowFilter } from '@pixi/3d';
import { Color, Container, Texture, autoDetectRenderer } from 'pixi.js';
import type { ColorSource, Renderer } from 'pixi.js';

import { Color as ThreeColor, toPixiColor } from '../math/Color';
import { releaseBackdrop, updateBackdrop } from './backdrop';
import { applyFog } from './sceneFog';
import { finishLights, prepareLights } from './sceneLights';
import { setShadowsEnabled } from './shadowViews';
import { applyToneMapping } from './toneMapping';

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
  readonly release: () => void;
  proxy: Camera3D | null;
  background: unknown;
  drawnAt: number;
}

const SHADOW_FILTERS: readonly ShadowFilter[] = ['hard', 'pcf', 'pcf-high', 'pcf-high'];

const sceneWorld = new Matrix4();
const cameraWorld = new Matrix4();
const proxyPosition = new Vector3();
const proxyQuaternion = new Quaternion();
const proxyScale = new Vector3();

type SceneBackground = ThreeColor | ColorSource | View3D['background'] | null | undefined;

/** Whether a scene's background is a colour, which three clears the canvas to, untouched by tone mapping */
const isColorBackground = (background: SceneBackground): background is ThreeColor | ColorSource =>
  background instanceof ThreeColor ||
  background instanceof Color ||
  typeof background === 'string' ||
  typeof background === 'number' ||
  Array.isArray(background) ||
  ArrayBuffer.isView(background);

const isDescendant = (node: Container3D, root: Container3D): boolean => {
  for (let parent = node.parent; parent; parent = parent.parent) if (parent === root) return true;
  return false;
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
  /** three's output colour space: `'srgb'` encodes what the materials draw with the sRGB curve, `'srgb-linear'` leaves it linear @default 'srgb' */
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
  private readonly _empty = new Container();
  private readonly _clearColor = new Color(0x000000);
  private _clearAlpha: number;
  /** The scene background pixi.js's background holds, or `null` while it holds the clear colour */
  private _backgroundKey: unknown = null;
  private readonly _backgroundRGB: [number, number, number] = [-1, -1, -1];
  private _width = 300;
  private _height = 150;
  private _pixelRatio = 1;
  private _frame = 0;
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
   * Sets what the canvas clears to
   * @param color - The clear colour
   * @param alpha - Its opacity, 0 to 1
   */
  public setClearColor(color: ColorSource, alpha = 1): void {
    this._clearColor.setValue(color);
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
   * Draws a scene from a camera, three's `renderer.render`
   * @param scene - The scene's root
   * @param camera - The camera to draw from; it doesn't need to be in the scene
   */
  public render(scene: Container3D, camera: Camera3D): void {
    const pixi = this.pixi;
    if (!pixi) return;

    let entry = this._views.get(scene);
    if (entry?.drawnAt === this._frame) {
      this._frame++;
      this._views.forEach(this._releaseIfIdle);
    }
    entry ??= this._createView(scene, camera);
    entry.drawnAt = this._frame;
    const { view } = entry;

    if (camera.view3d === view) {
      view.camera = camera;
    } else {
      entry.proxy ??= new Camera3D();
      this._syncProxy(entry.proxy, camera, scene);
      view.camera = entry.proxy;
    }

    const background = (scene as Container3D & { background?: SceneBackground }).background;
    const clearToBackground = this._applyBackground(pixi, background);
    this._applySettings(entry, background);
    this._applySceneSettings(entry, scene);
    try {
      pixi.render({ container: entry.stage, clear: this.autoClear || clearToBackground });
    } finally {
      finishLights(view);
    }
  }

  /** Clears the canvas to the clear colour */
  public clear(): void {
    if (!this.pixi) return;
    this._applyBackground(this.pixi, null);
    this.pixi.render({ container: this._empty, clear: true });
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
    releaseBackdrop(entry.stage);
    const children = scene.children.slice();
    entry.view.destroy();
    if (!scene.destroyed) for (const child of children) if (!child.destroyed) scene.addChild(child);
    entry.stage.destroy();
  }

  /** Frees every view and the pixi.js renderer; scenes keep their children */
  public dispose(): void {
    for (const scene of this._views.keys()) this.releaseView(scene);
    this._empty.destroy();
    this.pixi?.destroy();
    this.pixi = null;
  }

  private _createView(scene: Container3D, camera: Camera3D): SceneView {
    const inScene = isDescendant(camera, scene);
    const proxy = inScene ? null : new Camera3D();
    const view = new View3D({ root: scene, camera: proxy ?? camera, autoResize: true });
    const stage = new Container();
    stage.addChild(view);
    const entry: SceneView = {
      view,
      stage,
      proxy,
      background: undefined,
      drawnAt: this._frame,
      release: () => this.releaseView(scene),
    };
    scene.once('destroyed', entry.release);
    this._views.set(scene, entry);
    return entry;
  }

  private _syncProxy(proxy: Camera3D, camera: Camera3D, scene: Container3D): void {
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
   * What three reads off the scene itself: its lights, its fog, and a texture background, which is
   * drawn behind the view
   */
  private _applySceneSettings(entry: SceneView, scene: Container3D): void {
    const { view } = entry;
    const settings = scene as Container3D & { background?: unknown; backgroundIntensity?: number };
    prepareLights(view, scene);
    applyFog(view, scene);
    updateBackdrop(entry.stage, settings.background, this._width, this._height, settings.backgroundIntensity ?? 1);
  }

  private _applySettings(entry: SceneView, background: SceneBackground): void {
    const { view } = entry;
    applyToneMapping(view, this.toneMapping, this.toneMappingExposure, this.outputColorSpace);
    const shadowFilter = SHADOW_FILTERS[this.shadowMap.type] ?? 'pcf';
    if (view.shadowFilter !== shadowFilter) view.shadowFilter = shadowFilter;
    setShadowsEnabled(view, this.shadowMap.enabled);

    if (background !== undefined) {
      const viewBackground = isColorBackground(background) || background instanceof Texture ? null : background;
      if (viewBackground !== entry.background) {
        entry.background = viewBackground;
        view.background = viewBackground;
      }
    }
  }
}

/**
 * pixi-3d renderer support for r3f's vendored core: the same contract as
 * `.repos/react-three-fiber/packages/fiber/src/support/webgpu.ts`.
 *
 * It reports `kind: 'webgpu'` because that is the path in core/renderer.ts that awaits an async
 * `renderer.init()`, which pixi needs. The WebGL path constructs the renderer synchronously.
 */
import * as PIXI3D from '@pixi/3d';
import { View3D } from '@pixi/3d';
import { Container, autoDetectRenderer, type Renderer } from 'pixi.js';

import type { WebGPUSupport } from '../r3f/types';
import * as compat from './three-compat';

interface RendererParams {
  canvas: HTMLCanvasElement;
  antialias?: boolean;
  preference?: 'webgl' | 'webgpu';
}

/** Wraps a pixi renderer plus one View3D behind three's `renderer.render(scene, camera)` surface. */
export class Pixi3DRenderer {
  readonly domElement: HTMLCanvasElement;
  backend: { isWebGPUBackend?: true } = {};
  pixi: Renderer | null = null;
  view: View3D | null = null;
  readonly stage = new Container();
  private readonly params: RendererParams;
  private width = 300;
  private height = 150;
  private pixelRatio = 1;

  constructor(params: RendererParams) {
    this.params = params;
    this.domElement = params.canvas;
  }

  async init(): Promise<this> {
    const { canvas, antialias, preference = 'webgl' } = this.params;
    this.pixi = await autoDetectRenderer({
      canvas,
      antialias,
      preference,
      width: this.width,
      height: this.height,
      resolution: this.pixelRatio,
      autoDensity: false,
    });
    if (this.pixi.name === 'webgpu') this.backend = { isWebGPUBackend: true };
    return this;
  }

  hasInitialized(): boolean {
    return this.pixi !== null;
  }

  setPixelRatio(ratio: number): void {
    this.pixelRatio = ratio;
    this.pixi?.resize(this.width, this.height, ratio);
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.pixi?.resize(width, height, this.pixelRatio);
  }

  render(scene: PIXI3D.Container3D, camera: PIXI3D.Camera3D): void {
    if (!this.pixi) return;
    if (this.view?.root !== scene) {
      this.view?.destroy();
      this.view = new View3D({ root: scene, camera, autoResize: true });
      this.stage.addChild(this.view);
    }
    if (this.view.camera !== camera) this.view.camera = camera;
    this.pixi.render({ container: this.stage });
  }

  dispose(): void {
    this.view?.destroy();
    this.view = null;
    this.pixi?.destroy();
    this.pixi = null;
  }
}

compat.installObject3DSurface();

/**
 * The JSX catalog and getThree() namespace. pixi-3d's own exports come first, so `<mesh3D>`,
 * `<cubeGeometry>` and `<material3D>` resolve to pixi-3d classes; the three-named aliases and the
 * math classes core instantiates (Vector3, Raycaster, ...) override any clash.
 */
export const catalog = {
  ...PIXI3D,
  ...compat,
  SRGBColorSpace: 'srgb',
  ACESFilmicToneMapping: 4,
  PCFShadowMap: 1,
  BasicShadowMap: 0,
  VSMShadowMap: 3,
  RGBAFormat: 1023,
  UnsignedByteType: 1009,
};

export const pixi3dSupport = {
  kind: 'webgpu',
  three: catalog,
  Renderer: Pixi3DRenderer,
  RenderTarget: undefined,
  CubeRenderTarget: undefined,
  CanvasTarget: undefined,
  occlusion: undefined,
} as unknown as WebGPUSupport;

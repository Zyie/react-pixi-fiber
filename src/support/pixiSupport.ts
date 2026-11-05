import { catalog } from '../catalog/catalog';
import type { PixiCatalog } from '../catalog/catalog';
import { installObject3DSurface } from '../compat/installObject3DSurface';
import { WebGLCubeRenderTarget } from '../environment/WebGLCubeRenderTarget';
import { WebGLRenderTarget } from '../environment/WebGLRenderTarget';
import { PixiRenderer } from '../renderer/PixiRenderer';

/**
 * pixi-3d as an r3f renderer support: what r3f's core loads when a root is configured
 *
 * The same contract as r3f's `support/webgpu.ts`: the namespace JSX names and core's classes come
 * from, the renderer class, and the render target classes `useRenderTarget` and `<Environment>` make.
 * `kind` is `'pixi'`. Core's only branch on it tests for `'webgl'`, so a pixi root takes the path that
 * awaits the renderer's async `init()`, and the WebGL-only occlusion gate stays off. pixi.js can't
 * share a renderer between canvases, so there is no canvas target.
 * @category renderer
 * @advanced
 */
export interface PixiSupport {
  /** Always `'pixi'` */
  kind: 'pixi';
  /** The catalog: pixi-3d's classes plus the three-named ones */
  three: PixiCatalog;
  /** The renderer r3f constructs */
  Renderer: typeof PixiRenderer;
  /** The target `useRenderTarget` makes */
  RenderTarget: typeof WebGLRenderTarget;
  /** The cube target `<Environment>` makes for its children */
  CubeRenderTarget: typeof WebGLCubeRenderTarget;
  /** Not available: pixi.js can't share a renderer between canvases */
  CanvasTarget: undefined;
  /** Not available: pixi-3d has no occlusion queries */
  occlusion: undefined;
}

/**
 * The pixi-3d renderer support
 * @category renderer
 * @advanced
 */
export const pixiSupport: PixiSupport = {
  kind: 'pixi',
  three: catalog,
  Renderer: PixiRenderer,
  RenderTarget: WebGLRenderTarget,
  CubeRenderTarget: WebGLCubeRenderTarget,
  CanvasTarget: undefined,
  occlusion: undefined,
};

/**
 * Loads the support for a root: installs the three.js members on pixi-3d's classes, once, then hands
 * the support over. r3f's core calls it during a root's first `configure()`, before any element is
 * created, so importing this package changes nothing until a root exists.
 * @internal
 */
export function loadPixiSupport(): PixiSupport {
  installObject3DSurface();
  return pixiSupport;
}

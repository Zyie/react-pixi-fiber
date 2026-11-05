import { RenderTarget } from './RenderTarget';

/**
 * three's `WebGLRenderTarget`, the name r3f apps on WebGL make targets by; the same {@link RenderTarget}
 * on either pixi backend
 * @example
 * ```ts
 * import { WebGLRenderTarget } from 'react-pixi-fiber/three';
 *
 * const target = new WebGLRenderTarget(512, 512, { samples: 4 });
 * ```
 * @category catalog
 * @standard
 */
export class WebGLRenderTarget extends RenderTarget {
  /** Always `true`; three's flag for WebGL render targets */
  public readonly isWebGLRenderTarget = true;
}

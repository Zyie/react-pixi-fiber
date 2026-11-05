import { Box, Matrix4 } from '@pixi/3d';

import type { OrthographicCamera } from '../scene/OrthographicCamera';

const product = new Matrix4();

/**
 * A directional light's shadow camera as the box pixi-3d fits its shadow map to
 *
 * three draws a directional shadow through an orthographic camera at the light, facing its target.
 * pixi-3d takes a box instead, which it moves into light space with `applyMatrix4` and boxes again.
 * This box is the camera's frustum in light space with the light's world transform beside it, so
 * moving it into any space boxes the frustum itself; moved back into light space it is the frustum
 * exactly. `min` and `max` hold its world-space bounds.
 * @internal
 */
export class ShadowCameraBox extends Box {
  private readonly _local = new Box();
  private readonly _frame = new Matrix4();

  /**
   * Sets the box to a shadow camera's frustum
   * @param camera - The shadow camera, in light space
   * @param lightWorld - The light's world transform
   * @returns This box
   */
  public fit(camera: OrthographicCamera, lightWorld: Matrix4): this {
    const halfWidth = (camera.right - camera.left) / (2 * camera.zoom);
    const halfHeight = (camera.top - camera.bottom) / (2 * camera.zoom);
    const centreX = (camera.right + camera.left) / 2;
    const centreY = (camera.top + camera.bottom) / 2;

    this._local.min.set(centreX - halfWidth, centreY - halfHeight, -camera.far);
    this._local.max.set(centreX + halfWidth, centreY + halfHeight, -camera.near);
    this._frame.copyFrom(lightWorld);
    this._local.applyMatrix4(lightWorld, this);
    return this;
  }

  /**
   * Bounds the frustum after a transform
   * @param matrix - The transform from world space
   * @param out - Receives the bounds; this box when omitted, which then holds the moved frustum
   * @returns `out`
   */
  public override applyMatrix4(matrix: Matrix4, out: Box = this): this {
    product.multiplyMatrices(matrix, this._frame);
    if (out === this) this._frame.copyFrom(product);
    this._local.applyMatrix4(product, out);
    return out as this;
  }
}

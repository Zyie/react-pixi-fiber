import type { Matrix4 } from '@pixi/3d';

import { RootCamera } from './RootCamera';

/**
 * The orthographic camera core makes for a root with `orthographic` while no package registers its
 * own: a pixi-3d `Camera3D` that projects the box between `left`, `right`, `top` and `bottom`, which
 * r3f sets to the canvas's size in pixels, scaled by `zoom`
 * @category core
 * @advanced
 */
export class RootOrthographicCamera extends RootCamera {
  /** Left edge of the box */
  public left: number = -1;
  /** Right edge of the box */
  public right: number = 1;
  /** Top edge of the box */
  public top: number = 1;
  /** Bottom edge of the box */
  public bottom: number = -1;

  /**
   * @param left - Left edge of the box
   * @param right - Right edge
   * @param top - Top edge
   * @param bottom - Bottom edge
   * @param near - Nearest distance drawn
   * @param far - Farthest distance drawn
   */
  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super({ mode: 'orthographic', near, far });
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
  }

  /**
   * The box's projection, around its centre and scaled by `zoom`, whatever the aspect of the view
   * @param _aspect - Unused: the box sets the aspect
   * @param out - Receives the projection
   * @returns `out`
   */
  public override computeProjection(_aspect: number, out: Matrix4): Matrix4 {
    const halfWidth = (this.right - this.left) / (2 * this.zoom);
    const halfHeight = (this.top - this.bottom) / (2 * this.zoom);
    const centreX = (this.right + this.left) / 2;
    const centreY = (this.top + this.bottom) / 2;
    return out.makeOrthographic(
      centreX - halfWidth,
      centreX + halfWidth,
      centreY + halfHeight,
      centreY - halfHeight,
      this.near,
      this.far,
    );
  }
}

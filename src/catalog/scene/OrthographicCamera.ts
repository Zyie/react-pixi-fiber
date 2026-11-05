import { Camera3D } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
/**
 * three's `OrthographicCamera` over pixi-3d's `Camera3D`, with three's positional constructor
 *
 * three's frustum bounds become pixi-3d's `orthographicSize`, half the width, when
 * `updateProjectionMatrix` runs; r3f calls it on every resize. pixi-3d draws a frustum centred on
 * the camera, so asymmetric bounds are drawn centred. `zoom` means the same in both.
 * @example
 * ```tsx
 * <Canvas orthographic camera={{ zoom: 50, position: [0, 0, 100] }} />
 * ```
 * @category catalog
 * @standard
 */
export class OrthographicCamera extends Camera3D {
  /** Left edge of the frustum, in world units at zoom 1 */
  public left: number = -1;
  /** Right edge of the frustum, in world units at zoom 1 */
  public right: number = 1;
  /** Top edge of the frustum, in world units at zoom 1 */
  public top: number = 1;
  /** Bottom edge of the frustum, in world units at zoom 1 */
  public bottom: number = -1;
  /** When `true`, r3f leaves the projection alone on resize */
  public manual?: boolean;

  /**
   * @param left - Left edge of the frustum
   * @param right - Right edge of the frustum
   * @param top - Top edge of the frustum
   * @param bottom - Bottom edge of the frustum
   * @param near - Near clipping distance
   * @param far - Far clipping distance
   */
  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super({ mode: 'orthographic', near, far });
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.updateProjectionMatrix();
  }

  /** Sets pixi-3d's `orthographicSize` to half the width between `left` and `right` */
  public override updateProjectionMatrix(): void {
    if (this.right !== this.left) this.orthographicSize = Math.abs(this.right - this.left) / 2;
  }

  /** Width over height of the frustum bounds; `NaN` while they are empty */
  public get aspect(): number {
    return (this.right - this.left) / (this.top - this.bottom);
  }

  /** Local rotation in radians, three's `Euler`: its `order` sets how the angles combine, and it stays in step with `quaternion` */
  public override get rotation(): Euler {
    return super.rotation as Euler;
  }

  public override set rotation(value: PointData3D) {
    super.rotation = value;
  }

  /**
   * Turns this node to face a point in world space, given as a vector or as three numbers; a camera faces it with its -Z, as in three
   * @param x - The point, or its x
   * @param y - The point's y
   * @param z - The point's z
   */
  public override lookAt(x: number | PointData3D, y?: number | PointData3D, z?: number): void {
    lookAtPoint(this, x, y, z);
  }
}

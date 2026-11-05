import { Camera3D } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

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

  /**
   * Turns the camera to face a point, given as a point or as three numbers as in three
   * @param target - The point, or its x
   * @param y - The point's y, when `target` is a number; else pixi-3d's up vector
   * @param z - The point's z, when `target` is a number
   */
  public override lookAt(target: number | PointData3D, y?: number | PointData3D, z?: number): void {
    if (typeof target === 'number') super.lookAt({ x: target, y: typeof y === 'number' ? y : 0, z: z ?? 0 });
    else super.lookAt(target, typeof y === 'object' ? y : undefined);
  }
}

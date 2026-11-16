import { Camera3D } from '@pixi/3d';
import type { Matrix4, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
import { setViewOffset } from './cameraView';
import type { CameraView } from './cameraView';

/**
 * three's `OrthographicCamera` over pixi-3d's `Camera3D`, with three's positional constructor
 *
 * The camera projects the box its `left`, `right`, `top` and `bottom` bounds, divided by `zoom`,
 * mark out, as three's does, whatever the aspect of the canvas; r3f sets the bounds from the canvas
 * size unless the camera is `manual`. Off-centre bounds and `setViewOffset` work as in three, though
 * `view` is pixi-3d's view matrix, so the offset isn't readable there. As in three, a change to these
 * settings shows once `updateProjectionMatrix` is called, which r3f does on every resize. pixi-3d
 * helpers that read `orthographicSize` get half the width between `left` and `right`, set when
 * `updateProjectionMatrix` runs.
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
  /** The part of a larger image this camera draws, from `setViewOffset`; three's `view`, which is pixi-3d's view matrix here */
  private _viewOffset: CameraView | null = null;
  /** The settings as `updateProjectionMatrix` last saw them, which the projection is built from, as three's is */
  private readonly _projected = {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    near: 0.1,
    far: 2000,
    zoom: 1,
    view: { enabled: false, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 } as CameraView,
  };

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

  /**
   * Builds the projection from the camera's settings as they are now, three's `updateProjectionMatrix`,
   * and sets pixi-3d's `orthographicSize`, which its helpers read, to half the width between `left`
   * and `right`
   */
  public override updateProjectionMatrix(): void {
    if (this.right !== this.left) this.orthographicSize = Math.abs(this.right - this.left) / 2;
    const projected = this._projected;
    projected.left = this.left;
    projected.right = this.right;
    projected.top = this.top;
    projected.bottom = this.bottom;
    projected.near = this.near;
    projected.far = this.far;
    projected.zoom = this.zoom;
    Object.assign(projected.view, this._viewOffset ?? { enabled: false });
  }

  /**
   * three's projection, from the bounds, `zoom`, `near`, `far` and the view offset as
   * `updateProjectionMatrix` last saw them; pixi-3d calls it as it draws, and three's ignores the
   * aspect of the area drawn into
   * @param _aspect - Width over height of the area drawn into
   * @param out - Receives the projection
   * @returns `out`
   */
  public override computeProjection(_aspect: number, out: Matrix4): Matrix4 {
    const projected = this._projected;
    const { zoom, view } = projected;
    const halfWidth = (projected.right - projected.left) / (2 * zoom);
    const halfHeight = (projected.top - projected.bottom) / (2 * zoom);
    const centreX = (projected.right + projected.left) / 2;
    const centreY = (projected.top + projected.bottom) / 2;
    let left = centreX - halfWidth;
    let right = centreX + halfWidth;
    let top = centreY + halfHeight;
    let bottom = centreY - halfHeight;

    if (view.enabled) {
      const scaleWidth = (projected.right - projected.left) / view.fullWidth / zoom;
      const scaleHeight = (projected.top - projected.bottom) / view.fullHeight / zoom;
      left += scaleWidth * view.offsetX;
      right = left + scaleWidth * view.width;
      top -= scaleHeight * view.offsetY;
      bottom = top - scaleHeight * view.height;
    }

    return out.makeOrthographic(left, right, top, bottom, projected.near, projected.far);
  }

  /**
   * Draws only part of a larger image, as three's `setViewOffset`
   * @param fullWidth - Width of the whole image
   * @param fullHeight - Height of the whole image
   * @param x - Left edge of the part
   * @param y - Top edge of the part
   * @param width - Width of the part
   * @param height - Height of the part
   */
  public setViewOffset(
    fullWidth: number,
    fullHeight: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this._viewOffset = setViewOffset(this._viewOffset, fullWidth, fullHeight, x, y, width, height);
    this.updateProjectionMatrix();
  }

  /** Draws the whole image again */
  public clearViewOffset(): void {
    if (this._viewOffset) this._viewOffset.enabled = false;
    this.updateProjectionMatrix();
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

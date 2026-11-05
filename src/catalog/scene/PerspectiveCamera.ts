import { Camera3D } from '@pixi/3d';
import type { Matrix4, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
import type { Vector2 } from '../../math/Vector2';
import { setViewOffset, writeFrustum } from './cameraView';
import type { CameraView } from './cameraView';

const DEG_TO_RAD = Math.PI / 180;

/**
 * three's `PerspectiveCamera` over pixi-3d's `Camera3D`, with three's positional constructor
 *
 * `fov` is vertical and in degrees in both libraries. The camera projects with its own `aspect`, as
 * three's does, which r3f keeps in step with the canvas unless the camera is `manual`, so a camera
 * whose aspect differs from the canvas stretches the picture as in three. `zoom`, `filmGauge`,
 * `filmOffset` and `setViewOffset` shape the projection as in three; `focus` is kept for three's shape.
 * `view` is pixi-3d's view matrix, so the offset `setViewOffset` sets isn't readable there as in three.
 * As in three, a change to these settings shows once `updateProjectionMatrix` is called, which r3f
 * does for the default camera on every resize.
 * @example
 * ```tsx
 * <Canvas camera={{ fov: 45, position: [0, 2, 6] }} />
 * ```
 * @category catalog
 * @standard
 */
export class PerspectiveCamera extends Camera3D {
  /** Width over height; r3f sets it from the canvas size */
  public aspect: number = 1;
  /** When `true`, r3f leaves the projection alone on resize */
  public manual?: boolean;
  /** Kept for three's shape: the distance stereo and depth-of-field effects focus at @default 10 */
  public focus: number = 10;
  /** Film size along the larger side, in millimetres, for `getFocalLength` and `filmOffset` @default 35 */
  public filmGauge: number = 35;
  /** Horizontal shift of the film from the centre, in millimetres @default 0 */
  public filmOffset: number = 0;
  /** The part of a larger image this camera draws, from `setViewOffset`; three's `view`, which is pixi-3d's view matrix here */
  private _viewOffset: CameraView | null = null;
  /** The settings as `updateProjectionMatrix` last saw them, which the projection is built from, as three's is */
  private readonly _projected = {
    fov: 50,
    aspect: 1,
    near: 0.1,
    far: 2000,
    zoom: 1,
    filmOffset: 0,
    filmWidth: 35,
    view: { enabled: false, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 } as CameraView,
  };

  /**
   * @param fov - Vertical field of view in degrees
   * @param aspect - Width over height
   * @param near - Near clipping distance
   * @param far - Far clipping distance
   */
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super({ mode: 'perspective', fov, near, far });
    this.aspect = aspect;
    this.updateProjectionMatrix();
  }

  /** Builds the projection from the camera's settings as they are now, three's `updateProjectionMatrix` */
  public override updateProjectionMatrix(): void {
    const projected = this._projected;
    projected.fov = this.fov;
    projected.aspect = this.aspect;
    projected.near = this.near;
    projected.far = this.far;
    projected.zoom = this.zoom;
    projected.filmOffset = this.filmOffset;
    projected.filmWidth = this.getFilmWidth();
    Object.assign(projected.view, this._viewOffset ?? { enabled: false });
  }

  /**
   * three's projection, from `fov`, `aspect`, `zoom`, `near`, `far`, `filmOffset` and the view offset
   * as `updateProjectionMatrix` last saw them; pixi-3d calls it as it draws, with the aspect of the area
   * it draws into, which this camera uses only while its own `aspect` is unset
   * @param aspect - Width over height of the area drawn into
   * @param out - Receives the projection
   * @returns `out`
   */
  public override computeProjection(aspect: number, out: Matrix4): Matrix4 {
    const { near, far, fov, zoom, filmOffset, filmWidth, view } = this._projected;
    const ownAspect = this._projected.aspect;
    let top = (near * Math.tan(DEG_TO_RAD * 0.5 * fov)) / zoom;
    let height = 2 * top;
    let width = (ownAspect > 0 && Number.isFinite(ownAspect) ? ownAspect : aspect) * height;
    let left = -0.5 * width;

    if (view.enabled) {
      left += (view.offsetX * width) / view.fullWidth;
      top -= (view.offsetY * height) / view.fullHeight;
      width *= view.width / view.fullWidth;
      height *= view.height / view.fullHeight;
    }
    if (filmOffset !== 0) left += (near * filmOffset) / filmWidth;

    return writeFrustum(out, left, left + width, top, top - height, near, far);
  }

  /**
   * Draws only part of a larger image, as three's `setViewOffset`: the image is `fullWidth` by
   * `fullHeight`, and this camera draws the `width` by `height` part at `x`, `y`
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
    this.aspect = fullWidth / fullHeight;
    this._viewOffset = setViewOffset(this._viewOffset, fullWidth, fullHeight, x, y, width, height);
    this.updateProjectionMatrix();
  }

  /** Draws the whole image again */
  public clearViewOffset(): void {
    if (this._viewOffset) this._viewOffset.enabled = false;
    this.updateProjectionMatrix();
  }

  /** The focal length in millimetres for the current `fov` and `filmGauge` */
  public getFocalLength(): number {
    return (0.5 * this.getFilmHeight()) / Math.tan(DEG_TO_RAD * 0.5 * this.fov);
  }

  /**
   * Sets `fov` from a focal length in millimetres and the current `filmGauge`
   * @param focalLength - The focal length
   */
  public setFocalLength(focalLength: number): void {
    this.fov = (2 * Math.atan((0.5 * this.getFilmHeight()) / focalLength)) / DEG_TO_RAD;
    this.updateProjectionMatrix();
  }

  /** The vertical field of view after `zoom`, in degrees */
  public getEffectiveFOV(): number {
    return (2 * Math.atan(Math.tan(DEG_TO_RAD * 0.5 * this.fov) / this.zoom)) / DEG_TO_RAD;
  }

  /** The film's width in millimetres */
  public getFilmWidth(): number {
    return this.filmGauge * Math.min(this.aspect, 1);
  }

  /** The film's height in millimetres */
  public getFilmHeight(): number {
    return this.filmGauge / Math.max(this.aspect, 1);
  }

  /**
   * The corners of the area the camera sees at a distance, in its own space
   * @param distance - Distance along the view
   * @param minTarget - Receives the lower-left corner
   * @param maxTarget - Receives the upper-right corner
   */
  public getViewBounds(distance: number, minTarget: Vector2, maxTarget: Vector2): void {
    const halfHeight = (distance * Math.tan(DEG_TO_RAD * 0.5 * this.fov)) / this.zoom;
    const halfWidth = halfHeight * this.aspect;
    minTarget.set(-halfWidth, -halfHeight);
    maxTarget.set(halfWidth, halfHeight);
  }

  /**
   * The size of the area the camera sees at a distance
   * @param distance - Distance along the view
   * @param target - Receives the width and height
   * @returns `target`
   */
  public getViewSize(distance: number, target: Vector2): Vector2 {
    const height = (2 * distance * Math.tan(DEG_TO_RAD * 0.5 * this.fov)) / this.zoom;
    target.set(height * this.aspect, height);
    return target;
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

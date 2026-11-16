import { Camera3D } from '@pixi/3d';
import type { Matrix4 } from '@pixi/3d';

/**
 * The camera a view draws from when it can't draw from the camera it was given: one outside its
 * scene, which pixi-3d can't draw with directly, or one whose `aspect` differs from the rect it fills.
 * The renderer copies the source's transform onto it each frame, and it projects with the source's
 * own projection, so a three camera's aspect, bounds and view offset carry over.
 * @internal
 */
export class ProxyCamera extends Camera3D {
  /** The camera this one stands in for */
  public source: Camera3D | null = null;
  /** three's `aspect` of the source, which its projection keeps whatever rect it fills, or `null` for the rect's */
  public aspect: number | null = null;

  /**
   * The source camera's projection, for its own aspect when it has one
   * @param aspect - Width over height of the area drawn into
   * @param out - Receives the projection
   * @returns `out`
   */
  public override computeProjection(aspect: number, out: Matrix4): Matrix4 {
    const projected = this.aspect ?? aspect;
    return this.source ? this.source.computeProjection(projected, out) : super.computeProjection(projected, out);
  }
}

import { Camera3D } from '@pixi/3d';
import type { Matrix4 } from '@pixi/3d';

/**
 * The camera the renderer adds to a scene to draw it from a camera outside the scene, which pixi-3d
 * can't draw with directly. The renderer copies the source's transform onto it each frame, and it
 * projects with the source's own projection, so a three camera's aspect, bounds and view offset carry
 * over.
 * @internal
 */
export class ProxyCamera extends Camera3D {
  /** The camera this one stands in for */
  public source: Camera3D | null = null;

  /**
   * The source camera's projection
   * @param aspect - Width over height of the area drawn into
   * @param out - Receives the projection
   * @returns `out`
   */
  public override computeProjection(aspect: number, out: Matrix4): Matrix4 {
    return this.source ? this.source.computeProjection(aspect, out) : super.computeProjection(aspect, out);
  }
}

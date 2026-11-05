import { Frustum as PixiFrustum, Matrix4, Mesh3D, Sphere, Vector3 } from '@pixi/3d';
import type { Container3D } from '@pixi/3d';

const scratchMatrix = new Matrix4();
const scratchSphere = new Sphere();
const scratchPoint = new Vector3();

/**
 * three's `Frustum`: pixi-3d's `Frustum`, six planes, with three's `intersectsObject` and `copy`
 *
 * r3f's `onFramed` and `onVisible` events test each registered object against the camera's frustum
 * once a frame through `intersectsObject`. A mesh is tested by the sphere around its geometry's
 * bounds in world space, as three tests its geometry's `boundingSphere`. Any other node counts as
 * framed when its world position is inside.
 * @example
 * ```tsx
 * <mesh onFramed={(inView) => console.log(inView ? 'on screen' : 'off screen')}>
 *   <boxGeometry />
 * </mesh>
 * ```
 * @category math
 * @standard
 */
export class Frustum extends PixiFrustum {
  /**
   * Whether any part of `object` is inside this frustum
   * @param object - The node to test, in world space
   * @returns `true` when the object is at least partly inside
   */
  public intersectsObject(object: Container3D): boolean {
    if (object instanceof Mesh3D) {
      scratchSphere.setFromBox(object.geometry.bounds3D);
      scratchSphere.applyMatrix4(object.getGlobalTransform(scratchMatrix));
      return this.intersectsSphere(scratchSphere);
    }
    return this.containsPoint(object.getGlobalPosition(scratchPoint));
  }

  /**
   * Copies another frustum's planes, three's name for `copyFrom`
   * @param frustum - The frustum to copy
   * @returns This frustum
   */
  public copy(frustum: PixiFrustum): this {
    return this.copyFrom(frustum);
  }

  /** A new frustum with the same planes */
  public override clone(): Frustum {
    return new Frustum().copyFrom(this);
  }
}

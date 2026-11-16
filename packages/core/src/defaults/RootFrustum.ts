import { Box, Frustum, Matrix4, Mesh3D } from '@pixi/3d';
import type { Container3D } from '@pixi/3d';

const box = new Box();
const world = new Matrix4();
const origin = { x: 0, y: 0, z: 0 };

/**
 * The frustum core keeps for a root while no package registers its own: a pixi-3d `Frustum` with
 * `intersectsObject`, which r3f's core calls for an element with `onFramed` or `onVisible`. A mesh is
 * in it when its geometry's bounds in world space are; any other node when its origin is.
 * @category core
 * @advanced
 */
export class RootFrustum extends Frustum {
  /**
   * Whether an object is inside the frustum, in whole or in part
   * @param object - The object
   */
  public intersectsObject(object: Container3D): boolean {
    object.getGlobalTransform(world);
    if (object instanceof Mesh3D) return this.intersectsBox(object.geometry.bounds3D.applyMatrix4(world, box));
    const elements = world.elements;
    origin.x = elements[12];
    origin.y = elements[13];
    origin.z = elements[14];
    return this.containsPoint(origin);
  }

  /**
   * A copy of this frustum, of this class
   * @returns The copy
   */
  public override clone(): RootFrustum {
    return new RootFrustum().copyFrom(this);
  }
}

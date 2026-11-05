import { Spherical as PixiSpherical } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

/**
 * three's `Spherical`: pixi-3d's `Spherical`, a `radius`, a polar angle `phi` from +Y and an azimuth
 * `theta` about Y from +Z, with the members three adds
 * @example
 * ```ts
 * import { Spherical, Vector3 } from 'react-pixi-fiber/three';
 *
 * const orbit = new Spherical().setFromVector3(camera.position);
 * orbit.theta += 0.01;
 * camera.position.setFromSpherical(orbit);
 * ```
 * @category math
 * @advanced
 */
export class Spherical extends PixiSpherical {
  /**
   * Copies another spherical coordinate, three's name for `copyFrom`
   * @param other - The coordinate to copy
   * @returns This coordinate
   */
  public copy(other: PixiSpherical): this {
    return this.copyFrom(other);
  }

  /** A new coordinate with the same values */
  public override clone(): Spherical {
    return new Spherical().copyFrom(this);
  }

  /**
   * Sets the coordinate from a point
   * @param v - The point
   * @returns This coordinate
   */
  public setFromVector3(v: PointData3D): this {
    return this.setFromCartesianCoords(v.x, v.y, v.z);
  }
}

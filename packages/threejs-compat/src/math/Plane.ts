import { Matrix3 as PixiMatrix3, Plane as PixiPlane } from '@pixi/3d';
import type { Matrix4, PointData3D, Sphere } from '@pixi/3d';

import { Vector3 } from './Vector3';

const v1 = new Vector3();
const v2 = new Vector3();
const normalMatrix = new PixiMatrix3();

/**
 * three's `Plane`: pixi-3d's `Plane`, a unit `normal` and a `constant`, with the members three adds
 *
 * Everything pixi-3d's plane has (`setComponents`, `setFromNormalAndCoplanarPoint`, `distanceToPoint`,
 * `projectPoint`, ...) takes three's arguments too. `applyMatrix4` takes three's optional normal
 * matrix.
 * @example
 * ```ts
 * import { Plane, Vector3 } from '@react-fiber/threejs-compat/three';
 *
 * const ground = new Plane(new Vector3(0, 1, 0), 0);
 * ground.distanceToPoint(new Vector3(0, 2, 0)); // 2
 * ```
 * @category math
 * @advanced
 */
export class Plane extends PixiPlane {
  /** Always `true`; three duck-types planes by it */
  public readonly isPlane = true;
  /** The unit normal */
  declare public readonly normal: Vector3;

  /**
   * @param normal - The unit normal; +X when left out
   * @param constant - The origin's signed distance from the plane
   */
  constructor(normal: Vector3 = new Vector3(1, 0, 0), constant = 0) {
    super(normal, constant);
  }

  /**
   * Copies another plane, three's name for `copyFrom`
   * @param plane - The plane to copy
   * @returns This plane
   */
  public copy(plane: PixiPlane): this {
    return this.copyFrom(plane);
  }

  /** A new plane with the same normal and constant */
  public override clone(): Plane {
    return new Plane().copyFrom(this);
  }

  /**
   * Sets the plane through three points, wound counter-clockwise
   * @param a - The first point
   * @param b - The second point
   * @param c - The third point
   * @returns This plane
   */
  public setFromCoplanarPoints(a: PointData3D, b: PointData3D, c: PointData3D): this {
    const normal = v1.subVectors(c, b).cross(v2.subVectors(a, b)).normalize();
    return this.setFromNormalAndCoplanarPoint(normal, a);
  }

  /** Flips the plane to face the other way */
  public negate(): this {
    this.constant *= -1;
    this.normal.negate();
    return this;
  }

  /**
   * Signed distance from the plane to the nearest point of a sphere
   * @param sphere - The sphere
   */
  public distanceToSphere(sphere: Sphere): number {
    return this.distanceToPoint(sphere.center) - sphere.radius;
  }

  /**
   * Writes the point on the plane nearest the origin into `target`
   * @param target - Receives the point
   * @returns `target`
   */
  public coplanarPoint<T extends Vector3>(target: T): T {
    return target.copy(this.normal).multiplyScalar(-this.constant);
  }

  /**
   * Moves the plane
   * @param offset - How far to move it
   * @returns This plane
   */
  public translate(offset: PointData3D): this {
    this.constant -= offset.x * this.normal.x + offset.y * this.normal.y + offset.z * this.normal.z;
    return this;
  }

  /**
   * Transforms the plane by a matrix, as three's `applyMatrix4`; pixi-3d's `out` plane also works
   * @param matrix - The transform
   * @param optionalNormalMatrix - Its normal matrix, worked out when left out; or pixi-3d's `out`
   * @returns This plane, or pixi-3d's `out`
   */
  public override applyMatrix4(matrix: Matrix4, optionalNormalMatrix?: PixiMatrix3 | PixiPlane): this {
    if (optionalNormalMatrix instanceof PixiPlane) return super.applyMatrix4(matrix, optionalNormalMatrix);
    const normals = optionalNormalMatrix ?? normalMatrix.getNormalMatrix(matrix);
    const referencePoint = this.coplanarPoint(v1).applyMatrix4(matrix);
    const normal = this.normal.applyMatrix3(normals).normalize();
    this.constant = -referencePoint.dot(normal);
    return this;
  }
}

import { Box, Matrix4 as PixiMatrix4, Mesh3D } from '@pixi/3d';
import type { Container3D, PointData3D, Sphere as PixiSphere } from '@pixi/3d';

import { Vector3 } from './Vector3';

const scratchBox = new Box();
const scratchMatrix = new PixiMatrix4();

/**
 * three's `Box3`: pixi-3d's `Box`, an axis-aligned box from `min` to `max`, with the members three adds
 *
 * Everything pixi-3d's box has (`expandByPoint`, `union`, `getCenter`, `containsPoint`,
 * `intersectsBox`, `applyMatrix4`, ...) takes three's arguments too. `setFromObject` measures a node and
 * its descendants in world space from each mesh's geometry bounds, as three's does without `precise`.
 * @example
 * ```ts
 * import { Box3, Vector3 } from '@react-fiber/threejs-compat/three';
 *
 * const size = new Box3().setFromObject(model).getSize(new Vector3());
 * ```
 * @category math
 * @standard
 */
export class Box3 extends Box {
  /** Always `true`; three duck-types boxes by it */
  public readonly isBox3 = true;
  /** The corner with the smallest coordinates */
  declare public readonly min: Vector3;
  /** The corner with the largest coordinates */
  declare public readonly max: Vector3;

  /**
   * @param min - The smallest corner; empty (`+Infinity`) when left out
   * @param max - The largest corner; empty (`-Infinity`) when left out
   */
  constructor(
    min: Vector3 = new Vector3(Infinity, Infinity, Infinity),
    max: Vector3 = new Vector3(-Infinity, -Infinity, -Infinity),
  ) {
    super(min, max);
  }

  /**
   * Copies another box, three's name for `copyFrom`
   * @param box - The box to copy
   * @returns This box
   */
  public copy(box: Box): this {
    return this.copyFrom(box);
  }

  /** A new box with the same corners */
  public override clone(): Box3 {
    return new Box3().copyFrom(this);
  }

  /**
   * Fits the box around points stored flat, `[x, y, z, x, y, z, ...]`
   * @param array - The coordinates
   * @returns This box
   */
  public setFromArray(array: ArrayLike<number>): this {
    this.makeEmpty();
    for (let i = 0; i < array.length; i += 3) this.expandByPoint({ x: array[i], y: array[i + 1], z: array[i + 2] });
    return this;
  }

  /**
   * Fits the box around points
   * @param points - The points
   * @returns This box
   */
  public setFromPoints(points: readonly PointData3D[]): this {
    this.makeEmpty();
    for (const point of points) this.expandByPoint(point);
    return this;
  }

  /**
   * Sets the box from its centre and full size
   * @param center - The centre
   * @param size - The size along each axis
   * @returns This box
   */
  public setFromCenterAndSize(center: PointData3D, size: PointData3D): this {
    this.min.set(center.x - size.x / 2, center.y - size.y / 2, center.z - size.z / 2);
    this.max.set(center.x + size.x / 2, center.y + size.y / 2, center.z + size.z / 2);
    return this;
  }

  /**
   * Fits the box around a node and its descendants, in world space
   * @param object - The node
   * @returns This box
   */
  public setFromObject(object: Container3D): this {
    this.makeEmpty();
    return this.expandByObject(object);
  }

  /**
   * Grows the box to hold a node and its descendants, in world space: each mesh's geometry bounds,
   * moved by its world transform
   * @param object - The node
   * @returns This box
   */
  public expandByObject(object: Container3D): this {
    if (object instanceof Mesh3D && object.geometry) {
      scratchBox.copyFrom(object.geometry.bounds3D).applyMatrix4(object.getGlobalTransform(scratchMatrix));
      if (!scratchBox.isEmpty()) this.union(scratchBox);
    }
    for (const child of object.children) this.expandByObject(child);
    return this;
  }

  /**
   * Grows the box by a vector on each side
   * @param vector - How far to grow along each axis
   * @returns This box
   */
  public expandByVector(vector: PointData3D): this {
    this.min.set(this.min.x - vector.x, this.min.y - vector.y, this.min.z - vector.z);
    this.max.set(this.max.x + vector.x, this.max.y + vector.y, this.max.z + vector.z);
    return this;
  }

  /**
   * Grows the box by a distance on each side
   * @param scalar - How far to grow
   * @returns This box
   */
  public expandByScalar(scalar: number): this {
    return this.expandByVector({ x: scalar, y: scalar, z: scalar });
  }

  /**
   * Where a point is within the box, 0 at `min` and 1 at `max` on each axis
   * @param point - The point
   * @param target - Receives the result
   * @returns `target`
   */
  public getParameter<T extends PointData3D>(point: PointData3D, target: T): T {
    target.x = (point.x - this.min.x) / (this.max.x - this.min.x);
    target.y = (point.y - this.min.y) / (this.max.y - this.min.y);
    target.z = (point.z - this.min.z) / (this.max.z - this.min.z);
    return target;
  }

  /**
   * Shrinks the box to where it overlaps another; no overlap leaves it empty
   * @param box - The other box
   * @returns This box
   */
  public intersect(box: Box): this {
    this.min.max(box.min);
    this.max.min(box.max);
    if (this.isEmpty()) this.makeEmpty();
    return this;
  }

  /**
   * Moves the box
   * @param offset - How far to move it
   * @returns This box
   */
  public translate(offset: PointData3D): this {
    this.min.add(offset);
    this.max.add(offset);
    return this;
  }

  /**
   * Writes the sphere around this box into `target`
   * @param target - Receives the sphere
   * @returns `target`
   */
  public getBoundingSphere<T extends PixiSphere>(target: T): T {
    if (this.isEmpty()) {
      target.makeEmpty();
      return target;
    }
    this.getCenter(target.center);
    target.radius = this.min.distanceTo(this.max) / 2;
    return target;
  }
}

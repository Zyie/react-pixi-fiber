import { Sphere as PixiSphere } from '@pixi/3d';
import type { Box, PointData3D } from '@pixi/3d';

import { Box3 } from './Box3';
import { Vector3 } from './Vector3';

const scratchBox = new Box3();
const v1 = new Vector3();
const v2 = new Vector3();

/**
 * three's `Sphere`: pixi-3d's `Sphere`, a `center` and a `radius`, with the members three adds
 *
 * Everything pixi-3d's sphere has (`setFromBox`, `containsPoint`, `intersectsSphere`, `applyMatrix4`,
 * ...) takes three's arguments too. A negative radius marks it empty, as in three.
 * @example
 * ```ts
 * import { Sphere, Vector3 } from 'react-pixi-fiber/three';
 *
 * const bounds = new Sphere().setFromPoints([new Vector3(-1, 0, 0), new Vector3(1, 0, 0)]);
 * bounds.radius; // 1
 * ```
 * @category math
 * @advanced
 */
export class Sphere extends PixiSphere {
  /** Always `true`; three duck-types spheres by it */
  public readonly isSphere = true;
  /** The centre */
  declare public readonly center: Vector3;

  /**
   * @param center - The centre; the origin when left out
   * @param radius - The radius; negative for an empty sphere
   */
  constructor(center: Vector3 = new Vector3(), radius = -1) {
    super(center, radius);
  }

  /**
   * Copies another sphere, three's name for `copyFrom`
   * @param sphere - The sphere to copy
   * @returns This sphere
   */
  public copy(sphere: PixiSphere): this {
    return this.copyFrom(sphere);
  }

  /** A new sphere with the same centre and radius */
  public override clone(): Sphere {
    return new Sphere().copyFrom(this);
  }

  /**
   * Fits the sphere around points
   * @param points - The points
   * @param optionalCenter - The centre to use; the centre of the points' box when left out
   * @returns This sphere
   */
  public setFromPoints(points: readonly PointData3D[], optionalCenter?: PointData3D): this {
    if (optionalCenter) this.center.copy(optionalCenter);
    else scratchBox.setFromPoints(points).getCenter(this.center);
    let maxRadiusSq = 0;
    for (const point of points) maxRadiusSq = Math.max(maxRadiusSq, this.center.distanceToSquared(point));
    this.radius = Math.sqrt(maxRadiusSq);
    return this;
  }

  /**
   * Writes the nearest point in the sphere to `point` into `target`
   * @param point - The point
   * @param target - Receives the result
   * @returns `target`
   */
  public clampPoint<T extends Vector3>(point: PointData3D, target: T): T {
    target.copy(point);
    if (this.center.distanceToSquared(point) > this.radius * this.radius) {
      target.sub(this.center).normalize().multiplyScalar(this.radius).add(this.center);
    }
    return target;
  }

  /**
   * Writes the box around this sphere into `target`
   * @param target - Receives the box
   * @returns `target`
   */
  public getBoundingBox<T extends Box>(target: T): T {
    if (this.isEmpty()) {
      target.makeEmpty();
      return target;
    }
    const { x, y, z } = this.center;
    const r = this.radius;
    target.min.set(x - r, y - r, z - r);
    target.max.set(x + r, y + r, z + r);
    return target;
  }

  /**
   * Moves the sphere
   * @param offset - How far to move it
   * @returns This sphere
   */
  public translate(offset: PointData3D): this {
    this.center.add(offset);
    return this;
  }

  /**
   * Grows the sphere just enough to hold a point
   * @param point - The point
   * @returns This sphere
   */
  public expandByPoint(point: PointData3D): this {
    if (this.isEmpty()) {
      this.center.copy(point);
      this.radius = 0;
      return this;
    }
    v1.subVectors(point, this.center);
    const lengthSq = v1.lengthSq();
    if (lengthSq > this.radius * this.radius) {
      const length = Math.sqrt(lengthSq);
      const delta = (length - this.radius) * 0.5;
      this.center.addScaledVector(v1, delta / length);
      this.radius += delta;
    }
    return this;
  }

  /**
   * Grows the sphere just enough to hold another
   * @param sphere - The other sphere
   * @returns This sphere
   */
  public union(sphere: PixiSphere): this {
    if (sphere.isEmpty()) return this;
    if (this.isEmpty()) return this.copyFrom(sphere);
    if (this.center.equals(sphere.center)) {
      this.radius = Math.max(this.radius, sphere.radius);
    } else {
      v2.subVectors(sphere.center, this.center).setLength(sphere.radius);
      this.expandByPoint(v1.copy(sphere.center).add(v2));
      this.expandByPoint(v1.copy(sphere.center).sub(v2));
    }
    return this;
  }
}

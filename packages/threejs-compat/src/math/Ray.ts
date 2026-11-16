import { Ray as PixiRay } from '@pixi/3d';
import type { Plane, PointData3D } from '@pixi/3d';

import { Vector3 } from './Vector3';

const scratch = new Vector3();

/**
 * three's `Ray`: pixi-3d's `Ray`, an `origin` and a normalised `direction`, with the members three adds
 *
 * Everything pixi-3d's ray has (`at`, `closestPointToPoint`, `intersectSphere`, `intersectPlane`,
 * `intersectBox`, `applyMatrix4`, ...) takes three's arguments too.
 * @example
 * ```ts
 * import { Ray, Vector3 } from '@react-fiber/threejs-compat/three';
 *
 * const ray = new Ray(new Vector3(0, 0, 5)).lookAt(new Vector3(0, 0, 0));
 * ray.at(2, new Vector3()); // (0, 0, 3)
 * ```
 * @category math
 * @advanced
 */
export class Ray extends PixiRay {
  /** Where the ray starts */
  declare public readonly origin: Vector3;
  /** Which way it points, normalised */
  declare public readonly direction: Vector3;

  /**
   * @param origin - Where the ray starts; the origin when left out
   * @param direction - Which way it points, normalised; -Z when left out
   */
  constructor(origin: Vector3 = new Vector3(), direction: Vector3 = new Vector3(0, 0, -1)) {
    super(origin, direction);
  }

  /**
   * Copies another ray, three's name for `copyFrom`
   * @param ray - The ray to copy
   * @returns This ray
   */
  public copy(ray: PixiRay): this {
    return this.copyFrom(ray);
  }

  /** A new ray with the same origin and direction */
  public override clone(): Ray {
    return new Ray().copyFrom(this);
  }

  /**
   * Points the ray at a point
   * @param v - The point
   * @returns This ray
   */
  public lookAt(v: PointData3D): this {
    this.direction.copy(v).sub(this.origin).normalize();
    return this;
  }

  /**
   * Moves the origin along the ray
   * @param t - How far
   * @returns This ray
   */
  public recast(t: number): this {
    this.origin.copy(this.at(t, scratch));
    return this;
  }

  /**
   * How far along the ray it meets a plane, or `null` when it never does
   * @param plane - The plane
   */
  public distanceToPlane(plane: Plane): number | null {
    const denominator = plane.normal.dot(this.direction);
    if (denominator === 0) return plane.distanceToPoint(this.origin) === 0 ? 0 : null;
    const t = -(this.origin.dot(plane.normal) + plane.constant) / denominator;
    return t >= 0 ? t : null;
  }

  /**
   * Where the ray crosses a triangle, or `null` when it misses; three's watertight test, so a ray
   * never slips between two triangles that share an edge
   * @param a - The first corner
   * @param b - The second corner
   * @param c - The third corner
   * @param backfaceCulling - Miss a triangle seen from behind
   * @param target - Receives the point
   * @returns `target`, or `null`
   */
  public intersectTriangle<T extends PointData3D>(
    a: PointData3D,
    b: PointData3D,
    c: PointData3D,
    backfaceCulling: boolean,
    target: T,
  ): T | null {
    const { origin, direction } = this;
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;
    const ao = [a.x - origin.x, a.y - origin.y, a.z - origin.z];
    const bo = [b.x - origin.x, b.y - origin.y, b.z - origin.z];
    const co = [c.x - origin.x, c.y - origin.y, c.z - origin.z];
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const adz = Math.abs(dz);
    let kz: number;
    let kx: number;
    let ky: number;

    if (adx >= ady && adx >= adz) {
      kz = 0;
      [kx, ky] = dx >= 0 ? [1, 2] : [2, 1];
    } else if (ady >= adz) {
      kz = 1;
      [kx, ky] = dy >= 0 ? [2, 0] : [0, 2];
    } else {
      kz = 2;
      [kx, ky] = dz >= 0 ? [0, 1] : [1, 0];
    }

    const d = [dx, dy, dz];
    const dkz = d[kz];
    if (dkz === 0) return null;

    const sx = d[kx] / dkz;
    const sy = d[ky] / dkz;
    const sz = 1 / dkz;
    const ax = ao[kx] - sx * ao[kz];
    const ay = ao[ky] - sy * ao[kz];
    const bx = bo[kx] - sx * bo[kz];
    const by = bo[ky] - sy * bo[kz];
    const cx = co[kx] - sx * co[kz];
    const cy = co[ky] - sy * co[kz];
    const u = cx * by - cy * bx;
    const v = ax * cy - ay * cx;
    const w = bx * ay - by * ax;

    if (backfaceCulling ? u < 0 || v < 0 || w < 0 : (u < 0 || v < 0 || w < 0) && (u > 0 || v > 0 || w > 0)) {
      return null;
    }
    const det = u + v + w;
    if (det === 0) return null;
    const tScaled = sz * (u * ao[kz] + v * bo[kz] + w * co[kz]);
    if (det > 0 ? tScaled < 0 : tScaled > 0) return null;

    const t = tScaled / det;
    target.x = origin.x + dx * t;
    target.y = origin.y + dy * t;
    target.z = origin.z + dz * t;
    return target;
  }
}

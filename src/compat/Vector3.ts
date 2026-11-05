import { Vector3 as PixiVector3 } from '@pixi/3d';
import type { Camera3D, Matrix4, PointData3D } from '@pixi/3d';

import { cameraProjection, cameraProjectionInverse, cameraWorld, cameraWorldInverse } from './cameraMatrices';

/**
 * pixi-3d's `Vector3` with the three.js members r3f and typical `useFrame` code call
 *
 * It is the `Vector3` r3f's core gets from the catalog (`getThree().Vector3`), so `unproject`,
 * `copy` and `isVector3` behave as they do in three. Everything pixi-3d's vector already has
 * (`set`, `add`, `distanceTo`, `applyMatrix4`, ...) works unchanged.
 * @example
 * ```ts
 * import { Vector3 } from 'react-pixi-fiber';
 *
 * const target = new Vector3(1, 2, 3);
 * target.lerp(new Vector3(0, 0, 0), 0.5).length(); // 1.87
 * ```
 * @category math
 * @standard
 */
export class Vector3 extends PixiVector3 {
  /** Always `true`; r3f and three duck-type vectors by it */
  public readonly isVector3 = true;

  /**
   * Copies `v` into this vector, three's name for `copyFrom`
   * @param v - The vector to copy
   * @returns This vector
   */
  public copy(v: PointData3D): this {
    return this.copyFrom(v);
  }

  /**
   * Sets all three components to one value
   * @param scalar - The value
   * @returns This vector
   */
  public setScalar(scalar: number): this {
    return this.set(scalar, scalar, scalar);
  }

  /**
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  public sub(v: PointData3D): this {
    return this.subtract(v);
  }

  /**
   * Sets this vector to `a - b`
   * @param a - The vector to subtract from
   * @param b - The vector to subtract
   * @returns This vector
   */
  public subVectors(a: PointData3D, b: PointData3D): this {
    return this.set(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /**
   * Sets this vector to `a + b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  public addVectors(a: PointData3D, b: PointData3D): this {
    return this.set(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  /**
   * Moves this vector toward `v` by `alpha`, 0 to 1
   * @param v - The vector to move toward
   * @param alpha - How far to move: 0 stays, 1 arrives
   * @returns This vector
   */
  public lerp(v: PointData3D, alpha: number): this {
    return this.set(this.x + (v.x - this.x) * alpha, this.y + (v.y - this.y) * alpha, this.z + (v.z - this.z) * alpha);
  }

  /** Length of this vector, three's name for `magnitude` */
  public length(): number {
    return this.magnitude();
  }

  /** Squared length of this vector, three's name for `magnitudeSquared` */
  public lengthSq(): number {
    return this.magnitudeSquared();
  }

  /**
   * Sets this vector to the translation part of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  public setFromMatrixPosition(m: Matrix4): this {
    const e = m.elements;
    return this.set(e[12], e[13], e[14]);
  }

  /**
   * Moves this point from world space into the camera's normalised device coordinates
   * @param camera - The camera to project with
   * @returns This vector
   */
  public project(camera: Camera3D): this {
    return this.applyMatrix4(cameraWorldInverse(camera)).applyMatrix4(cameraProjection(camera));
  }

  /**
   * Moves this point from the camera's normalised device coordinates into world space
   * @param camera - The camera to unproject with
   * @returns This vector
   */
  public unproject(camera: Camera3D): this {
    return this.applyMatrix4(cameraProjectionInverse(camera)).applyMatrix4(cameraWorld(camera));
  }

  /** A new vector with the same components */
  public override clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }
}

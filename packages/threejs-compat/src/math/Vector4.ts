import { Vector4 as PixiVector4 } from '@pixi/3d';
import type { PointData4D, QuaternionData } from '@pixi/3d';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * three's `Vector4`: pixi-3d's `Vector4` with the members three adds
 *
 * Everything pixi-3d's vector has (`set`, `add`, `multiplyScalar`, `normalize`, `applyMatrix4`, ...)
 * takes three's arguments too.
 * @example
 * ```ts
 * import { Vector4 } from '@react-fiber/threejs-compat/three';
 *
 * const rect = new Vector4(0, 0, 400, 300);
 * rect.width; // 400
 * ```
 * @category math
 * @advanced
 */
export class Vector4 extends PixiVector4 {
  /** Always `true`; three duck-types vectors by it */
  public readonly isVector4 = true;

  /** The same as `z`, as three's */
  public get width(): number {
    return this.z;
  }

  public set width(value: number) {
    this.z = value;
  }

  /** The same as `w`, as three's */
  public get height(): number {
    return this.w;
  }

  public set height(value: number) {
    this.w = value;
  }

  /**
   * Copies `v` into this vector, three's name for `copyFrom`; a vector with no `w` sets `w` to 1
   * @param v - The vector to copy
   * @returns This vector
   */
  public copy(v: PointData4D | { x: number; y: number; z: number; w?: number }): this {
    return this.set(v.x, v.y, v.z, v.w ?? 1);
  }

  /** A new vector with the same components */
  public override clone(): Vector4 {
    return new Vector4(this.x, this.y, this.z, this.w);
  }

  /**
   * Sets all four components to one value
   * @param scalar - The value
   * @returns This vector
   */
  public setScalar(scalar: number): this {
    return this.set(scalar, scalar, scalar, scalar);
  }

  /**
   * Sets a component by index
   * @param index - 0 for x, 1 for y, 2 for z, 3 for w
   * @param value - The value
   * @returns This vector
   */
  public setComponent(index: number, value: number): this {
    if (index === 0) this.x = value;
    else if (index === 1) this.y = value;
    else if (index === 2) this.z = value;
    else if (index === 3) this.w = value;
    else throw new Error(`Vector4: index is out of range: ${index}`);
    return this;
  }

  /**
   * A component by index
   * @param index - 0 for x, 1 for y, 2 for z, 3 for w
   */
  public getComponent(index: number): number {
    if (index === 0) return this.x;
    if (index === 1) return this.y;
    if (index === 2) return this.z;
    if (index === 3) return this.w;
    throw new Error(`Vector4: index is out of range: ${index}`);
  }

  /**
   * Adds a number to every component
   * @param s - The number
   * @returns This vector
   */
  public addScalar(s: number): this {
    return this.set(this.x + s, this.y + s, this.z + s, this.w + s);
  }

  /**
   * Sets this vector to `a + b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  public addVectors(a: PointData4D, b: PointData4D): this {
    return this.set(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w);
  }

  /**
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  public sub(v: PointData4D): this {
    return this.set(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
  }

  /**
   * Sets this vector to `a - b`
   * @param a - The vector to subtract from
   * @param b - The vector to subtract
   * @returns This vector
   */
  public subVectors(a: PointData4D, b: PointData4D): this {
    return this.set(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w);
  }

  /**
   * Sets x, y and z to a rotation's axis and w to its angle
   * @param q - A unit quaternion
   * @returns This vector
   */
  public setAxisAngleFromQuaternion(q: QuaternionData): this {
    const w = 2 * Math.acos(q.w);
    const s = Math.sqrt(1 - q.w * q.w);
    if (s < 0.0001) return this.set(1, 0, 0, w);
    return this.set(q.x / s, q.y / s, q.z / s, w);
  }

  /**
   * Sets this vector to the last column of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  public setFromMatrixPosition(m: { elements: ArrayLike<number> }): this {
    const e = m.elements;
    return this.set(e[12], e[13], e[14], e[15]);
  }

  /** Squared length, three's name for `magnitudeSquared` */
  public lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  /** Length, three's name for `magnitude` */
  public length(): number {
    return Math.sqrt(this.lengthSq());
  }

  /** Sum of the absolute components */
  public manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }

  /**
   * Clamps every component between two numbers
   * @param minVal - The lowest value
   * @param maxVal - The highest value
   * @returns This vector
   */
  public clampScalar(minVal: number, maxVal: number): this {
    return this.set(
      clamp(this.x, minVal, maxVal),
      clamp(this.y, minVal, maxVal),
      clamp(this.z, minVal, maxVal),
      clamp(this.w, minVal, maxVal),
    );
  }

  /**
   * Moves this vector toward `v` by `alpha`
   * @param v - The vector to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This vector
   */
  public lerp(v: PointData4D, alpha: number): this {
    return this.set(
      this.x + (v.x - this.x) * alpha,
      this.y + (v.y - this.y) * alpha,
      this.z + (v.z - this.z) * alpha,
      this.w + (v.w - this.w) * alpha,
    );
  }

  /**
   * Sets this vector between `v1` and `v2`
   * @param v1 - The vector at 0
   * @param v2 - The vector at 1
   * @param alpha - How far along
   * @returns This vector
   */
  public lerpVectors(v1: PointData4D, v2: PointData4D, alpha: number): this {
    return this.set(
      v1.x + (v2.x - v1.x) * alpha,
      v1.y + (v2.y - v1.y) * alpha,
      v1.z + (v2.z - v1.z) * alpha,
      v1.w + (v2.w - v1.w) * alpha,
    );
  }

  /**
   * The components in order: x, y, z, w
   * @yields Each in turn
   */
  public *[Symbol.iterator](): Generator<number, void> {
    yield this.x;
    yield this.y;
    yield this.z;
    yield this.w;
  }
}

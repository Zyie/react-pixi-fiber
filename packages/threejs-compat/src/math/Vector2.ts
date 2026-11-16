import { Vector2 as PixiVector2 } from '@pixi/3d';
import type { PointData } from 'pixi.js';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * three's `Vector2`: pixi-3d's `Vector2` with the members three adds
 *
 * Everything pixi-3d's vector has (`set`, `add`, `multiplyScalar`, `normalize`, `rotateAround`, ...)
 * takes three's arguments too. It is the `Vector2` r3f's core builds, and r3f keeps the normalised
 * pointer in one (`state.pointer`).
 * @example
 * ```ts
 * import { useThree } from '@react-fiber/threejs-compat';
 *
 * const pointer = useThree((state) => state.pointer);
 * const fromCentre = pointer.length();
 * ```
 * @category math
 * @standard
 */
export class Vector2 extends PixiVector2 {
  /** Always `true`; three and r3f duck-type vectors by it */
  public readonly isVector2 = true;

  /** The same as `x`, as three's */
  public get width(): number {
    return this.x;
  }

  public set width(value: number) {
    this.x = value;
  }

  /** The same as `y`, as three's */
  public get height(): number {
    return this.y;
  }

  public set height(value: number) {
    this.y = value;
  }

  /**
   * Copies `v` into this vector, three's name for `copyFrom`
   * @param v - The vector to copy
   * @returns This vector
   */
  public copy(v: PointData): this {
    return this.set(v.x, v.y);
  }

  /** A new vector with the same components */
  public override clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Sets both components to one value
   * @param scalar - The value
   * @returns This vector
   */
  public setScalar(scalar: number): this {
    return this.set(scalar, scalar);
  }

  /**
   * Sets x
   * @param x - The value
   * @returns This vector
   */
  public setX(x: number): this {
    this.x = x;
    return this;
  }

  /**
   * Sets y
   * @param y - The value
   * @returns This vector
   */
  public setY(y: number): this {
    this.y = y;
    return this;
  }

  /**
   * Sets a component by index
   * @param index - 0 for x, 1 for y
   * @param value - The value
   * @returns This vector
   */
  public setComponent(index: number, value: number): this {
    if (index === 0) this.x = value;
    else if (index === 1) this.y = value;
    else throw new Error(`Vector2: index is out of range: ${index}`);
    return this;
  }

  /**
   * A component by index
   * @param index - 0 for x, 1 for y
   */
  public getComponent(index: number): number {
    if (index === 0) return this.x;
    if (index === 1) return this.y;
    throw new Error(`Vector2: index is out of range: ${index}`);
  }

  /**
   * Adds a number to both components
   * @param s - The number
   * @returns This vector
   */
  public addScalar(s: number): this {
    return this.set(this.x + s, this.y + s);
  }

  /**
   * Sets this vector to `a + b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  public addVectors(a: PointData, b: PointData): this {
    return this.set(a.x + b.x, a.y + b.y);
  }

  /**
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  public sub(v: PointData): this {
    return this.set(this.x - v.x, this.y - v.y);
  }

  /**
   * Subtracts a number from both components
   * @param s - The number
   * @returns This vector
   */
  public subScalar(s: number): this {
    return this.set(this.x - s, this.y - s);
  }

  /**
   * Sets this vector to `a - b`
   * @param a - The vector to subtract from
   * @param b - The vector to subtract
   * @returns This vector
   */
  public subVectors(a: PointData, b: PointData): this {
    return this.set(a.x - b.x, a.y - b.y);
  }

  /**
   * Clamps both components between two numbers
   * @param minVal - The lowest value
   * @param maxVal - The highest value
   * @returns This vector
   */
  public clampScalar(minVal: number, maxVal: number): this {
    return this.set(clamp(this.x, minVal, maxVal), clamp(this.y, minVal, maxVal));
  }

  /**
   * Clamps this vector's length
   * @param min - The shortest length
   * @param max - The longest length
   * @returns This vector
   */
  public clampLength(min: number, max: number): this {
    const length = this.length();
    return this.divideScalar(length || 1).multiplyScalar(clamp(length, min, max));
  }

  /** Rounds both components down */
  public floor(): this {
    return this.set(Math.floor(this.x), Math.floor(this.y));
  }

  /** Rounds both components up */
  public ceil(): this {
    return this.set(Math.ceil(this.x), Math.ceil(this.y));
  }

  /** Rounds both components to the nearest integer */
  public round(): this {
    return this.set(Math.round(this.x), Math.round(this.y));
  }

  /** Rounds both components toward zero */
  public roundToZero(): this {
    return this.set(Math.trunc(this.x), Math.trunc(this.y));
  }

  /** Squared length, three's name for `magnitudeSquared` */
  public lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** Length, three's name for `magnitude` */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Sum of the absolute components */
  public manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y);
  }

  /**
   * Angle between this vector and `v`, in radians
   * @param v - The other vector
   */
  public angleTo(v: PointData): number {
    const denominator = Math.sqrt(this.lengthSq() * (v.x * v.x + v.y * v.y));
    if (denominator === 0) return Math.PI / 2;
    return Math.acos(clamp((this.x * v.x + this.y * v.y) / denominator, -1, 1));
  }

  /**
   * Manhattan distance to `v`
   * @param v - The other point
   */
  public manhattanDistanceTo(v: PointData): number {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  /**
   * Moves this vector toward `v` by `alpha`
   * @param v - The vector to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This vector
   */
  public lerp(v: PointData, alpha: number): this {
    return this.set(this.x + (v.x - this.x) * alpha, this.y + (v.y - this.y) * alpha);
  }

  /**
   * Sets this vector between `v1` and `v2`
   * @param v1 - The vector at 0
   * @param v2 - The vector at 1
   * @param alpha - How far along
   * @returns This vector
   */
  public lerpVectors(v1: PointData, v2: PointData, alpha: number): this {
    return this.set(v1.x + (v2.x - v1.x) * alpha, v1.y + (v2.y - v1.y) * alpha);
  }

  /** Sets both components to a random number from 0 to 1 */
  public random(): this {
    return this.set(Math.random(), Math.random());
  }

  /**
   * The components in order: x, y
   * @yields Each in turn
   */
  public *[Symbol.iterator](): Generator<number, void> {
    yield this.x;
    yield this.y;
  }
}

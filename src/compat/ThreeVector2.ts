import { Vector2 as PixiVector2 } from '@pixi/3d';
import type { PointData } from 'pixi.js';

/**
 * three's `Vector2`: pixi-3d's `Vector2` with the three.js members r3f and typical `useFrame` code call
 *
 * It is the `Vector2` r3f's core gets from the catalog (`getThree().Vector2`), and r3f keeps the
 * normalised pointer in one (`state.pointer`). The entry's `Vector2` is r3f's math-prop type, so
 * this class takes another name.
 * @example
 * ```ts
 * import { useThree } from 'react-pixi-fiber';
 *
 * const pointer = useThree((state) => state.pointer);
 * const fromCentre = pointer.length();
 * ```
 * @category math
 * @standard
 */
export class ThreeVector2 extends PixiVector2 {
  /** Always `true`; r3f and three duck-type vectors by it */
  public readonly isVector2 = true;

  /**
   * Copies `v` into this vector, three's name for `copyFrom`
   * @param v - The vector to copy
   * @returns This vector
   */
  public copy(v: PointData): this {
    return this.copyFrom(v);
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
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  public sub(v: PointData): this {
    return this.subtract(v);
  }

  /**
   * Moves this vector toward `v` by `alpha`, 0 to 1
   * @param v - The vector to move toward
   * @param alpha - How far to move: 0 stays, 1 arrives
   * @returns This vector
   */
  public lerp(v: PointData, alpha: number): this {
    return this.set(this.x + (v.x - this.x) * alpha, this.y + (v.y - this.y) * alpha);
  }

  /** Length of this vector, three's name for `magnitude` */
  public length(): number {
    return this.magnitude();
  }

  /** A new vector with the same components */
  public override clone(): ThreeVector2 {
    return new ThreeVector2(this.x, this.y);
  }
}

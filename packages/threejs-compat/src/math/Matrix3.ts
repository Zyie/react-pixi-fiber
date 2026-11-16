import { Matrix3 as PixiMatrix3 } from '@pixi/3d';
import type { Vector3 as PixiVector3 } from '@pixi/3d';

// oxlint-disable-next-line typescript/unbound-method -- pixi-3d's own method, called with .call(this)
const pixiToArray = PixiMatrix3.prototype.toArray;

/**
 * three's `Matrix3`: pixi-3d's `Matrix3` with the members three adds
 *
 * The elements are column-major in both, and everything pixi-3d's matrix has (`set` in row-major
 * order, `multiply`, `getNormalMatrix`, `setUvTransform`, ...) takes three's arguments too.
 * @example
 * ```ts
 * import { Matrix3 } from 'react-pixi-fiber/three';
 *
 * const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrixWorld);
 * ```
 * @category math
 * @advanced
 */
export class Matrix3 extends PixiMatrix3 {
  /** Always `true`; three duck-types matrices by it */
  public readonly isMatrix3 = true;

  /**
   * Copies `m` into this matrix, three's name for `copyFrom`
   * @param m - The matrix to copy
   * @returns This matrix
   */
  public copy(m: PixiMatrix3): this {
    this.elements.set(m.elements);
    return this;
  }

  /** A new matrix with the same elements */
  public override clone(): Matrix3 {
    return new Matrix3().copy(this);
  }

  /** Inverts this matrix in place; a matrix with no inverse becomes all zeros, as in three */
  public invert(): this {
    return this.getInverse(this);
  }

  /**
   * Writes the matrix's columns into three vectors
   * @param xAxis - Receives the first column
   * @param yAxis - Receives the second column
   * @param zAxis - Receives the third column
   * @returns This matrix
   */
  public extractBasis(xAxis: PixiVector3, yAxis: PixiVector3, zAxis: PixiVector3): this {
    const e = this.elements;
    xAxis.set(e[0], e[1], e[2]);
    yAxis.set(e[3], e[4], e[5]);
    zAxis.set(e[6], e[7], e[8]);
    return this;
  }

  /**
   * Sets this matrix to a 2D translation
   * @param x - The x offset
   * @param y - The y offset
   * @returns This matrix
   */
  public makeTranslation(x: number, y: number): this {
    return this.set(1, 0, x, 0, 1, y, 0, 0, 1);
  }

  /**
   * Sets this matrix to a 2D rotation
   * @param theta - The angle, in radians
   * @returns This matrix
   */
  public makeRotation(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return this.set(c, -s, 0, s, c, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to a 2D scale
   * @param x - The x scale
   * @param y - The y scale
   * @returns This matrix
   */
  public makeScale(x: number, y: number): this {
    return this.set(x, 0, 0, 0, y, 0, 0, 0, 1);
  }

  /**
   * pixi-3d's `toArray`: the elements in a `Float32Array`, transposed when asked
   * @param transpose - Write rows instead of columns
   * @param out - The array to write into; the matrix's own when left out
   */
  public override toArray(transpose?: boolean, out?: Float32Array): Float32Array;
  /**
   * three's `toArray`: the elements written into an array in column-major order
   * @param array - The array to write into
   * @param offset - Where in the array to start
   */
  public override toArray<T extends number[] | Float32Array>(array: T, offset?: number): T;
  public override toArray(
    array?: boolean | number[] | Float32Array,
    offset?: number | Float32Array,
  ): number[] | Float32Array {
    if (!Array.isArray(array) && !(array instanceof Float32Array && typeof offset !== 'object')) {
      return pixiToArray.call(this, array as boolean | undefined, offset as Float32Array | undefined);
    }
    const start = typeof offset === 'number' ? offset : 0;
    const te = this.elements;
    for (let i = 0; i < 9; i++) array[start + i] = te[i];
    return array;
  }
}

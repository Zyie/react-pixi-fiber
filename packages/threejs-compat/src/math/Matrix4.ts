import { Matrix4 as PixiMatrix4 } from '@pixi/3d';
import type { Matrix3, PointData3D, Quaternion as PixiQuaternion } from '@pixi/3d';

import type { EulerLike } from './Quaternion';
import { Quaternion } from './Quaternion';

const scratchQuaternion = new Quaternion();

// oxlint-disable typescript/unbound-method -- pixi-3d's own methods, kept before the support patches its prototype and called with .call(this)
const pixiMakeRotationFromEuler = PixiMatrix4.prototype.makeRotationFromEuler;
const pixiSetPosition = PixiMatrix4.prototype.setPosition;
const pixiMakeTranslation = PixiMatrix4.prototype.makeTranslation;
const pixiToArray = PixiMatrix4.prototype.toArray;
// oxlint-enable typescript/unbound-method

/**
 * three's `Matrix4`: pixi-3d's `Matrix4` with the members three adds
 *
 * The elements are column-major in both, and everything pixi-3d's matrix has (`set` in row-major
 * order, `multiply`, `compose`, `decompose`, `lookAt`, ...) takes three's arguments too. The elements
 * are a `Float32Array`, where three's are numbers. A node's `matrix` and `matrixWorld` get the same
 * members once a root has loaded the support.
 * @example
 * ```ts
 * import { Matrix4, Quaternion, Vector3 } from '@react-fiber/threejs-compat/three';
 *
 * const m = new Matrix4().compose(new Vector3(0, 1, 0), new Quaternion(), new Vector3(1, 1, 1));
 * mesh.matrix.copy(m);
 * ```
 * @category math
 * @standard
 */
export class Matrix4 extends PixiMatrix4 {
  /** Always `true`; three duck-types matrices by it */
  public readonly isMatrix4 = true;

  /**
   * Copies `m` into this matrix, three's name for `copyFrom`
   * @param m - The matrix to copy
   * @returns This matrix
   */
  public copy(m: PixiMatrix4): this {
    this.elements.set(m.elements);
    return this;
  }

  /** A new matrix with the same elements */
  public override clone(): Matrix4 {
    return new Matrix4().copy(this);
  }

  /** Inverts this matrix in place; a matrix with no inverse becomes all zeros, as in three */
  public invert(): this {
    return this.getInverse(this);
  }

  /**
   * Copies the translation part of `m`
   * @param m - The matrix to read
   * @returns This matrix
   */
  public copyPosition(m: PixiMatrix4): this {
    const te = this.elements;
    const me = m.elements;
    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];
    return this;
  }

  /**
   * Sets the upper 3 by 3 of this matrix to `m` and the rest to identity
   * @param m - The 3 by 3 matrix
   * @returns This matrix
   */
  public setFromMatrix3(m: Matrix3): this {
    const me = m.elements;
    return this.set(me[0], me[3], me[6], 0, me[1], me[4], me[7], 0, me[2], me[5], me[8], 0, 0, 0, 0, 1);
  }

  /**
   * Sets this matrix to the rotation of Euler angles, in their order as three does
   * @param euler - The angles, and their order (`'XYZ'` when left out)
   * @returns This matrix
   */
  public override makeRotationFromEuler(euler: EulerLike): this {
    if (euler.order === undefined || euler.order === 'XYZ') return pixiMakeRotationFromEuler.call(this, euler) as this;
    return this.makeRotationFromQuaternion(scratchQuaternion.setFromEuler(euler) as PixiQuaternion);
  }

  /**
   * Sets the translation part, from a point or from three numbers as in three
   * @param x - The point, or its x
   * @param y - Its y, when `x` is a number; else pixi-3d's matrix to write into
   * @param z - Its z, when `x` is a number
   * @returns This matrix, or pixi-3d's target
   */
  public override setPosition(x: PointData3D | number, y?: number | PixiMatrix4, z?: number): this {
    if (typeof x !== 'number') return pixiSetPosition.call(this, x, typeof y === 'object' ? y : this) as this;
    const te = this.elements;
    te[12] = x;
    te[13] = typeof y === 'number' ? y : 0;
    te[14] = z ?? 0;
    return this;
  }

  /**
   * Sets this matrix to a translation, from three numbers or from a point as in three
   * @param x - The x offset, or a point
   * @param y - The y offset
   * @param z - The z offset
   * @returns This matrix
   */
  public override makeTranslation(x: number | PointData3D, y = 0, z = 0): this {
    if (typeof x === 'number') return pixiMakeTranslation.call(this, x, y, z) as this;
    return pixiMakeTranslation.call(this, x.x, x.y, x.z) as this;
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
    for (let i = 0; i < 16; i++) array[start + i] = te[i];
    return array;
  }
}

/**
 * The members of {@link Matrix4} that pixi-3d's matrices lack or take other arguments for, which a
 * node's `matrix` gets once a root has loaded the support. Each falls back to pixi-3d's own method for
 * pixi-3d's arguments.
 * @internal
 */
export const MATRIX4_MEMBERS: readonly PropertyKey[] = [
  'copy',
  'invert',
  'copyPosition',
  'setFromMatrix3',
  'makeRotationFromEuler',
  'setPosition',
  'makeTranslation',
  'toArray',
];

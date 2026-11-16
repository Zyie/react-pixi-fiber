import { ObservableVector3 } from '@pixi/3d';
import type { PointData3D, QuaternionData } from '@pixi/3d';

import { setQuaternionFromEuler } from './Quaternion';

/**
 * The order an {@link Euler}'s axes turn in, as in three
 * @category math
 * @standard
 */
export type EulerOrder = 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY';

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));
const rotation = { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
const scratchQuaternion: QuaternionData & { set(x: number, y: number, z: number, w: number): void } = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  },
};

/** Writes the rotation matrix of a unit quaternion into the column-major `rotation.elements`, as three's `makeRotationFromQuaternion` */
const setRotationFromQuaternion = ({ x, y, z, w }: QuaternionData): void => {
  const te = rotation.elements;
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  te[0] = 1 - (yy + zz);
  te[4] = xy - wz;
  te[8] = xz + wy;
  te[1] = xy + wz;
  te[5] = 1 - (xx + zz);
  te[9] = yz - wx;
  te[2] = xz - wy;
  te[6] = yz + wx;
  te[10] = 1 - (xx + yy);
};

/** Hands each component change to the Euler's change callback, which a node's rotation turns into its quaternion */
const notify = {
  _onUpdate(euler?: ObservableVector3): void {
    (euler as Euler)._onChangeCallback();
  },
};

/**
 * three's `Euler`: rotation angles in radians about X, Y and Z, turned in `order`
 *
 * A node's `rotation` is one, kept in step with its `quaternion` both ways as in three: set either and
 * the other follows, and `rotation.order` changes how the angles combine. It is a pixi-3d
 * `ObservableVector3` too, so pixi-3d's own `rotation` code takes it.
 * @example
 * ```ts
 * import { Euler } from 'react-pixi-fiber/three';
 *
 * mesh.rotation.order = 'YXZ';
 * mesh.rotation.set(0, Math.PI / 4, 0);
 * const copy = new Euler().copy(mesh.rotation);
 * ```
 * @category math
 * @standard
 */
export class Euler extends ObservableVector3 {
  /** The order a new Euler turns in, as three's `Euler.DEFAULT_ORDER` @default 'XYZ' */
  public static DEFAULT_ORDER: EulerOrder = 'XYZ';
  /** Always `true`; three duck-types Euler angles by it */
  public readonly isEuler = true;
  /** @internal */
  public _order: EulerOrder;

  /**
   * @param x - Angle about X, in radians
   * @param y - Angle about Y, in radians
   * @param z - Angle about Z, in radians
   * @param order - The order the axes turn in
   */
  constructor(x = 0, y = 0, z = 0, order: EulerOrder = Euler.DEFAULT_ORDER) {
    super(notify, x, y, z);
    this._order = order;
  }

  /** The order the axes turn in */
  public get order(): EulerOrder {
    return this._order;
  }

  public set order(value: EulerOrder) {
    this._order = value;
    this._onChangeCallback();
  }

  /**
   * Sets the angles and, optionally, the order
   * @param x - Angle about X, in radians
   * @param y - Angle about Y, in radians; `x` when left out, as pixi-3d's `set`
   * @param z - Angle about Z, in radians; `x` when left out, as pixi-3d's `set`
   * @param order - The axis order; unchanged when left out
   * @returns This Euler
   */
  public override set(x: number = 0, y: number = x, z: number = x, order: EulerOrder = this._order): this {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;
    this._onChangeCallback();
    return this;
  }

  /**
   * Copies another Euler's angles and order, or a point's components
   * @param euler - The Euler, or any `{ x, y, z }`
   * @returns This Euler
   */
  public copy(euler: PointData3D & { order?: EulerOrder }): this {
    return this.set(euler.x, euler.y, euler.z, euler.order ?? this._order);
  }

  /**
   * Copies a point's components, or another Euler's angles and order
   * @param p - The point or Euler
   * @returns This Euler
   */
  public override copyFrom(p: PointData3D & { order?: EulerOrder }): this {
    return this.copy(p);
  }

  /** A new Euler with the same angles and order */
  public override clone(): Euler {
    return new Euler(this._x, this._y, this._z, this._order);
  }

  /**
   * Sets the angles from the rotation part of a matrix, which must be unscaled
   * @param m - The matrix to read
   * @param order - The order to express the angles in; this Euler's own when left out
   * @param update - Run the change callback, which a node's rotation turns into its quaternion
   * @returns This Euler
   */
  public setFromRotationMatrix(
    m: { elements: ArrayLike<number> },
    order: EulerOrder = this._order,
    update = true,
  ): this {
    const te = m.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];

    switch (order) {
      case 'YXZ':
        this._x = Math.asin(-clamp(m23));
        if (Math.abs(m23) < 0.9999999) {
          this._y = Math.atan2(m13, m33);
          this._z = Math.atan2(m21, m22);
        } else {
          this._y = Math.atan2(-m31, m11);
          this._z = 0;
        }
        break;
      case 'ZXY':
        this._x = Math.asin(clamp(m32));
        if (Math.abs(m32) < 0.9999999) {
          this._y = Math.atan2(-m31, m33);
          this._z = Math.atan2(-m12, m22);
        } else {
          this._y = 0;
          this._z = Math.atan2(m21, m11);
        }
        break;
      case 'ZYX':
        this._y = Math.asin(-clamp(m31));
        if (Math.abs(m31) < 0.9999999) {
          this._x = Math.atan2(m32, m33);
          this._z = Math.atan2(m21, m11);
        } else {
          this._x = 0;
          this._z = Math.atan2(-m12, m22);
        }
        break;
      case 'YZX':
        this._z = Math.asin(clamp(m21));
        if (Math.abs(m21) < 0.9999999) {
          this._x = Math.atan2(-m23, m22);
          this._y = Math.atan2(-m31, m11);
        } else {
          this._x = 0;
          this._y = Math.atan2(m13, m33);
        }
        break;
      case 'XZY':
        this._z = Math.asin(-clamp(m12));
        if (Math.abs(m12) < 0.9999999) {
          this._x = Math.atan2(m32, m22);
          this._y = Math.atan2(m13, m11);
        } else {
          this._x = Math.atan2(-m23, m33);
          this._y = 0;
        }
        break;
      default:
        this._y = Math.asin(clamp(m13));
        if (Math.abs(m13) < 0.9999999) {
          this._x = Math.atan2(-m23, m33);
          this._z = Math.atan2(-m12, m11);
        } else {
          this._x = Math.atan2(m32, m22);
          this._z = 0;
        }
    }

    this._order = order;
    if (update) this._onChangeCallback();
    return this;
  }

  /**
   * Sets the angles from a unit quaternion
   * @param q - The rotation
   * @param order - The order to express the angles in; this Euler's own when left out
   * @param update - Run the change callback, which a node's rotation turns into its quaternion
   * @returns This Euler
   */
  public setFromQuaternion(q: QuaternionData, order?: EulerOrder, update?: boolean): this {
    setRotationFromQuaternion(q);
    return this.setFromRotationMatrix(rotation, order, update);
  }

  /**
   * Sets the angles from a vector's components
   * @param v - The angles as `x`, `y` and `z`
   * @param order - The axis order; unchanged when left out
   * @returns This Euler
   */
  public setFromVector3(v: PointData3D, order: EulerOrder = this._order): this {
    return this.set(v.x, v.y, v.z, order);
  }

  /**
   * Expresses the same rotation in another axis order
   * @param newOrder - The order to switch to
   * @returns This Euler
   */
  public reorder(newOrder: EulerOrder): this {
    setQuaternionFromEuler(scratchQuaternion, this._x, this._y, this._z, this._order);
    return this.setFromQuaternion(scratchQuaternion, newOrder);
  }

  /**
   * Whether another Euler has the same angles and order
   * @param euler - The Euler, or any `{ x, y, z }`, whose order counts as this one's when it has none
   */
  public override equals(euler: PointData3D & { order?: EulerOrder }): boolean {
    return (
      euler.x === this._x && euler.y === this._y && euler.z === this._z && (euler.order ?? this._order) === this._order
    );
  }

  /**
   * Sets the angles, and the order when the array has a fourth entry
   * @param array - `[x, y, z]` or `[x, y, z, order]`
   * @param offset - Where in the array to start
   * @returns This Euler
   */
  public override fromArray(array: ArrayLike<number | EulerOrder>, offset = 0): this {
    const order = array[offset + 3];
    return this.set(
      array[offset] as number,
      array[offset + 1] as number,
      array[offset + 2] as number,
      typeof order === 'string' ? order : this._order,
    );
  }

  /**
   * Writes `[x, y, z, order]` into an array, the order as a string as three does
   * @param array - The array to write into
   * @param offset - Where in the array to start
   * @returns `array`
   */
  public override toArray<T extends number[] | Float32Array = number[]>(array: T = [] as unknown as T, offset = 0): T {
    array[offset] = this._x;
    array[offset + 1] = this._y;
    array[offset + 2] = this._z;
    (array as unknown as unknown[])[offset + 3] = this._order;
    return array;
  }

  /**
   * Sets the function called after each change, as three's `Euler._onChange`
   * @param callback - Called with no arguments
   * @returns This Euler
   */
  public _onChange(callback: () => void): this {
    this._onChangeCallback = callback;
    return this;
  }

  /** Called after each change; replaced through `_onChange` */
  public _onChangeCallback(): void {}

  /**
   * The angles and order, in order: x, y, z, order
   * @yields Each in turn
   */
  public *[Symbol.iterator](): Generator<number | EulerOrder, void> {
    yield this._x;
    yield this._y;
    yield this._z;
    yield this._order;
  }
}

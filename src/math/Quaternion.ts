import { Quaternion as PixiQuaternion } from '@pixi/3d';
import type { PointData3D, QuaternionData } from '@pixi/3d';

import type { EulerOrder } from './Euler';

/**
 * Euler angles as three's methods read them: radians, with an optional axis order (`'XYZ'` when left out)
 * @category math
 * @advanced
 */
export interface EulerLike extends PointData3D {
  /** The axis order; `'XYZ'` when left out */
  readonly order?: EulerOrder;
}

interface Settable4 {
  set(x: number, y: number, z: number, w: number): unknown;
}

/**
 * Writes the rotation of Euler angles applied in `order` into `target`, three's `Quaternion.setFromEuler`
 * @param target - Receives the rotation through its `set`
 * @param x - Angle about X, in radians
 * @param y - Angle about Y, in radians
 * @param z - Angle about Z, in radians
 * @param order - The order the axes turn in
 * @returns `target`
 * @internal
 */
export function setQuaternionFromEuler<T extends Settable4>(
  target: T,
  x: number,
  y: number,
  z: number,
  order: EulerOrder = 'XYZ',
): T {
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);

  switch (order) {
    case 'YXZ':
      target.set(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3,
      );
      break;
    case 'ZXY':
      target.set(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3,
      );
      break;
    case 'ZYX':
      target.set(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3,
      );
      break;
    case 'YZX':
      target.set(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 + s1 * c2 * s3,
        c1 * c2 * s3 - s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3,
      );
      break;
    case 'XZY':
      target.set(
        s1 * c2 * c3 - c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 + s1 * s2 * s3,
      );
      break;
    default:
      target.set(
        s1 * c2 * c3 + c1 * s2 * s3,
        c1 * s2 * c3 - s1 * c2 * s3,
        c1 * c2 * s3 + s1 * s2 * c3,
        c1 * c2 * c3 - s1 * s2 * s3,
      );
  }

  return target;
}

/**
 * three's `Quaternion`: pixi-3d's `Quaternion` with the members three adds
 *
 * Everything pixi-3d's quaternion has (`set`, `multiply`, `slerp`, `setFromAxisAngle`, ...) takes
 * three's arguments too. `setFromEuler` reads an {@link Euler}'s order, where pixi-3d's turns in XYZ
 * only. A node's `quaternion` gets the same members once a root has loaded the support.
 * @example
 * ```ts
 * import { Quaternion, Vector3 } from 'react-pixi-fiber/three';
 *
 * const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
 * mesh.quaternion.slerp(turn, 0.1);
 * ```
 * @category math
 * @standard
 */
export class Quaternion extends PixiQuaternion {
  /** Always `true`; three duck-types quaternions by it */
  public readonly isQuaternion = true;

  /**
   * Copies `q` into this quaternion, three's name for `copyFrom`
   * @param q - The quaternion to copy
   * @returns This quaternion
   */
  public copy(q: QuaternionData): this {
    this.set(q.x, q.y, q.z, q.w);
    return this;
  }

  /** A new quaternion with the same components */
  public override clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Sets this quaternion from Euler angles, in the Euler's order as three does
   * @param euler - The angles, and their order (`'XYZ'` when left out)
   * @param out - pixi-3d's target to write into instead; three passes a boolean here, which is ignored
   * @returns This quaternion, or `out`
   */
  public override setFromEuler(euler: EulerLike, out?: QuaternionData | boolean): this {
    if (typeof out === 'object') return super.setFromEuler(euler, out);
    return setQuaternionFromEuler(this, euler.x, euler.y, euler.z, euler.order);
  }

  /** Inverts this rotation, three's name for `inverse`; a unit quaternion's inverse is its conjugate */
  public invert(): this {
    return this.conjugate();
  }

  /** Length of the four components, three's name for `magnitude` */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  /** Squared length of the four components */
  public lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  /**
   * Sets this quaternion to `a × b`
   * @param a - The first rotation
   * @param b - The second rotation
   * @returns This quaternion
   */
  public multiplyQuaternions(a: QuaternionData, b: QuaternionData): this {
    const { x: ax, y: ay, z: az, w: aw } = a;
    const { x: bx, y: by, z: bz, w: bw } = b;

    this.set(
      ax * bw + aw * bx + ay * bz - az * by,
      ay * bw + aw * by + az * bx - ax * bz,
      az * bw + aw * bz + ax * by - ay * bx,
      aw * bw - ax * bx - ay * by - az * bz,
    );
    return this;
  }

  /**
   * Turns this rotation toward `q` by at most `step` radians
   * @param q - The rotation to turn toward
   * @param step - The largest angle to turn by
   * @returns This quaternion
   */
  public rotateTowards(q: QuaternionData, step: number): this {
    const angle = this.angleTo(q);
    if (angle === 0) return this;
    this.slerp(q, Math.min(1, step / angle));
    return this;
  }

  /**
   * Sets this quaternion to the spherical blend of `a` and `b`
   * @param a - The rotation at 0
   * @param b - The rotation at 1
   * @param t - How far along, 0 to 1
   * @returns This quaternion
   */
  public slerpQuaternions(a: QuaternionData, b: QuaternionData, t: number): this {
    return this.copy(a).slerp(b, t);
  }

  /** Sets this quaternion to a uniformly random rotation */
  public random(): this {
    const theta1 = 2 * Math.PI * Math.random();
    const theta2 = 2 * Math.PI * Math.random();
    const x0 = Math.random();
    const r1 = Math.sqrt(1 - x0);
    const r2 = Math.sqrt(x0);

    this.set(r1 * Math.sin(theta1), r1 * Math.cos(theta1), r2 * Math.sin(theta2), r2 * Math.cos(theta2));
    return this;
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

/**
 * The members of {@link Quaternion} pixi-3d's quaternions lack, which a node's `quaternion` gets once a
 * root has loaded the support
 * @internal
 */
export const QUATERNION_MEMBERS: readonly PropertyKey[] = [
  'copy',
  'invert',
  'length',
  'lengthSq',
  'multiplyQuaternions',
  'rotateTowards',
  'slerpQuaternions',
  'random',
  Symbol.iterator,
];

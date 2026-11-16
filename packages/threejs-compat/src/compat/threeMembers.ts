import type { Camera3D, Matrix3, Matrix4, PointData3D, QuaternionData } from '@pixi/3d';

import type { EulerLike } from '../math/Quaternion';
import type { BufferAttributeLike } from '../math/Vector3';

/**
 * The members three's `Vector3` has and pixi-3d's `ObservableVector3` lacks, which a node's `position`
 * and `scale` get once a root has loaded the support
 * @category compat
 * @advanced
 */
export interface ThreeVector3Members {
  /** Always `true`; three and r3f duck-type vectors by it */
  readonly isVector3: true;
  /**
   * Copies `v` into this vector, three's name for `copyFrom`
   * @param v - The vector to copy
   * @returns This vector
   */
  copy(v: PointData3D): this;
  /**
   * Sets all three components to one value
   * @param scalar - The value
   * @returns This vector
   */
  setScalar(scalar: number): this;
  /**
   * Sets x
   * @param x - The value
   * @returns This vector
   */
  setX(x: number): this;
  /**
   * Sets y
   * @param y - The value
   * @returns This vector
   */
  setY(y: number): this;
  /**
   * Sets z
   * @param z - The value
   * @returns This vector
   */
  setZ(z: number): this;
  /**
   * Sets a component by index
   * @param index - 0 for x, 1 for y, 2 for z
   * @param value - The value
   * @returns This vector
   */
  setComponent(index: number, value: number): this;
  /**
   * A component by index
   * @param index - 0 for x, 1 for y, 2 for z
   */
  getComponent(index: number): number;
  /**
   * Adds a number to every component
   * @param s - The number
   * @returns This vector
   */
  addScalar(s: number): this;
  /**
   * Sets this vector to `a + b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  addVectors(a: PointData3D, b: PointData3D): this;
  /**
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  sub(v: PointData3D): this;
  /**
   * Subtracts a number from every component
   * @param s - The number
   * @returns This vector
   */
  subScalar(s: number): this;
  /**
   * Sets this vector to `a - b`
   * @param a - The vector to subtract from
   * @param b - The vector to subtract
   * @returns This vector
   */
  subVectors(a: PointData3D, b: PointData3D): this;
  /**
   * Sets this vector to `a * b`, component by component
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  multiplyVectors(a: PointData3D, b: PointData3D): this;
  /**
   * Rotates this vector by Euler angles, in their order
   * @param euler - The angles
   * @returns This vector
   */
  applyEuler(euler: EulerLike): this;
  /**
   * Rotates this vector about a normalised axis
   * @param axis - The axis
   * @param angle - The angle, in radians
   * @returns This vector
   */
  applyAxisAngle(axis: PointData3D, angle: number): this;
  /**
   * Multiplies this vector by a normal matrix and normalises it
   * @param m - The normal matrix
   * @returns This vector
   */
  applyNormalMatrix(m: Matrix3): this;
  /**
   * Moves this point from world space into the camera's normalised device coordinates
   * @param camera - The camera to project with
   * @returns This vector
   */
  project(camera: Camera3D): this;
  /**
   * Moves this point from the camera's normalised device coordinates into world space
   * @param camera - The camera to unproject with
   * @returns This vector
   */
  unproject(camera: Camera3D): this;
  /**
   * Clamps every component between two numbers
   * @param minVal - The lowest value
   * @param maxVal - The highest value
   * @returns This vector
   */
  clampScalar(minVal: number, maxVal: number): this;
  /**
   * Clamps this vector's length
   * @param min - The shortest length
   * @param max - The longest length
   * @returns This vector
   */
  clampLength(min: number, max: number): this;
  /** Rounds every component down */
  floor(): this;
  /** Rounds every component up */
  ceil(): this;
  /** Rounds every component to the nearest integer */
  round(): this;
  /** Rounds every component toward zero */
  roundToZero(): this;
  /** Squared length, three's name for `magnitudeSquared` */
  lengthSq(): number;
  /** Length, three's name for `magnitude` */
  length(): number;
  /** Sum of the absolute components */
  manhattanLength(): number;
  /**
   * Moves this vector toward `v` by `alpha`
   * @param v - The vector to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This vector
   */
  lerp(v: PointData3D, alpha: number): this;
  /**
   * Sets this vector between `v1` and `v2`
   * @param v1 - The vector at 0
   * @param v2 - The vector at 1
   * @param alpha - How far along
   * @returns This vector
   */
  lerpVectors(v1: PointData3D, v2: PointData3D, alpha: number): this;
  /**
   * Sets this vector to `a × b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  crossVectors(a: PointData3D, b: PointData3D): this;
  /**
   * Projects this vector onto another
   * @param v - The vector to project onto
   * @returns This vector
   */
  projectOnVector(v: PointData3D): this;
  /**
   * Projects this vector onto the plane with a normal
   * @param planeNormal - The plane's normal
   * @returns This vector
   */
  projectOnPlane(planeNormal: PointData3D): this;
  /**
   * Reflects this vector off the plane with a normal
   * @param normal - The plane's normal, normalised
   * @returns This vector
   */
  reflect(normal: PointData3D): this;
  /**
   * Manhattan distance to `v`
   * @param v - The other point
   */
  manhattanDistanceTo(v: PointData3D): number;
  /**
   * Sets this vector from spherical coordinates, as three does
   * @param radius - Distance from the origin
   * @param phi - Polar angle from +Y, in radians
   * @param theta - Azimuth about Y from +Z, in radians
   * @returns This vector
   */
  setFromSphericalCoords(radius: number, phi: number, theta: number): this;
  /**
   * Sets this vector from cylindrical coordinates, as three does
   * @param radius - Distance from the Y axis
   * @param theta - Azimuth about Y from +Z, in radians
   * @param y - Height
   * @returns This vector
   */
  setFromCylindricalCoords(radius: number, theta: number, y: number): this;
  /**
   * Sets this vector to the translation part of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  setFromMatrixPosition(m: Matrix4 | { elements: ArrayLike<number> }): this;
  /**
   * Sets this vector to the scale along each axis of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  setFromMatrixScale(m: Matrix4 | { elements: ArrayLike<number> }): this;
  /**
   * Sets this vector to a column of a 3 by 3 matrix
   * @param m - The matrix to read
   * @param index - The column, 0 to 2
   * @returns This vector
   */
  setFromMatrix3Column(m: Matrix3 | { elements: ArrayLike<number> }, index: number): this;
  /**
   * Sets this vector to Euler angles' x, y and z
   * @param e - The angles
   * @returns This vector
   */
  setFromEuler(e: PointData3D): this;
  /**
   * Sets this vector to a colour's r, g and b
   * @param c - The colour
   * @returns This vector
   */
  setFromColor(c: { r: number; g: number; b: number }): this;
  /**
   * Sets this vector from one vertex of a buffer attribute
   * @param attribute - The attribute
   * @param index - The vertex
   * @returns This vector
   */
  fromBufferAttribute(attribute: BufferAttributeLike, index: number): this;
  /** Sets every component to a random number from 0 to 1 */
  random(): this;
  /** Sets this vector to a random direction of length 1 */
  randomDirection(): this;
}

/**
 * The members three's `Quaternion` has and pixi-3d's `ObservableQuaternion` lacks, which a node's
 * `quaternion` gets once a root has loaded the support
 * @category compat
 * @advanced
 */
export interface ThreeQuaternionMembers {
  /** Always `true`; three duck-types quaternions by it */
  readonly isQuaternion: true;
  /**
   * The components in order: x, y, z, w
   * @yields Each in turn
   */
  [Symbol.iterator](): Generator<number, void>;
  /**
   * Copies `q` into this quaternion, three's name for `copyFrom`
   * @param q - The quaternion to copy
   * @returns This quaternion
   */
  copy(q: QuaternionData): this;
  /** Inverts this rotation, three's name for `inverse`; a unit quaternion's inverse is its conjugate */
  invert(): this;
  /** Length of the four components, three's name for `magnitude` */
  length(): number;
  /** Squared length of the four components */
  lengthSq(): number;
  /**
   * Sets this quaternion to `a × b`
   * @param a - The first rotation
   * @param b - The second rotation
   * @returns This quaternion
   */
  multiplyQuaternions(a: QuaternionData, b: QuaternionData): this;
  /**
   * Turns this rotation toward `q` by at most `step` radians
   * @param q - The rotation to turn toward
   * @param step - The largest angle to turn by
   * @returns This quaternion
   */
  rotateTowards(q: QuaternionData, step: number): this;
  /**
   * Sets this quaternion to the spherical blend of `a` and `b`
   * @param a - The rotation at 0
   * @param b - The rotation at 1
   * @param t - How far along, 0 to 1
   * @returns This quaternion
   */
  slerpQuaternions(a: QuaternionData, b: QuaternionData, t: number): this;
  /** Sets this quaternion to a uniformly random rotation */
  random(): this;
}

/**
 * The members three's `Matrix4` has and pixi-3d's lacks, which a node's `matrix` gets once a root has
 * loaded the support
 * @category compat
 * @advanced
 */
export interface ThreeMatrix4Members {
  /** Always `true`; three duck-types matrices by it */
  readonly isMatrix4: true;
  /**
   * Copies `m` into this matrix, three's name for `copyFrom`
   * @param m - The matrix to copy
   * @returns This matrix
   */
  copy(m: Matrix4): this;
  /** Inverts this matrix in place; a matrix with no inverse becomes all zeros, as in three */
  invert(): this;
  /**
   * Copies the translation part of `m`
   * @param m - The matrix to read
   * @returns This matrix
   */
  copyPosition(m: Matrix4): this;
  /**
   * Sets the upper 3 by 3 of this matrix to `m` and the rest to identity
   * @param m - The 3 by 3 matrix
   * @returns This matrix
   */
  setFromMatrix3(m: Matrix3): this;
}

declare module '@pixi/3d' {
  interface ObservableVector3 extends ThreeVector3Members {}
  interface ObservableQuaternion extends ThreeQuaternionMembers {}
  interface Matrix4 extends ThreeMatrix4Members {}
}

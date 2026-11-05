import { Vector3 as PixiVector3 } from '@pixi/3d';
import type { Camera3D, Matrix3, Matrix4, PointData3D } from '@pixi/3d';

import { cameraProjection, cameraProjectionInverse, cameraWorld, cameraWorldInverse } from '../compat/cameraMatrices';
import type { EulerLike } from './Quaternion';
import { Quaternion } from './Quaternion';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const scratchQuaternion = new Quaternion();

/**
 * What three's `fromBufferAttribute` reads from: per-vertex components by index
 * @category math
 * @advanced
 */
export interface BufferAttributeLike {
  /** The x component of vertex `index` */
  getX(index: number): number;
  /** The y component of vertex `index` */
  getY(index: number): number;
  /** The z component of vertex `index` */
  getZ(index: number): number;
}

/**
 * three's `Vector3`: pixi-3d's `Vector3` with the members three adds
 *
 * Everything pixi-3d's vector has (`set`, `add`, `multiplyScalar`, `normalize`, `applyMatrix4`,
 * `distanceTo`, ...) takes three's arguments too, so three code runs unchanged. It is the `Vector3`
 * r3f's core builds, and a node's `position` and `scale` get the same members once a root has loaded
 * the support.
 * @example
 * ```ts
 * import { Vector3 } from 'react-pixi-fiber/three';
 *
 * const target = new Vector3(1, 2, 3);
 * mesh.position.lerp(target, 0.1);
 * ```
 * @category math
 * @standard
 */
export class Vector3 extends PixiVector3 {
  /** Always `true`; three and r3f duck-type vectors by it */
  public readonly isVector3 = true;

  /**
   * Copies `v` into this vector, three's name for `copyFrom`
   * @param v - The vector to copy
   * @returns This vector
   */
  public copy(v: PointData3D): this {
    return this.set(v.x, v.y, v.z);
  }

  /** A new vector with the same components */
  public override clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
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
   * Sets z
   * @param z - The value
   * @returns This vector
   */
  public setZ(z: number): this {
    this.z = z;
    return this;
  }

  /**
   * Sets a component by index
   * @param index - 0 for x, 1 for y, 2 for z
   * @param value - The value
   * @returns This vector
   */
  public setComponent(index: number, value: number): this {
    if (index === 0) this.x = value;
    else if (index === 1) this.y = value;
    else if (index === 2) this.z = value;
    else throw new Error(`Vector3: index is out of range: ${index}`);
    return this;
  }

  /**
   * A component by index
   * @param index - 0 for x, 1 for y, 2 for z
   */
  public getComponent(index: number): number {
    if (index === 0) return this.x;
    if (index === 1) return this.y;
    if (index === 2) return this.z;
    throw new Error(`Vector3: index is out of range: ${index}`);
  }

  /**
   * Adds a number to every component
   * @param s - The number
   * @returns This vector
   */
  public addScalar(s: number): this {
    return this.set(this.x + s, this.y + s, this.z + s);
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
   * Subtracts `v` from this vector, three's name for `subtract`
   * @param v - The vector to subtract
   * @returns This vector
   */
  public sub(v: PointData3D): this {
    return this.set(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  /**
   * Subtracts a number from every component
   * @param s - The number
   * @returns This vector
   */
  public subScalar(s: number): this {
    return this.set(this.x - s, this.y - s, this.z - s);
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
   * Sets this vector to `a * b`, component by component
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  public multiplyVectors(a: PointData3D, b: PointData3D): this {
    return this.set(a.x * b.x, a.y * b.y, a.z * b.z);
  }

  /**
   * Rotates this vector by Euler angles, in their order
   * @param euler - The angles
   * @returns This vector
   */
  public applyEuler(euler: EulerLike): this {
    return this.applyQuaternion(scratchQuaternion.setFromEuler(euler));
  }

  /**
   * Rotates this vector about a normalised axis
   * @param axis - The axis
   * @param angle - The angle, in radians
   * @returns This vector
   */
  public applyAxisAngle(axis: PointData3D, angle: number): this {
    return this.applyQuaternion(scratchQuaternion.setFromAxisAngle(axis, angle));
  }

  /**
   * Multiplies this vector by a normal matrix and normalises it
   * @param m - The normal matrix
   * @returns This vector
   */
  public applyNormalMatrix(m: Matrix3): this {
    return this.applyMatrix3(m).normalize();
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

  /**
   * Clamps every component between two numbers
   * @param minVal - The lowest value
   * @param maxVal - The highest value
   * @returns This vector
   */
  public clampScalar(minVal: number, maxVal: number): this {
    return this.set(clamp(this.x, minVal, maxVal), clamp(this.y, minVal, maxVal), clamp(this.z, minVal, maxVal));
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

  /** Rounds every component down */
  public floor(): this {
    return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
  }

  /** Rounds every component up */
  public ceil(): this {
    return this.set(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
  }

  /** Rounds every component to the nearest integer */
  public round(): this {
    return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z));
  }

  /** Rounds every component toward zero */
  public roundToZero(): this {
    return this.set(Math.trunc(this.x), Math.trunc(this.y), Math.trunc(this.z));
  }

  /** Squared length, three's name for `magnitudeSquared` */
  public lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /** Length, three's name for `magnitude` */
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  /** Sum of the absolute components */
  public manhattanLength(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  /**
   * Moves this vector toward `v` by `alpha`
   * @param v - The vector to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This vector
   */
  public lerp(v: PointData3D, alpha: number): this {
    return this.set(this.x + (v.x - this.x) * alpha, this.y + (v.y - this.y) * alpha, this.z + (v.z - this.z) * alpha);
  }

  /**
   * Sets this vector between `v1` and `v2`
   * @param v1 - The vector at 0
   * @param v2 - The vector at 1
   * @param alpha - How far along
   * @returns This vector
   */
  public lerpVectors(v1: PointData3D, v2: PointData3D, alpha: number): this {
    return this.set(v1.x + (v2.x - v1.x) * alpha, v1.y + (v2.y - v1.y) * alpha, v1.z + (v2.z - v1.z) * alpha);
  }

  /**
   * Sets this vector to `a × b`
   * @param a - The first vector
   * @param b - The second vector
   * @returns This vector
   */
  public crossVectors(a: PointData3D, b: PointData3D): this {
    const { x: ax, y: ay, z: az } = a;
    const { x: bx, y: by, z: bz } = b;
    return this.set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }

  /**
   * Projects this vector onto another
   * @param v - The vector to project onto
   * @returns This vector
   */
  public projectOnVector(v: PointData3D): this {
    const denominator = v.x * v.x + v.y * v.y + v.z * v.z;
    if (denominator === 0) return this.set(0, 0, 0);
    const scalar = (v.x * this.x + v.y * this.y + v.z * this.z) / denominator;
    return this.set(v.x * scalar, v.y * scalar, v.z * scalar);
  }

  /**
   * Projects this vector onto the plane with a normal
   * @param planeNormal - The plane's normal
   * @returns This vector
   */
  public projectOnPlane(planeNormal: PointData3D): this {
    const denominator = planeNormal.x * planeNormal.x + planeNormal.y * planeNormal.y + planeNormal.z * planeNormal.z;
    if (denominator === 0) return this;
    const scalar = (planeNormal.x * this.x + planeNormal.y * this.y + planeNormal.z * this.z) / denominator;
    return this.set(this.x - planeNormal.x * scalar, this.y - planeNormal.y * scalar, this.z - planeNormal.z * scalar);
  }

  /**
   * Reflects this vector off the plane with a normal
   * @param normal - The plane's normal, normalised
   * @returns This vector
   */
  public reflect(normal: PointData3D): this {
    const d = 2 * (this.x * normal.x + this.y * normal.y + this.z * normal.z);
    return this.set(this.x - normal.x * d, this.y - normal.y * d, this.z - normal.z * d);
  }

  /**
   * Manhattan distance to `v`
   * @param v - The other point
   */
  public manhattanDistanceTo(v: PointData3D): number {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);
  }

  /**
   * Sets this vector from spherical coordinates, as three does
   * @param radius - Distance from the origin
   * @param phi - Polar angle from +Y, in radians
   * @param theta - Azimuth about Y from +Z, in radians
   * @returns This vector
   */
  public setFromSphericalCoords(radius: number, phi: number, theta: number): this {
    const sinPhiRadius = Math.sin(phi) * radius;
    return this.set(sinPhiRadius * Math.sin(theta), Math.cos(phi) * radius, sinPhiRadius * Math.cos(theta));
  }

  /**
   * Sets this vector from cylindrical coordinates, as three does
   * @param radius - Distance from the Y axis
   * @param theta - Azimuth about Y from +Z, in radians
   * @param y - Height
   * @returns This vector
   */
  public setFromCylindricalCoords(radius: number, theta: number, y: number): this {
    return this.set(radius * Math.sin(theta), y, radius * Math.cos(theta));
  }

  /**
   * Sets this vector to the translation part of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  public setFromMatrixPosition(m: Matrix4 | { elements: ArrayLike<number> }): this {
    const e = m.elements;
    return this.set(e[12], e[13], e[14]);
  }

  /**
   * Sets this vector to the scale along each axis of a matrix
   * @param m - The matrix to read
   * @returns This vector
   */
  public setFromMatrixScale(m: Matrix4 | { elements: ArrayLike<number> }): this {
    const e = m.elements;
    return this.set(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
  }

  /**
   * Sets this vector to a column of a 3 by 3 matrix
   * @param m - The matrix to read
   * @param index - The column, 0 to 2
   * @returns This vector
   */
  public setFromMatrix3Column(m: Matrix3 | { elements: ArrayLike<number> }, index: number): this {
    const e = m.elements;
    return this.set(e[index * 3], e[index * 3 + 1], e[index * 3 + 2]);
  }

  /**
   * Sets this vector to Euler angles' x, y and z
   * @param e - The angles
   * @returns This vector
   */
  public setFromEuler(e: PointData3D): this {
    return this.set(e.x, e.y, e.z);
  }

  /**
   * Sets this vector to a colour's r, g and b
   * @param c - The colour
   * @returns This vector
   */
  public setFromColor(c: { r: number; g: number; b: number }): this {
    return this.set(c.r, c.g, c.b);
  }

  /**
   * Sets this vector from one vertex of a buffer attribute
   * @param attribute - The attribute
   * @param index - The vertex
   * @returns This vector
   */
  public fromBufferAttribute(attribute: BufferAttributeLike, index: number): this {
    return this.set(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }

  /** Sets every component to a random number from 0 to 1 */
  public random(): this {
    return this.set(Math.random(), Math.random(), Math.random());
  }

  /** Sets this vector to a random direction of length 1 */
  public randomDirection(): this {
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const c = Math.sqrt(1 - u * u);
    return this.set(c * Math.cos(theta), u, c * Math.sin(theta));
  }

  /**
   * The components in order: x, y, z
   * @yields Each in turn
   */
  public *[Symbol.iterator](): Generator<number, void> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}

/**
 * The members of {@link Vector3} pixi-3d's `ObservableVector3` lacks, which a node's `position` and
 * `scale` get once a root has loaded the support
 * @internal
 */
export const VECTOR3_MEMBERS: readonly PropertyKey[] = [
  'copy',
  'setScalar',
  'setX',
  'setY',
  'setZ',
  'setComponent',
  'getComponent',
  'addScalar',
  'addVectors',
  'sub',
  'subScalar',
  'subVectors',
  'multiplyVectors',
  'applyEuler',
  'applyAxisAngle',
  'applyNormalMatrix',
  'project',
  'unproject',
  'clampScalar',
  'clampLength',
  'floor',
  'ceil',
  'round',
  'roundToZero',
  'lengthSq',
  'length',
  'manhattanLength',
  'lerp',
  'lerpVectors',
  'crossVectors',
  'projectOnVector',
  'projectOnPlane',
  'reflect',
  'manhattanDistanceTo',
  'setFromSphericalCoords',
  'setFromCylindricalCoords',
  'setFromMatrixPosition',
  'setFromMatrixScale',
  'setFromMatrix3Column',
  'setFromEuler',
  'setFromColor',
  'fromBufferAttribute',
  'random',
  'randomDirection',
  Symbol.iterator,
];

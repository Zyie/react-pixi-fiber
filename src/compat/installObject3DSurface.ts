import {
  BaseMaterial3D,
  Camera3D,
  Container3D,
  EulerDegrees,
  Geometry3D,
  Light,
  Matrix4 as PixiMatrix4,
  Mesh3D,
  Model3D,
  ObservableQuaternion,
  ObservableVector3,
  Sprite3D,
} from '@pixi/3d';
import type { PointData3D, QuaternionData } from '@pixi/3d';
import { Container, DEG_TO_RAD, FederatedEvent } from 'pixi.js';

import { installTextureTracking } from '../catalog/textures/textureTransform';
import { Euler } from '../math/Euler';
import type { EulerOrder } from '../math/Euler';
import { MATRIX4_MEMBERS, Matrix4 } from '../math/Matrix4';
import { QUATERNION_MEMBERS, Quaternion, setQuaternionFromEuler } from '../math/Quaternion';
import type { EulerLike } from '../math/Quaternion';
import { VECTOR3_MEMBERS, Vector3 } from '../math/Vector3';
import { cameraProjection, cameraProjectionInverse, cameraWorldInverse } from './cameraMatrices';
import { placeholderGeometry, placeholderMaterial } from './placeholders';
import { installRaycasting } from './Raycaster';
import type { Intersection, Raycaster } from './Raycaster';
import './threeMembers';

/**
 * The three.js `Object3D` members every pixi-3d `Container3D` gets, so r3f's core and three code can
 * drive any node, including the ones pixi-3d builds itself (glTF nodes passed to `<primitive>`)
 *
 * r3f duck-types the scene graph: `isObject3D` decides whether a child joins its parent, `uuid`
 * keys pointer hits, `add`/`remove` attach and detach, `raycast` answers picking, and `dispose`
 * runs when an element unmounts. The rest is three's: `rotation` becomes an `Euler` with an `order`,
 * kept in step with `quaternion` both ways; `position` and `scale` get three's vector methods; and
 * `matrix` is the local transform, which `matrixAutoUpdate = false` leaves as you set it.
 *
 * The catalog's classes re-declare `rotation` as an `Euler` and `lookAt` with three's arguments. On
 * pixi-3d's own classes the types stay pixi-3d's; the values are the same.
 * @category compat
 * @advanced
 */
export interface Object3DMembers {
  /** Always `true`; r3f adds a child to its parent only when both have it */
  readonly isObject3D: true;
  /** A number unique to this node, from pixi's `uid` */
  readonly id: number;
  /** A string unique to this node, from pixi's `uid` */
  readonly uuid: string;
  /** three's name for `label`; `useGraph` and `getObjectByName` find nodes by it */
  name: string;
  /**
   * three's class name: `'Object3D'`, `'Mesh'`, `'Group'`, `'PerspectiveCamera'`, ...; pixi-3d's
   * lights keep their own (`'directional'`), which their shaders read
   */
  readonly type: string;
  /** Free-form data, created on first read */
  userData: Record<string, unknown>;
  /** The up direction `lookAt` keeps: `(0, 1, 0)` unless you change it, as three's `DEFAULT_UP` */
  up: Vector3;
  /**
   * The local transform. With `matrixAutoUpdate` on, it is built from `position`, `quaternion` and
   * `scale` when read; with it off, it stays as you set it and the node draws with it.
   */
  matrix: PixiMatrix4;
  /** Local space to world space, worked out when read */
  readonly matrixWorld: Matrix4;
  /**
   * Build `matrix` from `position`, `quaternion` and `scale`; turn it off to set `matrix` yourself,
   * as in three @default true
   */
  matrixAutoUpdate: boolean;
  /** Kept for three's shape: the world transform is always worked out from `matrix` @default true */
  matrixWorldAutoUpdate: boolean;
  /** Setting it marks the world transform to be worked out again; it reads `false` */
  matrixWorldNeedsUpdate: boolean;
  /** Kept for three's shape: pixi-3d sorts draws by pipeline and depth, not by a number @default 0 */
  renderOrder: number;
  /** Kept for three's shape: pixi-3d's view culls every mesh, by its `cull` setting @default true */
  frustumCulled: boolean;
  /** Adds children, three's name for `addChild` */
  add(...objects: Container3D[]): this;
  /** Removes children, three's name for `removeChild` */
  remove(...objects: Container3D[]): this;
  /** Removes every child; it returns the node, as three's does */
  clear(): void;
  /**
   * Adds a node as a child without moving it in the world, as three's `attach`
   * @param object - The node to move under this one
   */
  attach(object: Container3D): this;
  /**
   * Dispatches a pixi federated event as a pixi.js `Container` does, and handles the plain event
   * objects r3f sends as three's `EventDispatcher` would
   *
   * r3f inserts before a sibling by splicing the child into `parent.children`, setting `parent`
   * itself, then dispatching `{ type: 'added' }`. On that event the child is spliced back out and
   * re-added through `addChildAt`, so the view attaches it and pixi-3d's own events fire as for any
   * add. Other plain events, such as r3f's `childadded`, have no listeners here and do nothing.
   */
  dispatchEvent(event: { type: string }): void;
  /**
   * The first node, this one or a descendant, whose `id` matches
   * @param id - The id
   */
  getObjectById(id: number): Container3D | undefined;
  /**
   * The first node, this one or a descendant, whose `name` matches
   * @param name - The name
   */
  getObjectByName(name: string): Container3D | undefined;
  /**
   * The first node, this one or a descendant, whose property `name` is `value`
   * @param name - The property
   * @param value - The value to match
   */
  getObjectByProperty(name: string, value: unknown): Container3D | undefined;
  /**
   * Every node, this one and its descendants, whose property `name` is `value`
   * @param name - The property
   * @param value - The value to match
   * @param result - The list to add them to
   */
  getObjectsByProperty(name: string, value: unknown, result?: Container3D[]): Container3D[];
  /** Writes this node's world position into `target` */
  getWorldPosition<T extends PointData3D>(target: T): T;
  /** Writes this node's world rotation into `target` */
  getWorldQuaternion<T extends QuaternionData>(target: T): T;
  /** Writes this node's world scale into `target` */
  getWorldScale<T extends PointData3D>(target: T): T;
  /** Writes the direction this node's +Z faces in world space into `target`; a camera's is its -Z */
  getWorldDirection<T extends PointData3D>(target: T): T;
  /**
   * Moves a point from this node's local space into world space, in place
   * @param vector - The point
   */
  localToWorld<T extends PointData3D>(vector: T): T;
  /**
   * Moves a point from world space into this node's local space, in place
   * @param vector - The point
   */
  worldToLocal<T extends PointData3D>(vector: T): T;
  /**
   * Turns about a normalised axis in local space
   * @param axis - The axis
   * @param angle - The angle, in radians
   */
  rotateOnAxis(axis: PointData3D, angle: number): this;
  /**
   * Turns about a normalised axis in world space; the node's parent must not be rotated
   * @param axis - The axis
   * @param angle - The angle, in radians
   */
  rotateOnWorldAxis(axis: PointData3D, angle: number): this;
  /**
   * Turns about the local X axis
   * @param angle - The angle, in radians
   */
  rotateX(angle: number): this;
  /**
   * Turns about the local Y axis
   * @param angle - The angle, in radians
   */
  rotateY(angle: number): this;
  /**
   * Turns about the local Z axis
   * @param angle - The angle, in radians
   */
  rotateZ(angle: number): this;
  /**
   * Moves along a normalised axis in local space
   * @param axis - The axis
   * @param distance - How far
   */
  translateOnAxis(axis: PointData3D, distance: number): this;
  /**
   * Moves along the local X axis
   * @param distance - How far
   */
  translateX(distance: number): this;
  /**
   * Moves along the local Y axis
   * @param distance - How far
   */
  translateY(distance: number): this;
  /**
   * Moves along the local Z axis
   * @param distance - How far
   */
  translateZ(distance: number): this;
  /**
   * Transforms the node by a matrix, after its own transform, and keeps the result in `position`,
   * `quaternion` and `scale`
   * @param matrix - The transform
   */
  applyMatrix4(matrix: PixiMatrix4): this;
  /**
   * Turns the node by a rotation, after its own
   * @param q - The rotation
   */
  applyQuaternion(q: QuaternionData): this;
  /**
   * Sets the rotation from a normalised axis and an angle
   * @param axis - The axis
   * @param angle - The angle, in radians
   */
  setRotationFromAxisAngle(axis: PointData3D, angle: number): void;
  /**
   * Sets the rotation from Euler angles, in their order
   * @param euler - The angles
   */
  setRotationFromEuler(euler: EulerLike): void;
  /**
   * Sets the rotation from the rotation part of an unscaled matrix
   * @param m - The matrix
   */
  setRotationFromMatrix(m: PixiMatrix4): void;
  /**
   * Sets the rotation from a quaternion
   * @param q - The rotation
   */
  setRotationFromQuaternion(q: QuaternionData): void;
  /** Builds `matrix` from `position`, `quaternion` and `scale` now, as three's `updateMatrix` */
  updateMatrix(): void;
  /** A no-op: pixi-3d works world transforms out when they are read */
  updateWorldMatrix(updateParents?: boolean, updateChildren?: boolean): void;
  /** A no-op: pixi-3d works world transforms out when they are read */
  updateMatrixWorld(force?: boolean): void;
  /** Calls `callback` with this node and every descendant */
  traverse(callback: (object: Container3D) => void): void;
  /** Calls `callback` with this node and every visible descendant */
  traverseVisible(callback: (object: Container3D) => void): void;
  /** Calls `callback` with every ancestor, nearest first */
  traverseAncestors(callback: (object: Container3D) => void): void;
  /** Adds this node's hits with `raycaster` to `intersects`; a mesh tests its triangles */
  raycast(raycaster: Raycaster, intersects: Intersection[]): void;
  /** Destroys this node, once */
  dispose(): void;
}

/**
 * The three.js camera members every pixi-3d `Camera3D` gets, worked out fresh when read
 * @category compat
 * @advanced
 */
export interface CameraMembers {
  /** Always `true` */
  readonly isCamera: true;
  /** Whether the camera is in perspective mode */
  readonly isPerspectiveCamera: boolean;
  /** Whether the camera is in orthographic mode */
  readonly isOrthographicCamera: boolean;
  /** Camera space to clip space */
  readonly projectionMatrix: PixiMatrix4;
  /** Clip space to camera space */
  readonly projectionMatrixInverse: PixiMatrix4;
  /** World space to camera space */
  readonly matrixWorldInverse: PixiMatrix4;
  /** Applies three's orthographic bounds (`left`, `right`) to pixi-3d's `orthographicSize` */
  updateProjectionMatrix(): void;
}

declare global {
  namespace PixiMixins {
    interface Container3D extends Object3DMembers {}
  }
}

declare module '@pixi/3d' {
  interface Camera3D extends CameraMembers {}
  interface Geometry3D {
    /** Always `true`; r3f attaches a child to a mesh's `geometry` by it */
    readonly isBufferGeometry: true;
    /** Destroys this geometry, once */
    dispose(): void;
  }
  interface BaseMaterial3D {
    /** Always `true`; r3f attaches a child to a mesh's `material` by it */
    readonly isMaterial: true;
    /** Destroys this material, once */
    dispose(): void;
  }
}

type Members<T> = { [K in keyof T]?: PropertyDescriptor & ThisType<T> };
type RotationInput = PointData3D & { order?: EulerOrder };

const X_AXIS = { x: 1, y: 0, z: 0 };
const Y_AXIS = { x: 0, y: 1, z: 0 };
const Z_AXIS = { x: 0, y: 0, z: 1 };

const matrixWorlds = new WeakMap<Container3D, Matrix4>();
const userDatas = new WeakMap<Container3D, Record<string, unknown>>();
const ups = new WeakMap<Container3D, Vector3>();
const rotations = new WeakMap<Container3D, Euler>();
const angles = new WeakMap<Container3D, EulerDegrees>();
const manualMatrices = new WeakSet<Container3D>();

/**
 * The `up` a node starts with, three's `Object3D.DEFAULT_UP`; a node copies it the first time its `up`
 * is read, and `lookAt` uses it for a node whose `up` was never read
 * @internal
 */
export const DEFAULT_UP: Vector3 = new Vector3(0, 1, 0);

const scratchMatrix = new Matrix4();
const scratchPosition = new Vector3();
const scratchScale = new Vector3();
const scratchQuaternion = new Quaternion();
const scratchTarget = new Vector3();
const scratchVector = new Vector3();

// oxlint-disable typescript/unbound-method -- pixi-3d's own methods, kept before the patch replaces them and called with .call(this)
const pixiLookAt = Container3D.prototype.lookAt;
const pixiOnUpdate = Container3D.prototype._onUpdate;
const pixiSetFromEuler = ObservableQuaternion.prototype.setFromEuler;
// oxlint-enable typescript/unbound-method

/** The node whose rotation is writing its quaternion, so the quaternion's change doesn't write back */
let rotationWriter: Container3D | null = null;

/**
 * Marks a node's transform to be worked out again on the next frame, through the observer callback
 * its vectors call when they change
 */
const markTransformChanged = (node: Container3D): void => node._onUpdate();

/** What a node with `matrixAutoUpdate` off has as its `updateLocalTransform`: the matrix stays as set */
const keepMatrix = (): void => {};

const upOf = (node: Container3D): Vector3 => {
  let up = ups.get(node);
  if (!up) ups.set(node, (up = DEFAULT_UP.clone()));
  return up;
};

const rotationOf = (node: Container3D): Euler => {
  const existing = rotations.get(node);
  if (existing) return existing;

  if (node.rotationDirty) node.updateLocalTransform();
  const euler = new Euler();
  const { x, y, z, w } = node.quaternion;
  if (x !== 0 || y !== 0 || z !== 0 || w !== 1) euler.setFromQuaternion(node.quaternion, undefined, false);
  euler._onChange(() => {
    rotationWriter = node;
    node.quaternion = setQuaternionFromEuler(scratchQuaternion, euler._x, euler._y, euler._z, euler._order);
    rotationWriter = null;
  });
  rotations.set(node, euler);
  return euler;
};

const matrixWorldOf = (node: Container3D): Matrix4 => {
  let matrix = matrixWorlds.get(node);
  if (!matrix) matrixWorlds.set(node, (matrix = new Matrix4()));
  node.getGlobalTransform(matrix);
  return matrix;
};

/** Builds a node's local matrix from its components, past the no-op a `matrixAutoUpdate = false` node has */
const composeLocal = (node: Container3D): void => {
  (Object.getPrototypeOf(node) as Container3D).updateLocalTransform.call(node);
  node._localTransformDirty = false;
};

const findByProperty = (node: Container3D, name: string, value: unknown): Container3D | undefined => {
  if ((node as unknown as Record<string, unknown>)[name] === value) return node;
  for (const child of node.children) {
    const found = findByProperty(child, name, value);
    if (found) return found;
  }
  return undefined;
};

const writeVector = <T extends PointData3D>(target: T, x: number, y: number, z: number): T => {
  target.x = x;
  target.y = y;
  target.z = z;
  return target;
};

const object3D: Members<Object3DMembers & Container3D> = {
  isObject3D: { value: true },
  id: {
    get(this: Container3D) {
      return this.uid;
    },
  },
  uuid: {
    get(this: Container3D) {
      return `pixi3d-${this.uid}`;
    },
  },
  name: {
    get(this: Container3D) {
      return this.label ?? '';
    },
    set(this: Container3D, value: string) {
      this.label = value;
    },
  },
  type: { value: 'Object3D' },
  userData: {
    get(this: Container3D) {
      let data = userDatas.get(this);
      if (!data) userDatas.set(this, (data = {}));
      return data;
    },
    set(this: Container3D, value: Record<string, unknown>) {
      userDatas.set(this, value);
    },
  },
  up: {
    get(this: Container3D) {
      return upOf(this);
    },
    set(this: Container3D, value: PointData3D) {
      upOf(this).copy(value);
    },
  },
  rotation: {
    get(this: Container3D) {
      return rotationOf(this);
    },
    set(this: Container3D, value: RotationInput) {
      rotationOf(this).copy(value);
    },
  },
  angle: {
    get(this: Container3D) {
      let angle = angles.get(this);
      if (!angle) angles.set(this, (angle = new EulerDegrees(rotationOf(this))));
      return angle;
    },
    set(this: Container3D, value: PointData3D) {
      rotationOf(this).set(value.x * DEG_TO_RAD, value.y * DEG_TO_RAD, value.z * DEG_TO_RAD);
    },
  },
  matrix: {
    get(this: Container3D) {
      if (manualMatrices.has(this)) markTransformChanged(this);
      else if (this._localTransformDirty) composeLocal(this);
      return this.localTransform;
    },
    set(this: Container3D, value: PixiMatrix4) {
      this.localTransform.copyFrom(value);
      markTransformChanged(this);
    },
  },
  matrixWorld: {
    get(this: Container3D) {
      return matrixWorldOf(this);
    },
  },
  matrixAutoUpdate: {
    get(this: Container3D) {
      return !manualMatrices.has(this);
    },
    set(this: Container3D, value: boolean) {
      if (value === !manualMatrices.has(this)) return;
      if (value) {
        manualMatrices.delete(this);
        delete (this as Partial<Container3D>).updateLocalTransform;
      } else {
        manualMatrices.add(this);
        Object.defineProperty(this, 'updateLocalTransform', { configurable: true, writable: true, value: keepMatrix });
      }
      markTransformChanged(this);
    },
  },
  matrixWorldAutoUpdate: { value: true },
  matrixWorldNeedsUpdate: {
    get() {
      return false;
    },
    set(this: Container3D, value: boolean) {
      if (value) markTransformChanged(this);
    },
  },
  renderOrder: { value: 0 },
  frustumCulled: { value: true },
  _onUpdate: {
    value(this: Container3D, changed?: ObservableVector3 | ObservableQuaternion) {
      pixiOnUpdate.call(this, changed);
      if (changed !== undefined && rotationWriter !== this && changed === this.quaternion) {
        rotations.get(this)?.setFromQuaternion(changed, undefined, false);
      }
    },
  },
  add: {
    value(this: Container3D, ...objects: Container3D[]) {
      for (const object of objects) this.addChild(object);
      return this;
    },
  },
  remove: {
    value(this: Container3D, ...objects: Container3D[]) {
      for (const object of objects) this.removeChild(object);
      return this;
    },
  },
  clear: {
    value(this: Container3D) {
      this.removeChildren();
      return this;
    },
  },
  attach: {
    value(this: Container3D, object: Container3D) {
      this.reparentChild(object);
      return this;
    },
  },
  dispatchEvent: {
    value(this: Container3D, event: { type: string }) {
      if (event instanceof FederatedEvent) return Container.prototype.dispatchEvent.call(this, event);
      const parent = this.parent;
      if (event.type !== 'added' || !parent) return;
      const index = parent.children.indexOf(this);
      if (index === -1) return;
      parent.children.splice(index, 1);
      this.parent = null;
      parent.addChildAt(this, index);
    },
  },
  getObjectById: {
    value(this: Container3D, id: number) {
      return findByProperty(this, 'id', id);
    },
  },
  getObjectByName: {
    value(this: Container3D, name: string) {
      return findByProperty(this, 'name', name);
    },
  },
  getObjectByProperty: {
    value(this: Container3D, name: string, value: unknown) {
      return findByProperty(this, name, value);
    },
  },
  getObjectsByProperty: {
    value(this: Container3D, name: string, value: unknown, result: Container3D[] = []) {
      this.traverse((node) => {
        if ((node as unknown as Record<string, unknown>)[name] === value) result.push(node);
      });
      return result;
    },
  },
  getWorldPosition: {
    value<T extends PointData3D>(this: Container3D, target: T) {
      const e = matrixWorldOf(this).elements;
      return writeVector(target, e[12], e[13], e[14]);
    },
  },
  getWorldQuaternion: {
    value<T extends QuaternionData>(this: Container3D, target: T) {
      matrixWorldOf(this).decompose(scratchPosition, scratchQuaternion, scratchScale);
      target.x = scratchQuaternion.x;
      target.y = scratchQuaternion.y;
      target.z = scratchQuaternion.z;
      target.w = scratchQuaternion.w;
      return target;
    },
  },
  getWorldScale: {
    value<T extends PointData3D>(this: Container3D, target: T) {
      matrixWorldOf(this).decompose(scratchPosition, scratchQuaternion, scratchScale);
      return writeVector(target, scratchScale.x, scratchScale.y, scratchScale.z);
    },
  },
  getWorldDirection: {
    value<T extends PointData3D>(this: Container3D, target: T) {
      const e = matrixWorldOf(this).elements;
      scratchVector.set(e[8], e[9], e[10]).normalize();
      return writeVector(target, scratchVector.x, scratchVector.y, scratchVector.z);
    },
  },
  localToWorld: {
    value<T extends PointData3D>(this: Container3D, vector: T) {
      scratchVector.copy(vector).applyMatrix4(matrixWorldOf(this));
      return writeVector(vector, scratchVector.x, scratchVector.y, scratchVector.z);
    },
  },
  worldToLocal: {
    value<T extends PointData3D>(this: Container3D, vector: T) {
      scratchVector.copy(vector).applyMatrix4(scratchMatrix.copy(matrixWorldOf(this)).invert());
      return writeVector(vector, scratchVector.x, scratchVector.y, scratchVector.z);
    },
  },
  rotateOnAxis: {
    value(this: Container3D, axis: PointData3D, angle: number) {
      this.quaternion.multiply(scratchQuaternion.setFromAxisAngle(axis, angle));
      return this;
    },
  },
  rotateOnWorldAxis: {
    value(this: Container3D, axis: PointData3D, angle: number) {
      this.quaternion.premultiply(scratchQuaternion.setFromAxisAngle(axis, angle));
      return this;
    },
  },
  rotateX: {
    value(this: Container3D, angle: number) {
      return this.rotateOnAxis(X_AXIS, angle);
    },
  },
  rotateY: {
    value(this: Container3D, angle: number) {
      return this.rotateOnAxis(Y_AXIS, angle);
    },
  },
  rotateZ: {
    value(this: Container3D, angle: number) {
      return this.rotateOnAxis(Z_AXIS, angle);
    },
  },
  translateOnAxis: {
    value(this: Container3D, axis: PointData3D, distance: number) {
      scratchVector.copy(axis).applyQuaternion(this.quaternion).multiplyScalar(distance);
      this.position.add(scratchVector);
      return this;
    },
  },
  translateX: {
    value(this: Container3D, distance: number) {
      return this.translateOnAxis(X_AXIS, distance);
    },
  },
  translateY: {
    value(this: Container3D, distance: number) {
      return this.translateOnAxis(Y_AXIS, distance);
    },
  },
  translateZ: {
    value(this: Container3D, distance: number) {
      return this.translateOnAxis(Z_AXIS, distance);
    },
  },
  applyMatrix4: {
    value(this: Container3D, matrix: PixiMatrix4) {
      const manual = manualMatrices.has(this);
      if (!manual) composeLocal(this);
      scratchMatrix.multiplyMatrices(matrix, this.localTransform);
      scratchMatrix.decompose(scratchPosition, scratchQuaternion, scratchScale);
      this.position.copyFrom(scratchPosition);
      this.quaternion = scratchQuaternion;
      this.scale.copyFrom(scratchScale);
      if (manual) this.localTransform.copyFrom(scratchMatrix);
      return this;
    },
  },
  applyQuaternion: {
    value(this: Container3D, q: QuaternionData) {
      this.quaternion.premultiply(q);
      return this;
    },
  },
  setRotationFromAxisAngle: {
    value(this: Container3D, axis: PointData3D, angle: number) {
      this.quaternion.setFromAxisAngle(axis, angle);
    },
  },
  setRotationFromEuler: {
    value(this: Container3D, euler: EulerLike) {
      this.quaternion = setQuaternionFromEuler(scratchQuaternion, euler.x, euler.y, euler.z, euler.order);
    },
  },
  setRotationFromMatrix: {
    value(this: Container3D, m: PixiMatrix4) {
      this.quaternion.setFromRotationMatrix(m);
    },
  },
  setRotationFromQuaternion: {
    value(this: Container3D, q: QuaternionData) {
      this.quaternion = q;
    },
  },
  updateMatrix: {
    value(this: Container3D) {
      composeLocal(this);
      markTransformChanged(this);
    },
  },
  updateWorldMatrix: { value() {} },
  updateMatrixWorld: { value() {} },
  traverse: {
    value(this: Container3D, callback: (object: Container3D) => void) {
      callback(this);
      for (const child of this.children) child.traverse(callback);
    },
  },
  traverseVisible: {
    value(this: Container3D, callback: (object: Container3D) => void) {
      if (!this.visible) return;
      callback(this);
      for (const child of this.children) child.traverseVisible(callback);
    },
  },
  traverseAncestors: {
    value(this: Container3D, callback: (object: Container3D) => void) {
      for (let parent = this.parent; parent; parent = parent.parent) callback(parent);
    },
  },
  lookAt: {
    value(this: Container3D, x: number | PointData3D, y?: number | PointData3D, z?: number) {
      lookAtPoint(this, x, y, z);
    },
  },
  raycast: { value() {} },
  dispose: {
    value(this: Container3D) {
      this.destroy();
    },
  },
};

const camera: Members<CameraMembers & Camera3D & { left?: number; right?: number }> = {
  isCamera: { value: true },
  isPerspectiveCamera: {
    get(this: Camera3D) {
      return this.mode === 'perspective';
    },
  },
  isOrthographicCamera: {
    get(this: Camera3D) {
      return this.mode === 'orthographic';
    },
  },
  type: {
    get(this: Camera3D) {
      return this.mode === 'orthographic' ? 'OrthographicCamera' : 'PerspectiveCamera';
    },
  },
  projectionMatrix: {
    get(this: Camera3D) {
      return cameraProjection(this);
    },
  },
  projectionMatrixInverse: {
    get(this: Camera3D) {
      return cameraProjectionInverse(this);
    },
  },
  matrixWorldInverse: {
    get(this: Camera3D) {
      return cameraWorldInverse(this);
    },
  },
  getWorldDirection: {
    value<T extends PointData3D>(this: Camera3D, target: T) {
      const e = matrixWorldOf(this).elements;
      scratchVector.set(-e[8], -e[9], -e[10]).normalize();
      return writeVector(target, scratchVector.x, scratchVector.y, scratchVector.z);
    },
  },
  updateProjectionMatrix: {
    value(this: Camera3D & { left?: number; right?: number }) {
      const { left, right } = this;
      if (this.mode === 'orthographic' && typeof left === 'number' && typeof right === 'number' && right !== left) {
        this.orthographicSize = Math.abs(right - left) / 2;
      }
    },
  },
};

const writable = (members: Record<string, PropertyDescriptor | undefined>): PropertyDescriptorMap => {
  const out: PropertyDescriptorMap = {};
  for (const [key, descriptor] of Object.entries(members)) {
    if (descriptor)
      out[key] =
        'value' in descriptor
          ? { writable: true, configurable: true, ...descriptor }
          : { configurable: true, ...descriptor };
  }
  return out;
};

const flag = (value: unknown): PropertyDescriptor => ({ value, configurable: true, writable: true });

const copyMembers = (target: object, source: object, names: readonly PropertyKey[]): void => {
  for (const name of names) {
    Object.defineProperty(target, name, flag((source as Record<PropertyKey, unknown>)[name]));
  }
};

function setFromEulerInOrder(
  this: ObservableQuaternion,
  euler: EulerLike,
  out?: QuaternionData | boolean,
): ObservableQuaternion {
  if (typeof out === 'object') return pixiSetFromEuler.call(this, euler, out);
  return setQuaternionFromEuler(this, euler.x, euler.y, euler.z, euler.order);
}

let installed = false;

/**
 * Gives pixi-3d's scene classes the three.js members r3f's core and three code read
 *
 * Patches the prototypes of `Container3D`, `Camera3D`, `Mesh3D`, `Geometry3D`, `BaseMaterial3D`, and
 * of the math a node holds (`ObservableVector3`, `ObservableQuaternion`, `Matrix4`), once, so every
 * instance answers r3f's duck-typed checks and three's API, including nodes pixi-3d creates itself.
 * It also gives `Mesh3D` a default geometry and material, because r3f constructs `<mesh>` with no
 * arguments and attaches them afterwards. The root's renderer support calls this before the first
 * element is created; it runs once per page.
 * @internal
 */
export function installObject3DSurface(): void {
  if (installed) return;
  installed = true;

  Object.defineProperties(Container3D.prototype, writable(object3D));
  Object.defineProperties(Camera3D.prototype, writable(camera));
  Object.defineProperties(Mesh3D.prototype, { isMesh: flag(true), type: flag('Mesh') });
  Object.defineProperties(Sprite3D.prototype, { isSprite: flag(true), type: flag('Sprite') });
  Object.defineProperties(Model3D.prototype, { isGroup: flag(true), type: flag('Group') });
  Object.defineProperty(Light.prototype, 'isLight', flag(true));
  Object.defineProperties(Geometry3D.prototype, {
    isBufferGeometry: { value: true, configurable: true },
    dispose: flag(function dispose(this: Geometry3D) {
      this.destroy();
    }),
  });
  Object.defineProperties(BaseMaterial3D.prototype, {
    isMaterial: { value: true, configurable: true },
    dispose: flag(function dispose(this: BaseMaterial3D) {
      this.destroy();
    }),
  });

  copyMembers(ObservableVector3.prototype, Vector3.prototype, VECTOR3_MEMBERS);
  Object.defineProperty(ObservableVector3.prototype, 'isVector3', flag(true));
  copyMembers(ObservableQuaternion.prototype, Quaternion.prototype, QUATERNION_MEMBERS);
  Object.defineProperties(ObservableQuaternion.prototype, {
    isQuaternion: flag(true),
    setFromEuler: flag(setFromEulerInOrder),
  });
  copyMembers(PixiMatrix4.prototype, Matrix4.prototype, MATRIX4_MEMBERS);
  Object.defineProperty(PixiMatrix4.prototype, 'isMatrix4', flag(true));

  installRaycasting();
  installTextureTracking();

  Mesh3D.defaultOptions.geometry ??= placeholderGeometry();
  Mesh3D.defaultOptions.material ??= placeholderMaterial();
}

/**
 * three's `lookAt(x, y, z)` or `lookAt(vector)` on a node, keeping its `up`; a pixi-3d up vector as
 * the second argument is taken too. The catalog's classes declare `lookAt` with three's arguments and
 * call this.
 * @param node - The node to turn
 * @param x - The point, or its x
 * @param y - The point's y when `x` is a number, or an up vector
 * @param z - The point's z, when `x` is a number
 * @internal
 */
export function lookAtPoint(node: Container3D, x: number | PointData3D, y?: number | PointData3D, z?: number): void {
  const target = typeof x === 'number' ? scratchTarget.set(x, typeof y === 'number' ? y : 0, z ?? 0) : x;
  pixiLookAt.call(node, target, typeof y === 'object' ? y : (ups.get(node) ?? DEFAULT_UP));
}

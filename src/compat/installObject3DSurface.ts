import { BaseMaterial3D, Camera3D, Container3D, Geometry3D, Matrix4, Mesh3D } from '@pixi/3d';
import type { PointData3D, Vector3 } from '@pixi/3d';

import { updateCameraMatrices } from './cameraMatrices';
import { placeholderGeometry, placeholderMaterial } from './placeholders';
import { raycastMesh } from './Raycaster';
import type { Intersection, Raycaster } from './Raycaster';

/**
 * The three.js `Object3D` members every pixi-3d `Container3D` gets, so r3f's core can drive any
 * node, including the ones pixi-3d builds itself (glTF nodes passed to `<primitive>`)
 *
 * r3f duck-types the scene graph: `isObject3D` decides whether a child joins its parent, `uuid`
 * keys pointer hits, `add`/`remove` attach and detach, `raycast` answers picking, and `dispose`
 * runs when an element unmounts.
 * @category compat
 * @advanced
 */
export interface Object3DMembers {
  /** Always `true`; r3f adds a child to its parent only when both have it */
  readonly isObject3D: true;
  /** A string unique to this node, from pixi's `uid` */
  readonly uuid: string;
  /** three's name for `label`; `useGraph` keys nodes by it */
  name: string;
  /** Free-form data, created on first read */
  userData: Record<string, unknown>;
  /** Local space to world space, worked out when read */
  readonly matrixWorld: Matrix4;
  /** Adds children, three's name for `addChild` */
  add(...objects: Container3D[]): this;
  /** Removes children, three's name for `removeChild` */
  remove(...objects: Container3D[]): this;
  /**
   * Finishes an insert r3f made by splicing `parent.children` directly
   *
   * r3f inserts before a sibling by splicing the child into `parent.children`, setting `parent`
   * itself, then dispatching `'added'`. On that event the child is spliced back out and re-added
   * through `addChildAt`, so the view attaches it and pixi-3d's own events fire as for any add.
   */
  dispatchEvent(event: { type: string }): void;
  /** Writes this node's world position into `target` */
  getWorldPosition<T extends Vector3>(target: T): T;
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
  readonly projectionMatrix: Matrix4;
  /** Clip space to camera space */
  readonly projectionMatrixInverse: Matrix4;
  /** World space to camera space */
  readonly matrixWorldInverse: Matrix4;
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

const matrixWorlds = new WeakMap<Container3D, Matrix4>();
const userDatas = new WeakMap<Container3D, Record<string, unknown>>();
// oxlint-disable-next-line typescript/unbound-method -- kept before the patch replaces it, and called with .call(this)
const pixiLookAt = Container3D.prototype.lookAt;

const object3D: Members<Object3DMembers & Container3D> = {
  isObject3D: { value: true },
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
  matrixWorld: {
    get(this: Container3D) {
      let matrix = matrixWorlds.get(this);
      if (!matrix) matrixWorlds.set(this, (matrix = new Matrix4()));
      return this.getGlobalTransform(matrix);
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
  dispatchEvent: {
    value(this: Container3D, event: { type: string }) {
      const parent = this.parent;
      if (event.type !== 'added' || !parent) return;
      const index = parent.children.indexOf(this);
      if (index === -1) return;
      parent.children.splice(index, 1);
      this.parent = null;
      parent.addChildAt(this, index);
    },
  },
  getWorldPosition: {
    value(this: Container3D, target: Vector3) {
      return this.getGlobalPosition(target);
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
    value(this: Container3D, x: number | PointData3D, y?: number, z?: number) {
      pixiLookAt.call(this, typeof x === 'number' ? { x, y: y ?? 0, z: z ?? 0 } : x);
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
  projectionMatrix: {
    get(this: Camera3D) {
      return updateCameraMatrices(this).projection;
    },
  },
  projectionMatrixInverse: {
    get(this: Camera3D) {
      return updateCameraMatrices(this).projectionInverse;
    },
  },
  matrixWorldInverse: {
    get(this: Camera3D) {
      return updateCameraMatrices(this).worldInverse;
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

let installed = false;

/**
 * Gives pixi-3d's scene classes the three.js members r3f's core reads
 *
 * Patches `Container3D`, `Mesh3D`, `Camera3D`, `Geometry3D` and `BaseMaterial3D` prototypes once, so
 * every instance answers r3f's duck-typed checks, including nodes pixi-3d creates itself. It also
 * gives `Mesh3D` a default geometry and material, because r3f constructs `<mesh>` with no arguments
 * and attaches them afterwards. The root's renderer support calls this before the first element
 * is created; it runs once per page.
 * @internal
 */
export function installObject3DSurface(): void {
  if (installed) return;
  installed = true;

  Object.defineProperties(Container3D.prototype, writable(object3D));
  Object.defineProperties(Camera3D.prototype, writable(camera));
  Object.defineProperty(Mesh3D.prototype, 'raycast', {
    configurable: true,
    writable: true,
    value(this: Mesh3D, raycaster: Raycaster, intersects: Intersection[]) {
      raycastMesh(this, raycaster, intersects);
    },
  });
  Object.defineProperties(Geometry3D.prototype, {
    isBufferGeometry: { value: true, configurable: true },
    dispose: {
      configurable: true,
      writable: true,
      value(this: Geometry3D) {
        this.destroy();
      },
    },
  });
  Object.defineProperties(BaseMaterial3D.prototype, {
    isMaterial: { value: true, configurable: true },
    dispose: {
      configurable: true,
      writable: true,
      value(this: BaseMaterial3D) {
        this.destroy();
      },
    },
  });

  Mesh3D.defaultOptions.geometry ??= placeholderGeometry();
  Mesh3D.defaultOptions.material ??= placeholderMaterial();
}

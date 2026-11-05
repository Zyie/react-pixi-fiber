import { Container3D } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

import { DEFAULT_UP, lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
import type { Vector3 } from '../../math/Vector3';

/**
 * three's `Object3DEventMap`: the events three's `Object3D` sends, by name, for code that types its
 * listeners with it
 * @category catalog
 * @advanced
 */
export interface Object3DEventMap {
  /** Sent when the object is added to a parent */
  added: Record<never, never>;
  /** Sent when the object is removed from its parent */
  removed: Record<never, never>;
  /** Sent when a child is added to the object */
  childadded: { child: Object3D };
  /** Sent when a child is removed from the object */
  childremoved: { child: Object3D };
}

/**
 * three's `Object3D`: a plain pixi-3d `Container3D`, with three's members
 *
 * Every pixi-3d node has three's `Object3D` surface once a root has loaded the support (see
 * `Object3DMembers`): `up`, `matrix`, `matrixWorld`, `getWorldPosition`, `traverse`, `rotateX`, and the
 * rest. This class re-declares `rotation` as three's `Euler` and `lookAt` with three's arguments, and
 * `instanceof Object3D` holds for every pixi-3d node, as it does for every three node.
 * @example
 * ```tsx
 * <object3D position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0, 'YXZ']} />
 * ```
 * @category catalog
 * @standard
 */
export class Object3D extends Container3D {
  /** The `up` every node starts with, as three's `Object3D.DEFAULT_UP`; change it before nodes read theirs */
  public static readonly DEFAULT_UP: Vector3 = DEFAULT_UP;

  /**
   * Whether a value is a scene node: any pixi-3d `Container3D`, as every three node is an `Object3D`
   * @param value - The value to test
   */
  public static override [Symbol.hasInstance](value: unknown): boolean {
    return this === Object3D ? value instanceof Container3D : Function.prototype[Symbol.hasInstance].call(this, value);
  }

  /** Local rotation in radians, three's `Euler`: its `order` sets how the angles combine, and it stays in step with `quaternion` */
  public override get rotation(): Euler {
    return super.rotation as Euler;
  }

  public override set rotation(value: PointData3D) {
    super.rotation = value;
  }

  /**
   * Turns this node to face a point in world space, given as a vector or as three numbers
   * @param x - The point, or its x
   * @param y - The point's y
   * @param z - The point's z
   */
  public override lookAt(x: number | PointData3D, y?: number | PointData3D, z?: number): void {
    lookAtPoint(this, x, y, z);
  }
}

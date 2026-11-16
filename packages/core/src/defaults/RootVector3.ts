import { Vector3 } from '@pixi/3d';

import { cameraProjectionInverse, cameraWorld } from '../renderer/cameraMatrices';
import type { RootCamera } from './RootCamera';

/**
 * The point core makes while no package registers its own: a pixi-3d `Vector3` with the three
 * members r3f's core calls on one, `isVector3`, `copy` and `unproject`. It is a hit's `point` on 2D,
 * and r3f's own scratch vectors.
 * @category core
 * @advanced
 */
export class RootVector3 extends Vector3 {
  /** Always `true`: r3f copies a point with it rather than spreading it */
  public readonly isVector3 = true;

  /**
   * Copies another point
   * @param point - The point
   * @returns This point
   */
  public copy(point: { x: number; y: number; z: number }): this {
    return this.copyFrom(point);
  }

  /**
   * Moves this point from a camera's clip space into world space
   * @param camera - The camera, a root's
   * @returns This point
   */
  public unproject(camera: RootCamera): this {
    return this.applyMatrix4(cameraProjectionInverse(camera)).applyMatrix4(cameraWorld(camera));
  }
}

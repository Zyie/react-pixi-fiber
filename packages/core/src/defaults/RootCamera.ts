import { Camera3D, Matrix4 } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

import { cameraProjection, cameraProjectionInverse, cameraWorldInverse } from '../renderer/cameraMatrices';

const target = { x: 0, y: 0, z: 0 };
const world = new Matrix4();

/**
 * A pixi-3d `Camera3D` with the members r3f's core calls on a root's camera, the base of the
 * cameras core makes while no package registers its own (`RootPerspectiveCamera`,
 * `RootOrthographicCamera`). Its props are pixi-3d's (`fov`, `near`, `far`, `zoom`, `mode`); the
 * members below are r3f's contract, not an API to build on.
 * @category core
 * @advanced
 */
export class RootCamera extends Camera3D {
  /** Always `true`: r3f's `<Canvas camera>` takes a camera with it as the camera itself */
  public readonly isCamera = true;
  /**
   * Width over height, which r3f sets from the canvas; 0 projects with the size of the view drawing
   * the camera
   */
  public aspect: number = 0;
  /** `true` keeps r3f from changing the projection when the canvas resizes */
  public manual = false;

  /** Whether it is in perspective mode */
  public get isPerspectiveCamera(): boolean {
    return this.mode === 'perspective';
  }

  /** Whether it is in orthographic mode */
  public get isOrthographicCamera(): boolean {
    return this.mode === 'orthographic';
  }

  /** Camera space to clip space, worked out when read */
  public get projectionMatrix(): Matrix4 {
    return cameraProjection(this);
  }

  /** Clip space to camera space, worked out when read */
  public get projectionMatrixInverse(): Matrix4 {
    return cameraProjectionInverse(this);
  }

  /** World space to camera space, worked out when read */
  public get matrixWorldInverse(): Matrix4 {
    return cameraWorldInverse(this);
  }

  /**
   * Does nothing: the projection is worked out from the camera's fields when it is drawn or read, so
   * there is nothing to update
   */
  public updateProjectionMatrix(): void {}

  /**
   * The camera's position in world space
   * @param out - Receives it
   * @returns `out`
   */
  public getWorldPosition<T extends PointData3D>(out: T): T {
    const elements = this.getGlobalTransform(world).elements;
    out.x = elements[12];
    out.y = elements[13];
    out.z = elements[14];
    return out;
  }

  /**
   * Turns the camera to face a point, given as a point or as its coordinates
   * @param x - The point, or its x
   * @param y - Its y, or the up direction when `x` is a point
   * @param z - Its z
   */
  public override lookAt(x: PointData3D | number, y?: PointData3D | number, z?: number): void {
    if (typeof x !== 'number') {
      super.lookAt(x, typeof y === 'object' ? y : undefined);
      return;
    }
    target.x = x;
    target.y = typeof y === 'number' ? y : 0;
    target.z = z ?? 0;
    super.lookAt(target);
  }
}

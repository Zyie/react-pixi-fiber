import { Camera3D } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
/**
 * three's `PerspectiveCamera` over pixi-3d's `Camera3D`, with three's positional constructor
 *
 * `fov` is vertical and in degrees in both libraries. pixi-3d draws with the aspect of the canvas;
 * `aspect` is what r3f keeps in step with it, and what the camera's matrices use outside a render.
 * @example
 * ```tsx
 * <Canvas camera={{ fov: 45, position: [0, 2, 6] }} />
 * ```
 * @category catalog
 * @standard
 */
export class PerspectiveCamera extends Camera3D {
  /** Width over height; r3f sets it from the canvas size */
  public aspect: number = 1;
  /** When `true`, r3f leaves the projection alone on resize */
  public manual?: boolean;

  /**
   * @param fov - Vertical field of view in degrees
   * @param aspect - Width over height
   * @param near - Near clipping distance
   * @param far - Far clipping distance
   */
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super({ mode: 'perspective', fov, near, far });
    this.aspect = aspect;
  }

  /** Nothing to do: the projection is worked out from `fov`, `aspect`, `near` and `far` when read */
  public override updateProjectionMatrix(): void {}

  /** Local rotation in radians, three's `Euler`: its `order` sets how the angles combine, and it stays in step with `quaternion` */
  public override get rotation(): Euler {
    return super.rotation as Euler;
  }

  public override set rotation(value: PointData3D) {
    super.rotation = value;
  }

  /**
   * Turns this node to face a point in world space, given as a vector or as three numbers; a camera faces it with its -Z, as in three
   * @param x - The point, or its x
   * @param y - The point's y
   * @param z - The point's z
   */
  public override lookAt(x: number | PointData3D, y?: number | PointData3D, z?: number): void {
    lookAtPoint(this, x, y, z);
  }
}

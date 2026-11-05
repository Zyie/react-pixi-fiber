import { Camera3D } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

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

  /**
   * Turns the camera to face a point, given as a point or as three numbers as in three
   * @param target - The point, or its x
   * @param y - The point's y, when `target` is a number; else pixi-3d's up vector
   * @param z - The point's z, when `target` is a number
   */
  public override lookAt(target: number | PointData3D, y?: number | PointData3D, z?: number): void {
    if (typeof target === 'number') super.lookAt({ x: target, y: typeof y === 'number' ? y : 0, z: z ?? 0 });
    else super.lookAt(target, typeof y === 'object' ? y : undefined);
  }
}

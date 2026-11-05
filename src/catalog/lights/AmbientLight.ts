import { AmbientLight as PixiAmbientLight } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
/**
 * three's `AmbientLight` over pixi-3d's, with three's positional constructor
 * @example
 * ```tsx
 * <ambientLight intensity={0.5} />
 * ```
 * @category catalog
 * @standard
 */
export class AmbientLight extends PixiAmbientLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;

  /**
   * @param color - Light colour
   * @param intensity - Brightness
   */
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
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

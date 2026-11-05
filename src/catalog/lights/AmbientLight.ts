import { AmbientLight as PixiAmbientLight } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Color, ColorRepresentation } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { LightColor } from './lightColors';

/**
 * three's `AmbientLight` over pixi-3d's, with three's positional constructor
 *
 * `color` is a three `Color`, so `light.color.set('orange')` works.
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
  /** Always `true`, as on three's ambient lights */
  public readonly isAmbientLight = true;
  private readonly _threeColor: LightColor;

  /**
   * @param color - Light colour
   * @param intensity - Brightness
   */
  constructor(color: ColorRepresentation = 0xffffff, intensity = 1) {
    super({ intensity });
    this._threeColor = new LightColor(color);
  }

  // @ts-expect-error -- three's `color` is a three Color where pixi-3d's light has a pixi Color; pixi-3d reads it through LightColor's display channels
  public override get color(): Color {
    return this._threeColor;
  }

  // @ts-expect-error -- takes what three's colour props take, where pixi-3d's takes a ColorSource
  public override set color(value: ColorRepresentation) {
    this._threeColor.set(value);
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

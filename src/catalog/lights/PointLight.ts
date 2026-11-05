import { PointLight as PixiPointLight } from '@pixi/3d';
import type { Destroy3DOptions, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Color, ColorRepresentation } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { PerspectiveCamera } from '../scene/PerspectiveCamera';
import { LightColor } from './lightColors';
import { PointLightShadow } from './LightShadow';

/**
 * three's `PointLight` over pixi-3d's, with three's positional constructor
 *
 * `distance` is pixi-3d's `range`: past it the light reaches nothing, and it fades out the same
 * way as three's. pixi-3d's falloff is always inverse square, three's default `decay` of 2, so
 * `decay` is kept for three's shape and changes nothing. pixi-3d's point lights cast no shadows:
 * `castShadow` and `shadow` are kept and change nothing. `color` is a three `Color`.
 * @example
 * ```tsx
 * <pointLight position={[2, 3, 4]} intensity={10} distance={8} />
 * ```
 * @category catalog
 * @standard
 */
export class PointLight extends PixiPointLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;
  /** Always `true`, as on three's point lights */
  public readonly isPointLight = true;
  /** Kept for three's shape: pixi-3d's point lights fall off with the square of the distance, three's default @default 2 */
  public decay: number = 2;
  /** Kept for three's shape: pixi-3d's point lights cast no shadows */
  public shadow: PointLightShadow = new PointLightShadow(new PerspectiveCamera(90, 1, 0.5, 500));
  private readonly _threeColor: LightColor;

  /**
   * @param color - Light colour
   * @param intensity - Brightness, in candela as in three
   * @param distance - How far the light reaches, or 0 for no limit, as in three
   * @param decay - three's falloff exponent, kept; pixi-3d's is always 2
   */
  constructor(color: ColorRepresentation = 0xffffff, intensity = 1, distance = 0, decay = 2) {
    super({ intensity, range: distance });
    this._threeColor = new LightColor(color);
    this.decay = decay;
  }

  // @ts-expect-error -- three's `color` is a three Color where pixi-3d's light has a pixi Color; pixi-3d reads it through LightColor's display channels
  public override get color(): Color {
    return this._threeColor;
  }

  // @ts-expect-error -- takes what three's colour props take, where pixi-3d's takes a ColorSource
  public override set color(value: ColorRepresentation) {
    this._threeColor.set(value);
  }

  /**
   * How far the light reaches, or 0 for no limit; three's name for `range`
   * @default 0
   */
  public get distance(): number {
    return this.range;
  }

  public set distance(value: number) {
    this.range = value;
  }

  /** The light's power in lumens, `intensity` times 4π, as in three */
  public get power(): number {
    return this.intensity * 4 * Math.PI;
  }

  public set power(value: number) {
    this.intensity = value / (4 * Math.PI);
  }

  /**
   * Frees the light and its shadow camera
   * @param options - pixi-3d's destroy options
   */
  public override destroy(options?: Destroy3DOptions): void {
    if (this.destroyed) return;
    this.shadow.dispose();
    super.destroy(options);
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

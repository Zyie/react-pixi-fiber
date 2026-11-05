import { PointLight as PixiPointLight } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

/**
 * three's `PointLight` over pixi-3d's, with three's positional constructor
 *
 * `distance` is pixi-3d's `range`: past it the light reaches nothing, and it fades out the same
 * way as three's. pixi-3d's falloff is always inverse square, three's default `decay` of 2, so the
 * constructor takes `decay` for three's signature and ignores it, and there is no `decay` prop.
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

  /**
   * @param color - Light colour
   * @param intensity - Brightness, in candela as in three
   * @param distance - How far the light reaches, or 0 for no limit, as in three
   * @param _decay - three's falloff exponent; pixi-3d's is always 2
   */
  constructor(color: ColorSource = 0xffffff, intensity = 1, distance = 0, _decay = 2) {
    super({ color, intensity, range: distance });
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
}

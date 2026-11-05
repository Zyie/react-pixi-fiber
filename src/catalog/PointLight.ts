import { PointLight as PixiPointLight } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

/**
 * three's `PointLight` over pixi-3d's, with three's positional constructor
 *
 * pixi-3d's falloff is inverse square, three's default `decay` of 2; other decays are not taken yet.
 * @example
 * ```tsx
 * <pointLight position={[2, 3, 4]} intensity={10} />
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
   */
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
  }
}

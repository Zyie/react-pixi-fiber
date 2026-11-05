import { AmbientLight as PixiAmbientLight } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

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
}

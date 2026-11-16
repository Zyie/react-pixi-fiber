import { Color } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';

/**
 * three's `FogExp2`: fog that is clear near the camera and closes in with the square of the depth
 *
 * Attach it to the scene's `fog`. The renderer hands it to pixi-3d's `exp2` fog each frame, which
 * thickens by `1 - exp(-(density * depth)²)` and is mixed in after the tone curve, as three's is. A
 * material whose `toneMapped` is off takes no fog.
 * @example
 * ```tsx
 * <fogExp2 attach="fog" args={['#cfd8e3', 0.15]} />
 * ```
 * @category catalog
 * @standard
 */
export class FogExp2 {
  /** Always `true`, as on three's `FogExp2` */
  public readonly isFogExp2 = true;
  /** A name for the fog, as three's */
  public name: string = '';
  /** The fog's colour, a three `Color` */
  public readonly color: Color;
  /** How quickly the fog thickens with distance */
  public density: number = 0.00025;

  /**
   * @param color - The fog's colour
   * @param density - How quickly it thickens
   */
  constructor(color: ColorRepresentation, density = 0.00025) {
    this.color = new Color(color);
    this.density = density;
  }

  /** A new fog with the same settings */
  public clone(): FogExp2 {
    return new FogExp2(this.color, this.density);
  }

  /** three's JSON form of the fog */
  public toJSON(): { type: 'FogExp2'; name: string; color: number; density: number } {
    return { type: 'FogExp2', name: this.name, color: this.color.getHex(), density: this.density };
  }
}

import { Color } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';

/**
 * three's `Fog`: linear fog that thickens from none at `near` to full at `far`, measured along the view
 *
 * Attach it to the scene's `fog`. The renderer hands it to pixi-3d's linear fog each frame, so a
 * change to `color`, `near` or `far` shows on the next frame, and mixes it in as three does: by a
 * smoothstep of the depth, after the tone curve, so a fully fogged surface shows the fog colour
 * itself. A material whose `toneMapped` is off takes no fog.
 * @example
 * ```tsx
 * <fog attach="fog" args={['#202030', 5, 15]} />
 * ```
 * @category catalog
 * @standard
 */
export class Fog {
  /** Always `true`, as on three's `Fog` */
  public readonly isFog = true;
  /** A name for the fog, as three's */
  public name: string = '';
  /** The fog's colour, a three `Color` */
  public readonly color: Color;
  /** Distance from the camera where the fog starts */
  public near: number = 1;
  /** Distance from the camera where the fog is full */
  public far: number = 1000;

  /**
   * @param color - The fog's colour
   * @param near - Where it starts
   * @param far - Where it is full
   */
  constructor(color: ColorRepresentation, near = 1, far = 1000) {
    this.color = new Color(color);
    this.near = near;
    this.far = far;
  }

  /** A new fog with the same settings */
  public clone(): Fog {
    return new Fog(this.color, this.near, this.far);
  }

  /** three's JSON form of the fog */
  public toJSON(): { type: 'Fog'; name: string; color: number; near: number; far: number } {
    return { type: 'Fog', name: this.name, color: this.color.getHex(), near: this.near, far: this.far };
  }
}

import { AmbientLight as PixiAmbientLight, Vector3 } from '@pixi/3d';
import type { Hemisphere, PointData3D } from '@pixi/3d';

import { DEFAULT_UP, lookAtPoint } from '../../compat/installObject3DSurface';
import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { HemisphereSkyColor } from './lightColors';

const copyPixiColor = (color: Color, out: [number, number, number]): [number, number, number] => {
  const rgb = toPixiColor(color);
  out[0] = rgb[0];
  out[1] = rgb[1];
  out[2] = rgb[2];
  return out;
};

/**
 * three's `HemisphereLight` over pixi-3d's `Hemisphere` environment
 *
 * A surface facing the light's position from the origin takes the sky colour, `color`, one facing away
 * takes `groundColor`, and anything between blends the two, at three's brightness. The renderer
 * makes the view's environment a pixi-3d `Hemisphere` from it each frame. pixi-3d has one
 * environment per view, so the first visible hemisphere light is the one that lights, and a scene
 * whose `environment` is set lights by that instead. pixi-3d also reflects the hemisphere in
 * specular highlights, which three's hemisphere light doesn't, so a glossy surface catches a
 * little more of it than in three.
 * @example
 * ```tsx
 * <hemisphereLight args={['#bde0ff', '#3a2f24', 1.5]} />
 * ```
 * @category catalog
 * @standard
 */
export class HemisphereLight extends PixiAmbientLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;
  /** Always `true`, as on three's hemisphere lights */
  public readonly isHemisphereLight = true;
  /** The colour from below, a three `Color` */
  public readonly groundColor: Color;
  private readonly _skyColor: HemisphereSkyColor;
  private readonly _hemisphere: Hemisphere & {
    skyColor: [number, number, number];
    groundColor: [number, number, number];
    up: Vector3;
  } = { skyColor: [1, 1, 1], groundColor: [1, 1, 1], up: new Vector3(0, 1, 0), intensity: 1 };

  /**
   * @param skyColor - The colour from above
   * @param groundColor - The colour from below
   * @param intensity - Brightness
   */
  constructor(skyColor: ColorRepresentation = 0xffffff, groundColor: ColorRepresentation = 0xffffff, intensity = 1) {
    super({ intensity });
    this._skyColor = new HemisphereSkyColor(skyColor);
    this.groundColor = new Color(groundColor);
    this.position.copyFrom(DEFAULT_UP);
  }

  /** The colour from above, a three `Color` in the working colour space */
  // @ts-expect-error -- three's `color` is a three Color where pixi-3d's light has a pixi Color; it adds nothing to pixi-3d's flat ambient term
  public override get color(): Color {
    return this._skyColor;
  }

  // @ts-expect-error -- takes what three's colour props take, where pixi-3d's takes a ColorSource
  public override set color(value: ColorRepresentation) {
    this._skyColor.set(value);
  }

  /**
   * The pixi-3d environment this light makes, brought up to date: its colours, its intensity over π,
   * since pixi-3d's environment light takes no 1 / π where three's irradiance does, and its up, the
   * light's world position
   * @internal
   */
  public _toHemisphere(): Hemisphere {
    const hemisphere = this._hemisphere;
    copyPixiColor(this._skyColor, hemisphere.skyColor);
    copyPixiColor(this.groundColor, hemisphere.groundColor);
    hemisphere.intensity = this.intensity / Math.PI;
    this.getGlobalPosition(hemisphere.up);
    return hemisphere;
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

import { Color, toPixiChannel } from '../../math/Color';

/**
 * A light's three `Color`, which pixi-3d reads too
 *
 * pixi-3d packs a light by reading `red`, `green` and `blue` off its colour as display-space
 * channels and decoding them to linear light. These encode the linear channels three keeps, so the
 * shader gets the values three's would.
 * @internal
 */
export class LightColor extends Color {
  /** Red in display space, as pixi-3d reads it */
  public get red(): number {
    return toPixiChannel(this.r);
  }

  /** Green in display space, as pixi-3d reads it */
  public get green(): number {
    return toPixiChannel(this.g);
  }

  /** Blue in display space, as pixi-3d reads it */
  public get blue(): number {
    return toPixiChannel(this.b);
  }
}

/**
 * A hemisphere light's sky colour, which pixi-3d reads as black
 *
 * The hemisphere light is a pixi-3d ambient light so that its view lists it, and pixi-3d adds every
 * ambient light's display channels to the flat ambient term. It lights the scene through the view's
 * environment instead, so its channels read as 0 there.
 * @internal
 */
export class HemisphereSkyColor extends Color {
  /** Always 0: the hemisphere adds nothing to pixi-3d's flat ambient term */
  public get red(): number {
    return 0;
  }

  /** Always 0: the hemisphere adds nothing to pixi-3d's flat ambient term */
  public get green(): number {
    return 0;
  }

  /** Always 0: the hemisphere adds nothing to pixi-3d's flat ambient term */
  public get blue(): number {
    return 0;
  }
}

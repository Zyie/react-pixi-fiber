import { Container3D } from '@pixi/3d';
import type { Fog, Hemisphere } from '@pixi/3d';
import type { ColorSource, CubeTexture } from 'pixi.js';

/**
 * A root's default scene, and the scene a `<View3D>` or a `<RenderTexture2D>` draws, while no package
 * registers its own: a pixi-3d `Container3D` with the two flags r3f's core reads, `isScene`, which
 * tells a scene from a portal's container, and `type`, which keeps a scene from being disposed, and
 * the settings of @pixi/3d's view the renderer draws it with, its `fog` and `environment`
 * @example
 * ```tsx
 * <Canvas scene={{ fog: { type: 'linear', color: '#9fb8d0', near: 4, far: 14 } }} background="#9fb8d0">
 *   <Scene />
 * </Canvas>;
 *
 * // Inside the canvas
 * const scene = useThree((state) => state.scene);
 * scene.environment = { skyColor: '#bcd4ff', groundColor: '#5a4632' };
 * ```
 * @category core
 * @advanced
 */
export class RootScene extends Container3D {
  /** Always `true`: r3f's core takes an object with it as a scene of its own */
  public readonly isScene = true;
  /** Always `'Scene'`: the dispose hook leaves a scene alone */
  public readonly type = 'Scene';
  /**
   * A colour the renderer clears to before it draws the scene, or `null` for the clear colour;
   * `<Canvas background>` sets it, and `<primitive object={new Color('navy')} attach="background" />`
   * in a `<View3D>`
   */
  public background: ColorSource | null = null;
  /**
   * The distance fog the scene is drawn with, @pixi/3d's `Fog`, or `null` for none. Its view keeps the
   * object, so changing its `color`, `near`, `far` or `density` is free; fog of another `type`, or
   * turning fog on or off, recompiles the materials. Exposure and the tone curve apply to its colour;
   * with neither, a `<Canvas background>` of the same colour meets fully fogged surfaces with no seam.
   * @default null
   */
  public fog: Fog | null = null;
  /**
   * Light from the scene's surroundings, @pixi/3d's environment: a `CubeTexture` for image-based light
   * and reflections, a `Hemisphere` gradient from sky to ground, cheap enough for mobile, or `null` for
   * none. Switching between kinds recompiles the materials; changing a hemisphere's colours is free.
   * @default null
   */
  public environment: CubeTexture | Hemisphere | null = null;
}

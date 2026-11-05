import type { Hemisphere } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

import type { EnvironmentTexture } from '../../environment/environmentTexture';
import type { Color } from '../../math/Color';
import { Euler } from '../../math/Euler';
import { Object3D } from '../objects/Object3D';
import type { Fog } from './Fog';
import type { FogExp2 } from './FogExp2';

/**
 * three's `Scene`: the root a renderer draws
 *
 * The renderer gives each scene it draws its own `View3D` and reads the scene's settings as it draws.
 * `background` takes a three `Color`, read in the working colour space as in three, or any pixi
 * `ColorSource`, which the canvas clears to; a 2D texture, stretched over the canvas as three
 * stretches a texture background; a `CubeTexture`, or a texture with an equirectangular `mapping`,
 * drawn around the camera as three draws it; or pixi-3d's `Hemisphere`. `environment` lights the scene
 * from a cube or equirectangular texture, on pixi-3d's image-based lighting. `fog` takes a `Fog` or
 * `FogExp2`.
 *
 * `backgroundIntensity` scales a texture background; a 2D one only dims, from 0 to 1.
 * `backgroundRotation` and `backgroundBlurriness` turn and blur a cube or equirectangular background,
 * as `environmentRotation` and `environmentIntensity` turn and scale the environment.
 * @example
 * ```tsx
 * <color attach="background" args={['skyblue']} />
 * <fog attach="fog" args={['skyblue', 10, 40]} />
 * ```
 * @category catalog
 * @standard
 */
export class Scene extends Object3D {
  /** Always `true`; r3f duck-types scenes by it */
  public readonly isScene = true;
  /** Always `'Scene'`; r3f never disposes a node of this type */
  public override readonly type: string = 'Scene';
  /** What is drawn behind the scene, or `null` for the renderer's clear colour */
  public background: Color | ColorSource | EnvironmentTexture | Hemisphere | null = null;
  /**
   * Lights the scene from its surroundings, three's `scene.environment`: a cube texture, or an
   * equirectangular one, on pixi-3d's image-based lighting
   */
  public environment: EnvironmentTexture | null = null;
  /** Fog over the scene, or `null` for none */
  public fog: Fog | FogExp2 | null = null;
  /** Scales the light `environment` gives @default 1 */
  public environmentIntensity: number = 1;
  /** Turns `environment` round the scene */
  public environmentRotation: Euler = new Euler();
  /** Scales a texture background; a 2D one only dims, 0 to 1 @default 1 */
  public backgroundIntensity: number = 1;
  /** Turns a cube or equirectangular background round the scene */
  public backgroundRotation: Euler = new Euler();
  /** Blurs a cube or equirectangular background, 0 to 1 @default 0 */
  public backgroundBlurriness: number = 0;
}

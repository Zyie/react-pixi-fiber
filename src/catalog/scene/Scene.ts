import type { ColorSource } from 'pixi.js';

import type { EnvironmentTexture } from '../../environment/environmentTexture';
import type { Color } from '../../math/Color';
import { Euler } from '../../math/Euler';
import { Object3D } from '../objects/Object3D';

/**
 * three's `Scene`: the root a renderer draws
 *
 * The renderer gives each scene it draws its own `View3D` and copies `background` to it: a three
 * `Color`, which it reads in the working colour space as three does, or any pixi `ColorSource`.
 * @example
 * ```tsx
 * <color attach="background" args={['skyblue']} />
 * ```
 * @category catalog
 * @standard
 */
export class Scene extends Object3D {
  /** Always `true`; r3f duck-types scenes by it */
  public readonly isScene = true;
  /** Always `'Scene'`; r3f never disposes a node of this type */
  public override readonly type: string = 'Scene';
  /** Colour drawn behind the scene, or `null` for the renderer's clear colour */
  public background: Color | ColorSource | EnvironmentTexture | null = null;
  /**
   * Lights the scene from its surroundings, three's `scene.environment`: a cube texture, or an
   * equirectangular one, on pixi-3d's image-based lighting. A texture `background` is drawn behind
   * the scene as three draws it.
   */
  public environment: EnvironmentTexture | null = null;
  /** Scales the light `environment` gives @default 1 */
  public environmentIntensity: number = 1;
  /** Turns `environment` round the scene */
  public environmentRotation: Euler = new Euler();
  /** Scales a texture background @default 1 */
  public backgroundIntensity: number = 1;
  /** Turns a texture background round the scene */
  public backgroundRotation: Euler = new Euler();
  /** Blurs a texture background, 0 to 1 @default 0 */
  public backgroundBlurriness: number = 0;
}

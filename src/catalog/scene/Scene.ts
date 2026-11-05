import type { Hemisphere } from '@pixi/3d';
import type { ColorSource, CubeTexture, Texture } from 'pixi.js';

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
 * `ColorSource`, which the canvas clears to; a pixi `Texture`, stretched over the canvas as three
 * stretches a texture background; or a pixi-3d `CubeTexture` or `Hemisphere`, which pixi-3d draws
 * around the scene. `fog` takes a `Fog` or `FogExp2`.
 *
 * `backgroundIntensity` dims a texture background, from 0 to 1. pixi-3d draws a cube background
 * through the tone curve, where three leaves an sRGB one as it is, and has no blur or rotation for
 * it, so `backgroundBlurriness` and `backgroundRotation` are kept for three's shape.
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
  public background: Color | ColorSource | Texture | CubeTexture | Hemisphere | null = null;
  /** Fog over the scene, or `null` for none */
  public fog: Fog | FogExp2 | null = null;
  /** Dims a texture background, 0 to 1 @default 1 */
  public backgroundIntensity: number = 1;
  /** Kept for three's shape: pixi-3d draws backgrounds unblurred @default 0 */
  public backgroundBlurriness: number = 0;
  /** Kept for three's shape: pixi-3d draws backgrounds unrotated */
  public readonly backgroundRotation: Euler = new Euler();
}

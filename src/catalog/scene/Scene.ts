import type { ColorSource } from 'pixi.js';

import type { Color } from '../../math/Color';
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
  public background: Color | ColorSource | null = null;
}

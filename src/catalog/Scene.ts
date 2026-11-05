import { Container3D } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

/**
 * three's `Scene`: the root a renderer draws, a pixi-3d `Container3D`
 *
 * The renderer gives each scene it draws its own `View3D` and copies `background` to it.
 * @example
 * ```tsx
 * import { useThree } from 'react-pixi-fiber';
 *
 * const scene = useThree((state) => state.scene);
 * scene.background = 'skyblue';
 * ```
 * @category catalog
 * @standard
 */
export class Scene extends Container3D {
  /** Always `true`; r3f duck-types scenes by it */
  public readonly isScene = true;
  /** Always `'Scene'`; r3f never disposes a node of this type */
  public readonly type = 'Scene';
  /** Colour drawn behind the scene, or `null` for the renderer's clear colour */
  public background: ColorSource | null = null;
}

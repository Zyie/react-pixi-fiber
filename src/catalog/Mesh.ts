import { Mesh3D } from '@pixi/3d';
import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import { placeholderGeometry, placeholderMaterial } from '../compat/placeholders';

/**
 * three's `Mesh` over pixi-3d's `Mesh3D`, with three's positional constructor
 *
 * `<mesh>` is built with no arguments and gets its geometry and material from its children, as
 * in three. Until then it holds a zero-size geometry that draws nothing. Shadows start off, as in
 * three: set `castShadow` and `receiveShadow`.
 * @example
 * ```tsx
 * <mesh position={[0, 1, 0]} castShadow>
 *   <boxGeometry args={[1, 2, 3]} />
 *   <meshStandardMaterial color="hotpink" />
 * </mesh>
 * ```
 * @category catalog
 * @standard
 */
export class Mesh extends Mesh3D {
  /** Always `true`, as on three's `Mesh` */
  public readonly isMesh = true;

  /**
   * @param geometry - The shape to draw
   * @param material - How to shade it
   */
  constructor(geometry: Geometry3D = placeholderGeometry(), material: BaseMaterial3D = placeholderMaterial()) {
    super({ geometry, material, castShadow: false, receiveShadow: false });
  }
}

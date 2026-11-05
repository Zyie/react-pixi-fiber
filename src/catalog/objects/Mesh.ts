import { Mesh3D } from '@pixi/3d';
import type { BaseMaterial3D, Geometry3D, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import { placeholderGeometry, placeholderMaterial } from '../../compat/placeholders';
import type { Euler } from '../../math/Euler';

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

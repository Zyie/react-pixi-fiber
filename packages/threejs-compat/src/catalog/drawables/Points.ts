import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { Drawable } from './Drawable';
import { PointsMaterial } from './PointsMaterial';
import { raycastPoints } from './raycastDrawables';

/**
 * three's `Points`: each vertex of its geometry drawn as a square, with a {@link PointsMaterial}
 *
 * pixi-3d draws each point as a camera-facing square of two triangles. The raycaster hits a point
 * within `raycaster.params.Points.threshold` of the ray, with three's `index` and `distanceToRay`.
 * @example
 * ```tsx
 * <points>
 *   <sphereGeometry args={[1, 32, 16]} />
 *   <pointsMaterial size={0.05} color="white" />
 * </points>
 * ```
 * @category catalog
 * @standard
 */
export class Points extends Drawable {
  /** Always `true`, as on three's `Points` */
  public readonly isPoints = true;
  /** three's class name */
  public type = 'Points';

  /**
   * @param geometry - The points
   * @param material - How to draw them
   */
  constructor(geometry: Geometry3D = new BufferGeometry(), material: BaseMaterial3D = new PointsMaterial()) {
    super(geometry, material, 'points');
  }

  /**
   * Adds every point within `raycaster.params.Points.threshold` of the ray
   * @param raycaster - The raycaster
   * @param intersects - List the hits are added to
   */
  public raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (this.geometry instanceof BufferGeometry) raycastPoints(this, this.geometry, raycaster, intersects);
  }
}

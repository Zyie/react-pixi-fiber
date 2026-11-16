import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { Line } from './Line';
import { LineBasicMaterial } from './LineBasicMaterial';
import { raycastLine } from './raycastDrawables';

/**
 * three's `LineLoop`: a {@link Line} whose last vertex joins its first
 * @example
 * ```tsx
 * <lineLoop>
 *   <circleGeometry args={[1, 32]} />
 *   <lineBasicMaterial color="white" />
 * </lineLoop>
 * ```
 * @category catalog
 * @standard
 */
export class LineLoop extends Line {
  /** Always `true`, as on three's `LineLoop` */
  public readonly isLineLoop = true;

  /**
   * @param geometry - The vertices
   * @param material - How to draw the lines
   */
  constructor(geometry: Geometry3D = new BufferGeometry(), material: BaseMaterial3D = new LineBasicMaterial()) {
    super(geometry, material, 'lineLoop');
    this.type = 'LineLoop';
  }

  /**
   * Adds every segment within `raycaster.params.Line.threshold` of the ray
   * @param raycaster - The raycaster
   * @param intersects - List the hits are added to
   */
  public override raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (this.geometry instanceof BufferGeometry) raycastLine(this, this.geometry, 1, true, raycaster, intersects);
  }
}

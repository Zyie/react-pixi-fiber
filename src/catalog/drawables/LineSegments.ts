import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { BufferGeometry } from '../geometries/BufferGeometry';
import { Line } from './Line';
import { LineBasicMaterial } from './LineBasicMaterial';
import { raycastLine } from './raycastDrawables';

/**
 * three's `LineSegments`: its geometry's vertices joined in pairs, a line between vertex 0 and 1, 2
 * and 3, and so on; what `<edgesGeometry>`, `<wireframeGeometry>` and the helpers draw with
 * @example
 * ```tsx
 * <lineSegments>
 *   <edgesGeometry args={[new BoxGeometry()]} />
 *   <lineBasicMaterial color="black" />
 * </lineSegments>
 * ```
 * @category catalog
 * @standard
 */
export class LineSegments extends Line {
  /** Always `true`, as on three's `LineSegments` */
  public readonly isLineSegments = true;

  /**
   * @param geometry - The vertices, in pairs
   * @param material - How to draw the lines
   */
  constructor(geometry: Geometry3D = new BufferGeometry(), material: BaseMaterial3D = new LineBasicMaterial()) {
    super(geometry, material, 'lineSegments');
    this.type = 'LineSegments';
  }

  /**
   * Adds every segment within `raycaster.params.Line.threshold` of the ray
   * @param raycaster - The raycaster
   * @param intersects - List the hits are added to
   */
  public override raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (this.geometry instanceof BufferGeometry) raycastLine(this, this.geometry, 2, false, raycaster, intersects);
  }
}

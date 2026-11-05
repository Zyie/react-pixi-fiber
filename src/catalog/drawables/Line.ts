import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { Float32BufferAttribute } from '../geometries/BufferAttribute';
import { BufferGeometry } from '../geometries/BufferGeometry';
import type { GeometryDrawMode } from '../geometries/BufferGeometry';
import { Drawable } from './Drawable';
import { LineBasicMaterial } from './LineBasicMaterial';
import { raycastLine } from './raycastDrawables';

/**
 * three's `Line`: its geometry's vertices joined in order by 1 pixel lines, with a
 * {@link LineBasicMaterial}
 *
 * The raycaster hits a segment within `raycaster.params.Line.threshold` of the ray.
 * @example
 * ```tsx
 * <line>
 *   <bufferGeometry>
 *     <bufferAttribute attach="attributes-position" args={[points, 3]} />
 *   </bufferGeometry>
 *   <lineBasicMaterial color="orange" />
 * </line>
 * ```
 * @category catalog
 * @standard
 */
export class Line extends Drawable {
  /** Always `true`, as on three's `Line` and its subclasses */
  public readonly isLine = true;
  /** three's class name */
  public type = 'Line';

  /**
   * @param geometry - The vertices
   * @param material - How to draw the lines
   * @param drawMode - How the vertices are joined; the subclasses set it
   */
  constructor(
    geometry: Geometry3D = new BufferGeometry(),
    material: BaseMaterial3D = new LineBasicMaterial(),
    drawMode: GeometryDrawMode = 'lineStrip',
  ) {
    super(geometry, material, drawMode);
  }

  /**
   * Adds a `lineDistance` attribute: each vertex's distance along the line, for dashed lines
   * @returns This line
   */
  public computeLineDistances(): this {
    const geometry = this.geometry;
    if (!(geometry instanceof BufferGeometry) || geometry.index) return this;
    const position = geometry.getAttribute('position');
    if (!position) return this;
    const distances = [0];
    for (let i = 1; i < position.count; i++) {
      const dx = position.getX(i) - position.getX(i - 1);
      const dy = position.getY(i) - position.getY(i - 1);
      const dz = position.getZ(i) - position.getZ(i - 1);
      distances[i] = distances[i - 1] + Math.hypot(dx, dy, dz);
    }
    geometry.setAttribute('lineDistance', new Float32BufferAttribute(distances, 1));
    return this;
  }

  /**
   * Adds every segment within `raycaster.params.Line.threshold` of the ray
   * @param raycaster - The raycaster
   * @param intersects - List the hits are added to
   */
  public raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    if (this.geometry instanceof BufferGeometry) raycastLine(this, this.geometry, 1, false, raycaster, intersects);
  }
}

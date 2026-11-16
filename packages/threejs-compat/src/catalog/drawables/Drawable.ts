import { Mesh3D } from '@pixi/3d';
import type { BaseMaterial3D, Geometry3D, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
import { BufferGeometry } from '../geometries/BufferGeometry';
import type { GeometryDrawMode } from '../geometries/BufferGeometry';

/**
 * What three's points, lines and sprites share over pixi-3d's `Mesh3D`: no shadows, not a mesh to
 * three's checks, and a geometry drawn in their own mode
 * @internal
 */
export class Drawable extends Mesh3D {
  /** `false`: three's checks don't take it for a mesh */
  public readonly isMesh: boolean = false;
  /** How its geometry is drawn */
  private readonly _drawMode: GeometryDrawMode;

  /**
   * @param geometry - The vertices
   * @param material - How to shade them
   * @param drawMode - How the vertices are drawn
   */
  constructor(geometry: Geometry3D, material: BaseMaterial3D, drawMode: GeometryDrawMode) {
    if (geometry instanceof BufferGeometry) geometry._mode = drawMode;
    super({ geometry, material, castShadow: false, receiveShadow: false });
    this._drawMode = drawMode;
  }

  /**
   * The vertices, typed as three's `BufferGeometry` for three code; a {@link BufferGeometry} given to
   * it is drawn in its mode, and a pixi-3d geometry as it is
   */
  public override get geometry(): BufferGeometry {
    return super.geometry as BufferGeometry;
  }

  public override set geometry(value: Geometry3D) {
    if (value instanceof BufferGeometry && this._drawMode) value._mode = this._drawMode;
    super.geometry = value;
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

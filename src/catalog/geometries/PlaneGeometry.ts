import { PlaneGeometry as PixiPlaneGeometry } from '@pixi/3d';

/**
 * three's `PlaneGeometry` over pixi-3d's, with three's positional constructor
 *
 * Both lie in the XY plane facing +Z. The UVs are flipped so an image shows the right way up, as
 * it does on a three plane.
 * @example
 * ```tsx
 * <planeGeometry args={[10, 10]} />
 * ```
 * @category catalog
 * @standard
 */
export class PlaneGeometry extends PixiPlaneGeometry {
  /**
   * @param width - Size along X
   * @param height - Size along Y
   * @param widthSegments - Subdivisions along X
   * @param heightSegments - Subdivisions along Y
   */
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super({ width, height, widthSegments, heightSegments, flipV: true });
  }
}

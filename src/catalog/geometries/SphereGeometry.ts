import { SphereGeometry as PixiSphereGeometry } from '@pixi/3d';

/**
 * three's `SphereGeometry` over pixi-3d's, with three's positional constructor
 *
 * pixi-3d builds whole spheres only, so three's partial sweeps (`phiStart`, `thetaLength`, ...)
 * are not taken.
 * @example
 * ```tsx
 * <sphereGeometry args={[0.5, 32, 16]} />
 * ```
 * @category catalog
 * @standard
 */
export class SphereGeometry extends PixiSphereGeometry {
  /**
   * @param radius - Sphere radius
   * @param widthSegments - Segments around the equator
   * @param heightSegments - Segments from pole to pole
   */
  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    super({ radius, widthSegments, heightSegments });
  }
}

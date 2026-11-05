import { CubeGeometry } from '@pixi/3d';

/**
 * three's `BoxGeometry` over pixi-3d's `CubeGeometry`, with three's positional constructor
 * @example
 * ```tsx
 * <boxGeometry args={[1, 2, 3]} />
 * ```
 * @category catalog
 * @standard
 */
export class BoxGeometry extends CubeGeometry {
  /**
   * @param width - Size along X
   * @param height - Size along Y
   * @param depth - Size along Z
   * @param widthSegments - Subdivisions along X
   * @param heightSegments - Subdivisions along Y
   * @param depthSegments - Subdivisions along Z
   */
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super({ width, height, depth, widthSegments, heightSegments, depthSegments });
  }
}

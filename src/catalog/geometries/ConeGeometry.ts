/*!
 * Adapted from three.js r187, src/geometries/ConeGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { CylinderGeometry } from './CylinderGeometry';

/**
 * three's `ConeGeometry`: a {@link CylinderGeometry} with no top, built by three's generator
 * @example
 * ```tsx
 * <coneGeometry args={[0.5, 1.5, 32]} />
 * ```
 * @category catalog
 * @standard
 */
export class ConeGeometry extends CylinderGeometry {
  /** The arguments it was built from */
  declare public parameters: CylinderGeometry['parameters'] & { radius: number };

  /**
   * @param radius - Radius at the bottom
   * @param height - Size along Y
   * @param radialSegments - Segments around
   * @param heightSegments - Segments along Y
   * @param openEnded - Leave the base out
   * @param thetaStart - Where the sweep starts, in radians
   * @param thetaLength - How far the sweep goes, in radians
   */
  constructor(
    radius = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super(0, radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
    this.type = 'ConeGeometry';
    this.parameters = {
      ...this.parameters,
      radius,
    };
  }
}

/*!
 * Adapted from three.js r187, src/geometries/TetrahedronGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { PolyhedronGeometry } from './PolyhedronGeometry';

const VERTICES = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1];
const INDICES = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];

/**
 * three's `TetrahedronGeometry`, built by three's generator: four faces, subdivided toward a sphere
 * by `detail`
 * @example
 * ```tsx
 * <tetrahedronGeometry args={[1, 0]} />
 * ```
 * @category catalog
 * @standard
 */
export class TetrahedronGeometry extends PolyhedronGeometry {
  /**
   * @param radius - Radius of the sphere the corners lie on
   * @param detail - How many times each face is subdivided
   */
  constructor(radius = 1, detail = 0) {
    super(VERTICES, INDICES, radius, detail);
    this.type = 'TetrahedronGeometry';
    this.parameters = { ...this.parameters, radius, detail };
  }
}

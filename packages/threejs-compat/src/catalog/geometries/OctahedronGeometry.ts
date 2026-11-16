/*!
 * Adapted from three.js r187, src/geometries/OctahedronGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { PolyhedronGeometry } from './PolyhedronGeometry';

const VERTICES = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
const INDICES = [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2];

/**
 * three's `OctahedronGeometry`, built by three's generator: eight faces, subdivided toward a sphere
 * by `detail`
 * @example
 * ```tsx
 * <octahedronGeometry args={[1, 0]} />
 * ```
 * @category catalog
 * @standard
 */
export class OctahedronGeometry extends PolyhedronGeometry {
  /**
   * @param radius - Radius of the sphere the corners lie on
   * @param detail - How many times each face is subdivided
   */
  constructor(radius = 1, detail = 0) {
    super(VERTICES, INDICES, radius, detail);
    this.type = 'OctahedronGeometry';
    this.parameters = { ...this.parameters, radius, detail };
  }
}

/*!
 * Adapted from three.js r187, src/geometries/IcosahedronGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { PolyhedronGeometry } from './PolyhedronGeometry';

const t = (1 + Math.sqrt(5)) / 2;
// prettier-ignore
const VERTICES = [
  -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
  0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
  t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
];
// prettier-ignore
const INDICES = [
  0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
  1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
  3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
  4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
];

/**
 * three's `IcosahedronGeometry`, built by three's generator: twenty faces, subdivided toward a
 * sphere by `detail`
 * @example
 * ```tsx
 * <icosahedronGeometry args={[1, 0]} />
 * ```
 * @category catalog
 * @standard
 */
export class IcosahedronGeometry extends PolyhedronGeometry {
  /**
   * @param radius - Radius of the sphere the corners lie on
   * @param detail - How many times each face is subdivided
   */
  constructor(radius = 1, detail = 0) {
    super(VERTICES, INDICES, radius, detail);
    this.type = 'IcosahedronGeometry';
    this.parameters = { ...this.parameters, radius, detail };
  }
}

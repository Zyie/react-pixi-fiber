/*!
 * Adapted from three.js r187, src/geometries/CircleGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `CircleGeometry`, built by three's generator: a disc in the XY plane facing +Z, or a
 * slice of one
 * @example
 * ```tsx
 * <circleGeometry args={[1, 32]} />
 * ```
 * @category catalog
 * @standard
 */
export class CircleGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { radius: number; segments: number; thetaStart: number; thetaLength: number };

  /**
   * @param radius - Radius of the disc
   * @param segments - Segments around, at least 3
   * @param thetaStart - Where the sweep starts, in radians
   * @param thetaLength - How far the sweep goes, in radians
   */
  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength: number = Math.PI * 2) {
    super();
    this.type = 'CircleGeometry';
    this.parameters = { radius, segments, thetaStart, thetaLength };

    const count = Math.max(3, segments);
    const indices: number[] = [];
    const vertices: number[] = [0, 0, 0];
    const normals: number[] = [0, 0, 1];
    const uvs: number[] = [0.5, 0.5];

    for (let s = 0; s <= count; s++) {
      const segment = thetaStart + (s / count) * thetaLength;
      const x = radius * Math.cos(segment);
      const y = radius * Math.sin(segment);
      vertices.push(x, y, 0);
      normals.push(0, 0, 1);
      uvs.push((x / radius + 1) / 2, (y / radius + 1) / 2);
    }

    for (let i = 1; i <= count; i++) indices.push(i, i + 1, 0);

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

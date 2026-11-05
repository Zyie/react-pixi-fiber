/*!
 * Adapted from three.js r187, src/geometries/TorusGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `TorusGeometry`, built by three's generator: a ring around Z
 * @example
 * ```tsx
 * <torusGeometry args={[1, 0.3, 16, 64]} />
 * ```
 * @category catalog
 * @standard
 */
export class TorusGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
    arc: number;
    thetaStart: number;
    thetaLength: number;
  };

  /**
   * @param radius - From the centre to the middle of the tube
   * @param tube - Radius of the tube
   * @param radialSegments - Segments around the tube
   * @param tubularSegments - Segments around the ring
   * @param arc - How far around the ring, in radians
   * @param thetaStart - Where the sweep around the tube starts, in radians
   * @param thetaLength - How far the sweep around the tube goes, in radians
   */
  constructor(
    radius = 1,
    tube = 0.4,
    radialSegments = 12,
    tubularSegments = 48,
    arc: number = Math.PI * 2,
    thetaStart = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super();
    this.type = 'TorusGeometry';
    this.parameters = { radius, tube, radialSegments, tubularSegments, arc, thetaStart, thetaLength };

    const radial = Math.floor(radialSegments);
    const tubular = Math.floor(tubularSegments);
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (let j = 0; j <= radial; j++) {
      const v = thetaStart + (j / radial) * thetaLength;
      for (let i = 0; i <= tubular; i++) {
        const u = (i / tubular) * arc;
        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = (radius + tube * Math.cos(v)) * Math.sin(u);
        const z = tube * Math.sin(v);
        vertices.push(x, y, z);
        const nx = x - radius * Math.cos(u);
        const ny = y - radius * Math.sin(u);
        const length = Math.hypot(nx, ny, z) || 1;
        normals.push(nx / length, ny / length, z / length);
        uvs.push(i / tubular, j / radial);
      }
    }

    for (let j = 1; j <= radial; j++) {
      for (let i = 1; i <= tubular; i++) {
        const a = (tubular + 1) * j + i - 1;
        const b = (tubular + 1) * (j - 1) + i - 1;
        const c = (tubular + 1) * (j - 1) + i;
        const d = (tubular + 1) * j + i;
        indices.push(a, b, d, b, c, d);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

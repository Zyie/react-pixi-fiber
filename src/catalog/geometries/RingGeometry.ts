/*!
 * Adapted from three.js r187, src/geometries/RingGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `RingGeometry`, built by three's generator: a flat ring in the XY plane facing +Z
 * @example
 * ```tsx
 * <ringGeometry args={[0.5, 1, 32]} />
 * ```
 * @category catalog
 * @standard
 */
export class RingGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    innerRadius: number;
    outerRadius: number;
    thetaSegments: number;
    phiSegments: number;
    thetaStart: number;
    thetaLength: number;
  };

  /**
   * @param innerRadius - Radius of the hole
   * @param outerRadius - Radius of the ring
   * @param thetaSegments - Segments around, at least 3
   * @param phiSegments - Segments across, at least 1
   * @param thetaStart - Where the sweep starts, in radians
   * @param thetaLength - How far the sweep goes, in radians
   */
  constructor(
    innerRadius = 0.5,
    outerRadius = 1,
    thetaSegments = 32,
    phiSegments = 1,
    thetaStart = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super();
    this.type = 'RingGeometry';
    this.parameters = { innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength };

    const around = Math.max(3, thetaSegments);
    const across = Math.max(1, phiSegments);
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const radiusStep = (outerRadius - innerRadius) / across;
    let radius = innerRadius;

    for (let j = 0; j <= across; j++) {
      for (let i = 0; i <= around; i++) {
        const segment = thetaStart + (i / around) * thetaLength;
        const x = radius * Math.cos(segment);
        const y = radius * Math.sin(segment);
        vertices.push(x, y, 0);
        normals.push(0, 0, 1);
        uvs.push((x / outerRadius + 1) / 2, (y / outerRadius + 1) / 2);
      }
      radius += radiusStep;
    }

    for (let j = 0; j < across; j++) {
      const level = j * (around + 1);
      for (let i = 0; i < around; i++) {
        const a = i + level;
        const b = a + around + 1;
        const c = a + around + 2;
        const d = a + 1;
        indices.push(a, b, d, b, c, d);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

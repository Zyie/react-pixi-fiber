/*!
 * Adapted from three.js r187, src/geometries/SphereGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `SphereGeometry`, built by three's generator, partial sweeps (`phiStart`, `thetaLength`,
 * ...) included
 * @example
 * ```tsx
 * <sphereGeometry args={[0.5, 32, 16]} />
 * ```
 * @category catalog
 * @standard
 */
export class SphereGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    radius: number;
    widthSegments: number;
    heightSegments: number;
    phiStart: number;
    phiLength: number;
    thetaStart: number;
    thetaLength: number;
  };

  /**
   * @param radius - Sphere radius
   * @param widthSegments - Segments around the equator, at least 3
   * @param heightSegments - Segments from pole to pole, at least 2
   * @param phiStart - Where the horizontal sweep starts, in radians
   * @param phiLength - How far the horizontal sweep goes, in radians
   * @param thetaStart - Where the vertical sweep starts, in radians from the top
   * @param thetaLength - How far the vertical sweep goes, in radians
   */
  constructor(
    radius = 1,
    widthSegments = 32,
    heightSegments = 16,
    phiStart = 0,
    phiLength: number = Math.PI * 2,
    thetaStart = 0,
    thetaLength: number = Math.PI,
  ) {
    super();
    this.type = 'SphereGeometry';
    this.parameters = { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength };

    const ws = Math.max(3, Math.floor(widthSegments));
    const hs = Math.max(2, Math.floor(heightSegments));
    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
    const grid: number[][] = [];
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    let index = 0;

    for (let iy = 0; iy <= hs; iy++) {
      const row: number[] = [];
      const v = iy / hs;
      const theta = thetaStart + v * thetaLength;
      const y = radius * Math.cos(theta);
      const ringRadius = Math.sqrt(radius * radius - y * y);
      let uOffset = 0;
      if (iy === 0 && thetaStart === 0) uOffset = 0.5 / ws;
      else if (iy === hs && thetaEnd === Math.PI) uOffset = -0.5 / ws;

      for (let ix = 0; ix <= ws; ix++) {
        const u = ix / ws;
        const phi = phiStart + u * phiLength;
        const x = -ringRadius * Math.cos(phi);
        const z = ringRadius * Math.sin(phi);
        const length = Math.hypot(x, y, z) || 1;
        vertices.push(x, y, z);
        normals.push(x / length, y / length, z / length);
        uvs.push(u + uOffset, 1 - v);
        row.push(index++);
      }
      grid.push(row);
    }

    for (let iy = 0; iy < hs; iy++) {
      for (let ix = 0; ix < ws; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];
        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== hs - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

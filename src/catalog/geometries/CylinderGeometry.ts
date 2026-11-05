/*!
 * Adapted from three.js r187, src/geometries/CylinderGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `CylinderGeometry`, built by three's generator, with a group for the side and one for
 * each cap
 * @example
 * ```tsx
 * <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
 * ```
 * @category catalog
 * @standard
 */
export class CylinderGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    radialSegments: number;
    heightSegments: number;
    openEnded: boolean;
    thetaStart: number;
    thetaLength: number;
  };

  /**
   * @param radiusTop - Radius at the top
   * @param radiusBottom - Radius at the bottom
   * @param height - Size along Y
   * @param radialSegments - Segments around
   * @param heightSegments - Segments along Y
   * @param openEnded - Leave the caps out
   * @param thetaStart - Where the sweep starts, in radians
   * @param thetaLength - How far the sweep goes, in radians
   */
  constructor(
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength: number = Math.PI * 2,
  ) {
    super();
    this.type = 'CylinderGeometry';
    this.parameters = {
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength,
    };

    const rs = Math.floor(radialSegments);
    const hs = Math.floor(heightSegments);
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indexArray: number[][] = [];
    const halfHeight = height / 2;
    let index = 0;
    let groupStart = 0;

    const generateTorso = (): void => {
      let groupCount = 0;
      const slope = (radiusBottom - radiusTop) / height;

      for (let y = 0; y <= hs; y++) {
        const row: number[] = [];
        const v = y / hs;
        const radius = v * (radiusBottom - radiusTop) + radiusTop;
        for (let x = 0; x <= rs; x++) {
          const u = x / rs;
          const theta = u * thetaLength + thetaStart;
          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);
          vertices.push(radius * sinTheta, -v * height + halfHeight, radius * cosTheta);
          const length = Math.hypot(sinTheta, slope, cosTheta) || 1;
          normals.push(sinTheta / length, slope / length, cosTheta / length);
          uvs.push(u, 1 - v);
          row.push(index++);
        }
        indexArray.push(row);
      }

      for (let x = 0; x < rs; x++) {
        for (let y = 0; y < hs; y++) {
          const a = indexArray[y][x];
          const b = indexArray[y + 1][x];
          const c = indexArray[y + 1][x + 1];
          const d = indexArray[y][x + 1];
          if (radiusTop > 0 || y !== 0) {
            indices.push(a, b, d);
            groupCount += 3;
          }
          if (radiusBottom > 0 || y !== hs - 1) {
            indices.push(b, c, d);
            groupCount += 3;
          }
        }
      }

      this.addGroup(groupStart, groupCount, 0);
      groupStart += groupCount;
    };

    const generateCap = (top: boolean): void => {
      const centerIndexStart = index;
      const radius = top ? radiusTop : radiusBottom;
      const sign = top ? 1 : -1;
      let groupCount = 0;

      for (let x = 1; x <= rs; x++) {
        vertices.push(0, halfHeight * sign, 0);
        normals.push(0, sign, 0);
        uvs.push(0.5, 0.5);
        index++;
      }

      const centerIndexEnd = index;

      for (let x = 0; x <= rs; x++) {
        const u = x / rs;
        const theta = u * thetaLength + thetaStart;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        vertices.push(radius * sinTheta, halfHeight * sign, radius * cosTheta);
        normals.push(0, sign, 0);
        uvs.push(cosTheta * 0.5 + 0.5, sinTheta * 0.5 * sign + 0.5);
        index++;
      }

      for (let x = 0; x < rs; x++) {
        const c = centerIndexStart + x;
        const i = centerIndexEnd + x;
        if (top) indices.push(i, i + 1, c);
        else indices.push(i + 1, i, c);
        groupCount += 3;
      }

      this.addGroup(groupStart, groupCount, top ? 1 : 2);
      groupStart += groupCount;
    };

    generateTorso();
    if (!openEnded) {
      if (radiusTop > 0) generateCap(true);
      if (radiusBottom > 0) generateCap(false);
    }
    setGenerated(this, indices, vertices, normals, uvs);
  }
}

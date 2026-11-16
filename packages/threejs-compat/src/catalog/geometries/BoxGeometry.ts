/*!
 * Adapted from three.js r187, src/geometries/BoxGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

type Axis = 'x' | 'y' | 'z';

/**
 * three's `BoxGeometry`, built by three's generator: the same vertices, normals, UVs, winding and
 * one group per face, in three's order (+X, -X, +Y, -Y, +Z, -Z)
 * @example
 * ```tsx
 * <boxGeometry args={[1, 2, 3]} />
 * ```
 * @category catalog
 * @standard
 */
export class BoxGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    width: number;
    height: number;
    depth: number;
    widthSegments: number;
    heightSegments: number;
    depthSegments: number;
  };

  /**
   * @param width - Size along X
   * @param height - Size along Y
   * @param depth - Size along Z
   * @param widthSegments - Subdivisions along X
   * @param heightSegments - Subdivisions along Y
   * @param depthSegments - Subdivisions along Z
   */
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super();
    this.type = 'BoxGeometry';
    this.parameters = { width, height, depth, widthSegments, heightSegments, depthSegments };

    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    let numberOfVertices = 0;
    let groupStart = 0;

    const buildPlane = (
      u: Axis,
      v: Axis,
      w: Axis,
      udir: number,
      vdir: number,
      planeWidth: number,
      planeHeight: number,
      planeDepth: number,
      gridX: number,
      gridY: number,
      materialIndex: number,
    ): void => {
      const segmentWidth = planeWidth / gridX;
      const segmentHeight = planeHeight / gridY;
      const widthHalf = planeWidth / 2;
      const heightHalf = planeHeight / 2;
      const depthHalf = planeDepth / 2;
      const gridX1 = gridX + 1;
      const gridY1 = gridY + 1;
      const vector = { x: 0, y: 0, z: 0 };
      let vertexCounter = 0;
      let groupCount = 0;

      for (let iy = 0; iy < gridY1; iy++) {
        const y = iy * segmentHeight - heightHalf;
        for (let ix = 0; ix < gridX1; ix++) {
          const x = ix * segmentWidth - widthHalf;
          vector[u] = x * udir;
          vector[v] = y * vdir;
          vector[w] = depthHalf;
          vertices.push(vector.x, vector.y, vector.z);
          vector[u] = 0;
          vector[v] = 0;
          vector[w] = planeDepth > 0 ? 1 : -1;
          normals.push(vector.x, vector.y, vector.z);
          uvs.push(ix / gridX, 1 - iy / gridY);
          vertexCounter += 1;
        }
      }

      for (let iy = 0; iy < gridY; iy++) {
        for (let ix = 0; ix < gridX; ix++) {
          const a = numberOfVertices + ix + gridX1 * iy;
          const b = numberOfVertices + ix + gridX1 * (iy + 1);
          const c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
          const d = numberOfVertices + (ix + 1) + gridX1 * iy;
          indices.push(a, b, d, b, c, d);
          groupCount += 6;
        }
      }

      this.addGroup(groupStart, groupCount, materialIndex);
      groupStart += groupCount;
      numberOfVertices += vertexCounter;
    };

    const ws = Math.floor(widthSegments);
    const hs = Math.floor(heightSegments);
    const ds = Math.floor(depthSegments);
    buildPlane('z', 'y', 'x', -1, -1, depth, height, width, ds, hs, 0);
    buildPlane('z', 'y', 'x', 1, -1, depth, height, -width, ds, hs, 1);
    buildPlane('x', 'z', 'y', 1, 1, width, depth, height, ws, ds, 2);
    buildPlane('x', 'z', 'y', 1, -1, width, depth, -height, ws, ds, 3);
    buildPlane('x', 'y', 'z', 1, -1, width, height, depth, ws, hs, 4);
    buildPlane('x', 'y', 'z', -1, -1, width, height, -depth, ws, hs, 5);
    setGenerated(this, indices, vertices, normals, uvs);
  }
}

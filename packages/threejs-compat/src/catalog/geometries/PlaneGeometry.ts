/*!
 * Adapted from three.js r187, src/geometries/PlaneGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `PlaneGeometry`, built by three's generator: in the XY plane facing +Z, with an image the
 * right way up
 * @example
 * ```tsx
 * <planeGeometry args={[10, 10]} />
 * ```
 * @category catalog
 * @standard
 */
export class PlaneGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { width: number; height: number; widthSegments: number; heightSegments: number };

  /**
   * @param width - Size along X
   * @param height - Size along Y
   * @param widthSegments - Subdivisions along X
   * @param heightSegments - Subdivisions along Y
   */
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.type = 'PlaneGeometry';
    this.parameters = { width, height, widthSegments, heightSegments };

    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const gridX = Math.floor(widthSegments);
    const gridY = Math.floor(heightSegments);
    const gridX1 = gridX + 1;
    const gridY1 = gridY + 1;
    const segmentWidth = width / gridX;
    const segmentHeight = height / gridY;
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (let iy = 0; iy < gridY1; iy++) {
      const y = iy * segmentHeight - heightHalf;
      for (let ix = 0; ix < gridX1; ix++) {
        const x = ix * segmentWidth - widthHalf;
        vertices.push(x, -y, 0);
        normals.push(0, 0, 1);
        uvs.push(ix / gridX, 1 - iy / gridY);
      }
    }

    for (let iy = 0; iy < gridY; iy++) {
      for (let ix = 0; ix < gridX; ix++) {
        const a = ix + gridX1 * iy;
        const b = ix + gridX1 * (iy + 1);
        const c = ix + 1 + gridX1 * (iy + 1);
        const d = ix + 1 + gridX1 * iy;
        indices.push(a, b, d, b, c, d);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

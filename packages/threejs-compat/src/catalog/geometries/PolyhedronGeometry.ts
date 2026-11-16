/*!
 * Adapted from three.js r187, src/geometries/PolyhedronGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Vector3 } from '../../math/Vector3';
import { Float32BufferAttribute } from './BufferAttribute';
import { BufferGeometry } from './BufferGeometry';

const azimuth = (vector: Vector3): number => Math.atan2(vector.z, -vector.x);
const inclination = (vector: Vector3): number =>
  Math.atan2(-vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z));

/**
 * three's `PolyhedronGeometry`, built by three's generator: triangles projected onto a sphere and
 * subdivided `detail` times; flat normals at detail 0, smooth ones above
 * @example
 * ```tsx
 * <polyhedronGeometry args={[[1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1], [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1], 1, 0]} />
 * ```
 * @category catalog
 * @advanced
 */
export class PolyhedronGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { vertices: number[]; indices: number[]; radius: number; detail: number };

  /**
   * @param vertices - Corner positions, three numbers each
   * @param indices - Corners of each face, three per face
   * @param radius - Radius of the sphere the corners are projected onto
   * @param detail - How many times each face is subdivided
   */
  constructor(vertices: number[] = [], indices: number[] = [], radius = 1, detail = 0) {
    super();
    this.type = 'PolyhedronGeometry';
    this.parameters = { vertices, indices, radius, detail };

    const vertexBuffer: number[] = [];
    const uvBuffer: number[] = [];
    const pushVertex = (vertex: Vector3): void => {
      vertexBuffer.push(vertex.x, vertex.y, vertex.z);
    };
    const getVertexByIndex = (index: number, vertex: Vector3): void => {
      vertex.set(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
    };

    const subdivideFace = (a: Vector3, b: Vector3, c: Vector3): void => {
      const cols = detail + 1;
      const v: Vector3[][] = [];
      for (let i = 0; i <= cols; i++) {
        v[i] = [];
        const aj = a.clone().lerp(c, i / cols);
        const bj = b.clone().lerp(c, i / cols);
        const rows = cols - i;
        for (let j = 0; j <= rows; j++) {
          v[i][j] = j === 0 && i === cols ? aj : aj.clone().lerp(bj, j / rows);
        }
      }
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 2 * (cols - i) - 1; j++) {
          const k = Math.floor(j / 2);
          if (j % 2 === 0) {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k]);
            pushVertex(v[i][k]);
          } else {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k + 1]);
            pushVertex(v[i + 1][k]);
          }
        }
      }
    };

    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    for (let i = 0; i < indices.length; i += 3) {
      getVertexByIndex(indices[i], a);
      getVertexByIndex(indices[i + 1], b);
      getVertexByIndex(indices[i + 2], c);
      subdivideFace(a, b, c);
    }

    const vertex = new Vector3();
    for (let i = 0; i < vertexBuffer.length; i += 3) {
      vertex
        .set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2])
        .normalize()
        .multiplyScalar(radius);
      vertexBuffer[i] = vertex.x;
      vertexBuffer[i + 1] = vertex.y;
      vertexBuffer[i + 2] = vertex.z;
    }

    for (let i = 0; i < vertexBuffer.length; i += 3) {
      vertex.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
      uvBuffer.push(azimuth(vertex) / 2 / Math.PI + 0.5, 1 - (inclination(vertex) / Math.PI + 0.5));
    }

    const centroid = new Vector3();
    const correctUV = (u: number, stride: number, point: Vector3, azi: number): void => {
      if (azi < 0 && u === 1) uvBuffer[stride] = u - 1;
      if (point.x === 0 && point.z === 0) uvBuffer[stride] = azi / 2 / Math.PI + 0.5;
    };
    for (let i = 0, j = 0; i < vertexBuffer.length; i += 9, j += 6) {
      a.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
      b.set(vertexBuffer[i + 3], vertexBuffer[i + 4], vertexBuffer[i + 5]);
      c.set(vertexBuffer[i + 6], vertexBuffer[i + 7], vertexBuffer[i + 8]);
      const uA = uvBuffer[j];
      const uB = uvBuffer[j + 2];
      const uC = uvBuffer[j + 4];
      centroid.copy(a).add(b).add(c).divideScalar(3);
      const azi = azimuth(centroid);
      correctUV(uA, j, a, azi);
      correctUV(uB, j + 2, b, azi);
      correctUV(uC, j + 4, c, azi);
    }

    for (let i = 0; i < uvBuffer.length; i += 6) {
      const x0 = uvBuffer[i];
      const x1 = uvBuffer[i + 2];
      const x2 = uvBuffer[i + 4];
      if (Math.max(x0, x1, x2) > 0.9 && Math.min(x0, x1, x2) < 0.1) {
        if (x0 < 0.2) uvBuffer[i] += 1;
        if (x1 < 0.2) uvBuffer[i + 2] += 1;
        if (x2 < 0.2) uvBuffer[i + 4] += 1;
      }
    }

    this.setAttribute('position', new Float32BufferAttribute(vertexBuffer, 3));
    this.setAttribute('normal', new Float32BufferAttribute(vertexBuffer.slice(), 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvBuffer, 2));
    if (detail === 0) this.computeVertexNormals();
    else this.normalizeNormals();
  }
}

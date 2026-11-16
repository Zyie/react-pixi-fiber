/*!
 * Adapted from three.js r187, src/geometries/TorusKnotGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Vector3 } from '../../math/Vector3';
import { BufferGeometry, setGenerated } from './BufferGeometry';

function positionOnCurve(u: number, p: number, q: number, radius: number, position: Vector3): void {
  const cu = Math.cos(u);
  const su = Math.sin(u);
  const quOverP = (q / p) * u;
  const cs = Math.cos(quOverP);
  position.x = radius * (2 + cs) * 0.5 * cu;
  position.y = radius * (2 + cs) * su * 0.5;
  position.z = radius * Math.sin(quOverP) * 0.5;
}

/**
 * three's `TorusKnotGeometry`, built by three's generator: a tube wound `p` times around its axis
 * and `q` times through its hole
 * @example
 * ```tsx
 * <torusKnotGeometry args={[1, 0.3, 128, 16]} />
 * ```
 * @category catalog
 * @standard
 */
export class TorusKnotGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    radius: number;
    tube: number;
    tubularSegments: number;
    radialSegments: number;
    p: number;
    q: number;
  };

  /**
   * @param radius - Radius of the knot
   * @param tube - Radius of the tube
   * @param tubularSegments - Segments along the tube
   * @param radialSegments - Segments around the tube
   * @param p - Turns around the axis of symmetry
   * @param q - Turns around a circle in the interior of the torus
   */
  constructor(radius = 1, tube = 0.4, tubularSegments = 64, radialSegments = 8, p = 2, q = 3) {
    super();
    this.type = 'TorusKnotGeometry';
    this.parameters = { radius, tube, tubularSegments, radialSegments, p, q };

    const tubular = Math.floor(tubularSegments);
    const radial = Math.floor(radialSegments);
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const vertex = new Vector3();
    const normal = new Vector3();
    const P1 = new Vector3();
    const P2 = new Vector3();
    const B = new Vector3();
    const T = new Vector3();
    const N = new Vector3();

    for (let i = 0; i <= tubular; ++i) {
      const u = (i / tubular) * p * Math.PI * 2;
      positionOnCurve(u, p, q, radius, P1);
      positionOnCurve(u + 0.01, p, q, radius, P2);
      T.subVectors(P2, P1);
      N.addVectors(P2, P1);
      B.crossVectors(T, N);
      N.crossVectors(B, T);
      B.normalize();
      N.normalize();

      for (let j = 0; j <= radial; ++j) {
        const v = (j / radial) * Math.PI * 2;
        const cx = -tube * Math.cos(v);
        const cy = tube * Math.sin(v);
        vertex.x = P1.x + (cx * N.x + cy * B.x);
        vertex.y = P1.y + (cx * N.y + cy * B.y);
        vertex.z = P1.z + (cx * N.z + cy * B.z);
        vertices.push(vertex.x, vertex.y, vertex.z);
        normal.subVectors(vertex, P1).normalize();
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(i / tubular, j / radial);
      }
    }

    for (let j = 1; j <= tubular; j++) {
      for (let i = 1; i <= radial; i++) {
        const a = (radial + 1) * (j - 1) + (i - 1);
        const b = (radial + 1) * j + (i - 1);
        const c = (radial + 1) * j + i;
        const d = (radial + 1) * (j - 1) + i;
        indices.push(a, b, d, b, c, d);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

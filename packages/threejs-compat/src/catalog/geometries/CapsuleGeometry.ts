/*!
 * Adapted from three.js r187, src/geometries/CapsuleGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferGeometry, setGenerated } from './BufferGeometry';

/**
 * three's `CapsuleGeometry`, built by three's generator: a cylinder with half spheres on its ends
 * @example
 * ```tsx
 * <capsuleGeometry args={[0.5, 1, 4, 16]} />
 * ```
 * @category catalog
 * @standard
 */
export class CapsuleGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: {
    radius: number;
    height: number;
    capSegments: number;
    radialSegments: number;
    heightSegments: number;
  };

  /**
   * @param radius - Radius of the capsule
   * @param height - Length of the middle part
   * @param capSegments - Segments along each cap
   * @param radialSegments - Segments around
   * @param heightSegments - Segments along the middle part
   */
  constructor(radius = 1, height = 1, capSegments = 4, radialSegments = 8, heightSegments = 1) {
    super();
    this.type = 'CapsuleGeometry';
    this.parameters = { radius, height, capSegments, radialSegments, heightSegments };

    const length = Math.max(0, height);
    const caps = Math.max(1, Math.floor(capSegments));
    const radial = Math.max(3, Math.floor(radialSegments));
    const middle = Math.max(1, Math.floor(heightSegments));
    const indices: number[] = [];
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const halfHeight = length / 2;
    const capArcLength = (Math.PI / 2) * radius;
    const totalArcLength = 2 * capArcLength + length;
    const rows = caps * 2 + middle;
    const verticesPerRow = radial + 1;

    for (let iy = 0; iy <= rows; iy++) {
      let currentArcLength = 0;
      let profileY = 0;
      let profileRadius = 0;
      let normalY = 0;

      if (iy <= caps) {
        const progress = iy / caps;
        const angle = (progress * Math.PI) / 2;
        profileY = -halfHeight - radius * Math.cos(angle);
        profileRadius = radius * Math.sin(angle);
        normalY = -radius * Math.cos(angle);
        currentArcLength = progress * capArcLength;
      } else if (iy <= caps + middle) {
        const progress = (iy - caps) / middle;
        profileY = -halfHeight + progress * length;
        profileRadius = radius;
        normalY = 0;
        currentArcLength = capArcLength + progress * length;
      } else {
        const progress = (iy - caps - middle) / caps;
        const angle = (progress * Math.PI) / 2;
        profileY = halfHeight + radius * Math.sin(angle);
        profileRadius = radius * Math.cos(angle);
        normalY = radius * Math.sin(angle);
        currentArcLength = capArcLength + length + progress * capArcLength;
      }

      const v = Math.max(0, Math.min(1, currentArcLength / totalArcLength));
      let uOffset = 0;
      if (iy === 0) uOffset = 0.5 / radial;
      else if (iy === rows) uOffset = -0.5 / radial;

      for (let ix = 0; ix <= radial; ix++) {
        const u = ix / radial;
        const theta = u * Math.PI * 2;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const x = -profileRadius * cosTheta;
        const z = profileRadius * sinTheta;
        vertices.push(x, profileY, z);
        const normalLength = Math.hypot(x, normalY, z) || 1;
        normals.push(x / normalLength, normalY / normalLength, z / normalLength);
        uvs.push(u + uOffset, v);
      }

      if (iy > 0) {
        const previousRow = (iy - 1) * verticesPerRow;
        for (let ix = 0; ix < radial; ix++) {
          const i1 = previousRow + ix;
          const i2 = previousRow + ix + 1;
          const i3 = iy * verticesPerRow + ix;
          const i4 = iy * verticesPerRow + ix + 1;
          indices.push(i1, i2, i3, i2, i4, i3);
        }
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

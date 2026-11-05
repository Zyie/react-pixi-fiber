/*!
 * Adapted from three.js r187, src/geometries/LatheGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Vector2 } from '../../math/Vector2';
import { BufferGeometry, setGenerated } from './BufferGeometry';

/** A point of a lathe's profile: its distance from the Y axis and its height */
type LathePoint = { x: number; y: number };

const normalize3 = (v: [number, number, number]): [number, number, number] => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

/**
 * three's `LatheGeometry`, built by three's generator: a profile of points spun around the Y axis,
 * as a vase is turned
 * @example
 * ```tsx
 * <latheGeometry args={[[new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)], 24]} />
 * ```
 * @category catalog
 * @standard
 */
export class LatheGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { points: LathePoint[]; segments: number; phiStart: number; phiLength: number };

  /**
   * @param points - The profile, `x` the distance from the Y axis and `y` the height
   * @param segments - Segments around
   * @param phiStart - Where the sweep starts, in radians
   * @param phiLength - How far the sweep goes, in radians
   */
  constructor(
    points: LathePoint[] = [new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)],
    segments = 12,
    phiStart = 0,
    phiLength = Math.PI * 2,
  ) {
    super();
    this.type = 'LatheGeometry';
    this.parameters = { points, segments, phiStart, phiLength };

    const count = Math.floor(segments);
    const sweep = Math.min(Math.max(phiLength, 0), Math.PI * 2);
    const last = points.length - 1;
    const indices: number[] = [];
    const vertices: number[] = [];
    const uvs: number[] = [];
    const normals: number[] = [];
    const initNormals: number[] = [];
    let previous: [number, number, number] = [0, 0, 0];

    for (let j = 0; j <= last; j++) {
      if (j === last) {
        initNormals.push(...normalize3(previous));
        continue;
      }
      const dx = points[j + 1].x - points[j].x;
      const dy = points[j + 1].y - points[j].y;
      const current: [number, number, number] = [dy, -dx, 0];
      if (j === 0) {
        initNormals.push(...normalize3(current));
      } else {
        initNormals.push(...normalize3([current[0] + previous[0], current[1] + previous[1], 0]));
      }
      previous = current;
    }

    for (let i = 0; i <= count; i++) {
      const phi = phiStart + (i / count) * sweep;
      const sin = Math.sin(phi);
      const cos = Math.cos(phi);
      for (let j = 0; j <= last; j++) {
        vertices.push(points[j].x * sin, points[j].y, points[j].x * cos);
        uvs.push(i / count, j / last);
        normals.push(initNormals[3 * j] * sin, initNormals[3 * j + 1], initNormals[3 * j] * cos);
      }
    }

    for (let i = 0; i < count; i++) {
      for (let j = 0; j < last; j++) {
        const base = j + i * points.length;
        const a = base;
        const b = base + points.length;
        const c = base + points.length + 1;
        const d = base + 1;
        indices.push(a, b, d, c, d, b);
      }
    }

    setGenerated(this, indices, vertices, normals, uvs);
  }
}

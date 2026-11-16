/*!
 * Adapted from three.js r187, src/geometries/EdgesGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { MathUtils } from '../../math/MathUtils';
import { Vector3 } from '../../math/Vector3';
import { Float32BufferAttribute } from './BufferAttribute';
import { BufferGeometry } from './BufferGeometry';

interface EdgeData {
  index0: number;
  index1: number;
  normal: Vector3;
}

const corners = [new Vector3(), new Vector3(), new Vector3()];
const v0 = new Vector3();
const v1 = new Vector3();
const ab = new Vector3();
const cb = new Vector3();
const normal = new Vector3();

/**
 * three's `EdgesGeometry`: the edges of another geometry where its faces meet at more than
 * `thresholdAngle` degrees, as line pairs for a `<lineSegments>`
 * @example
 * ```tsx
 * <lineSegments>
 *   <edgesGeometry args={[new BoxGeometry()]} />
 *   <lineBasicMaterial color="black" />
 * </lineSegments>
 * ```
 * @category catalog
 * @standard
 */
export class EdgesGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { geometry: BufferGeometry | null; thresholdAngle: number };

  /**
   * @param geometry - The geometry whose edges to take
   * @param thresholdAngle - Faces meeting at less than this many degrees share no drawn edge
   */
  constructor(geometry: BufferGeometry | null = null, thresholdAngle = 1) {
    super();
    this.type = 'EdgesGeometry';
    this.parameters = { geometry, thresholdAngle };
    if (!geometry) return;

    const precision = 10 ** 4;
    const thresholdDot = Math.cos(MathUtils.DEG2RAD * thresholdAngle);
    const indexAttr = geometry.getIndex();
    const positionAttr = geometry.getAttribute('position');
    if (!positionAttr) return;
    const indexCount = indexAttr ? indexAttr.count : positionAttr.count;
    const indexArr = [0, 0, 0];
    const hashes: string[] = ['', '', ''];
    const edgeData = new Map<string, EdgeData | null>();
    const vertices: number[] = [];
    const hashOf = (v: Vector3): string =>
      `${Math.round(v.x * precision)},${Math.round(v.y * precision)},${Math.round(v.z * precision)}`;

    for (let i = 0; i < indexCount; i += 3) {
      for (let k = 0; k < 3; k++) {
        indexArr[k] = indexAttr ? indexAttr.getX(i + k) : i + k;
        corners[k].fromBufferAttribute(positionAttr, indexArr[k]);
        hashes[k] = hashOf(corners[k]);
      }
      cb.subVectors(corners[2], corners[1]);
      ab.subVectors(corners[0], corners[1]);
      normal.crossVectors(cb, ab).normalize();
      if (hashes[0] === hashes[1] || hashes[1] === hashes[2] || hashes[2] === hashes[0]) continue;

      for (let j = 0; j < 3; j++) {
        const jNext = (j + 1) % 3;
        const hash = `${hashes[j]}_${hashes[jNext]}`;
        const reverseHash = `${hashes[jNext]}_${hashes[j]}`;
        const sibling = edgeData.get(reverseHash);
        if (sibling) {
          if (normal.dot(sibling.normal) <= thresholdDot) {
            const a = corners[j];
            const b = corners[jNext];
            vertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
          edgeData.set(reverseHash, null);
        } else if (!edgeData.has(hash)) {
          edgeData.set(hash, { index0: indexArr[j], index1: indexArr[jNext], normal: normal.clone() });
        }
      }
    }

    for (const edge of edgeData.values()) {
      if (!edge) continue;
      v0.fromBufferAttribute(positionAttr, edge.index0);
      v1.fromBufferAttribute(positionAttr, edge.index1);
      vertices.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z);
    }

    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  }
}

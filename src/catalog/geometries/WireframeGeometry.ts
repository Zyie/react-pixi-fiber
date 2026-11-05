/*!
 * Adapted from three.js r187, src/geometries/WireframeGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Vector3 } from '../../math/Vector3';
import { Float32BufferAttribute } from './BufferAttribute';
import { BufferGeometry } from './BufferGeometry';

const start = new Vector3();
const end = new Vector3();

function isUniqueEdge(a: Vector3, b: Vector3, edges: Set<string>): boolean {
  const hash1 = `${a.x},${a.y},${a.z}-${b.x},${b.y},${b.z}`;
  const hash2 = `${b.x},${b.y},${b.z}-${a.x},${a.y},${a.z}`;
  if (edges.has(hash1) || edges.has(hash2)) return false;
  edges.add(hash1);
  edges.add(hash2);
  return true;
}

/**
 * three's `WireframeGeometry`: every edge of another geometry's triangles, once, as line pairs for
 * a `<lineSegments>`
 * @example
 * ```tsx
 * <lineSegments>
 *   <wireframeGeometry args={[new BoxGeometry(1, 1, 1, 2, 2, 2)]} />
 *   <lineBasicMaterial color="white" />
 * </lineSegments>
 * ```
 * @category catalog
 * @advanced
 */
export class WireframeGeometry extends BufferGeometry {
  /** The arguments it was built from */
  declare public parameters: { geometry: BufferGeometry | null };

  /** @param geometry - The geometry whose edges to take */
  constructor(geometry: BufferGeometry | null = null) {
    super();
    this.type = 'WireframeGeometry';
    this.parameters = { geometry };
    if (!geometry) return;

    const vertices: number[] = [];
    const edges = new Set<string>();
    const position = geometry.getAttribute('position');
    if (!position) return;
    const index = geometry.index;
    const addTriangleEdges = (corner: (k: number) => number): void => {
      for (let j = 0; j < 3; j++) {
        start.fromBufferAttribute(position, corner(j));
        end.fromBufferAttribute(position, corner((j + 1) % 3));
        if (isUniqueEdge(start, end, edges)) vertices.push(start.x, start.y, start.z, end.x, end.y, end.z);
      }
    };

    if (index) {
      const groups = geometry.groups.length > 0 ? geometry.groups : [{ start: 0, count: index.count }];
      for (const group of groups) {
        for (let i = group.start; i < group.start + group.count; i += 3) addTriangleEdges((k) => index.getX(i + k));
      }
    } else {
      for (let i = 0; i < position.count / 3; i++) addTriangleEdges((k) => 3 * i + k);
    }

    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  }
}

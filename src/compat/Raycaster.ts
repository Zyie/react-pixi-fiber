import { Matrix4, Mesh3D, Sphere } from '@pixi/3d';
import type { BaseMaterial3D, Camera3D, Container3D, Geometry3D, PointData3D } from '@pixi/3d';
import type { Attribute, PointData } from 'pixi.js';

import { BackSide, DoubleSide, FrontSide } from '../catalog/constants';
import { Ray } from '../math/Ray';
import { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import { cameraProjectionInverse, cameraWorld } from './cameraMatrices';

/**
 * The triangle a ray hit, as three's `Face`
 * @category events
 * @standard
 */
export interface Face {
  /** Index of the triangle's first vertex */
  a: number;
  /** Index of the triangle's second vertex */
  b: number;
  /** Index of the triangle's third vertex */
  c: number;
  /** The triangle's flat normal from its corners, in the object's local space, as three's `Triangle.getNormal` */
  normal: Vector3;
  /** Always 0: pixi-3d geometry has no material groups */
  materialIndex: number;
}

/**
 * One hit from {@link Raycaster.intersectObject}, shaped like three's `Intersection`
 * @category events
 * @standard
 */
export interface Intersection<TObject extends Container3D = Container3D> {
  /** Distance from the ray's origin to the hit, in world units */
  distance: number;
  /** Where the ray hit, in world space */
  point: Vector3;
  /** The object that was hit */
  object: TObject;
  /** The triangle that was hit */
  face: Face | null;
  /** Index of the triangle that was hit */
  faceIndex?: number;
  /** Where in the triangle the hit is, as weights of its corners `a`, `b` and `c` */
  barycoord?: Vector3;
  /** Texture coordinates at the hit, when the geometry has them */
  uv?: Vector2;
  /** Second texture coordinates at the hit; pixi-3d geometry has no second set, so always absent */
  uv1?: Vector2;
  /** The vertex normals blended at the hit, in the object's local space, turned to face the ray */
  normal?: Vector3;
  /** The instance hit, for an `InstancedMesh` */
  instanceId?: number;
  /** The vertex or segment hit, for points and lines; pixi-3d picks triangles only */
  index?: number;
}

/**
 * Per-type picking settings, kept for three's shape; pixi-3d picks triangles only
 * @category events
 * @advanced
 */
export interface RaycasterParameters {
  /** Settings for meshes */
  Mesh: Record<string, unknown>;
  /** Settings for lines */
  Line: { threshold: number };
  /** Settings for levels of detail */
  LOD: Record<string, unknown>;
  /** Settings for points */
  Points: { threshold: number };
  /** Settings for sprites */
  Sprite: Record<string, unknown>;
}

const byDistance = (a: Intersection, b: Intersection): number => a.distance - b.distance;

/**
 * three's `Raycaster` over pixi-3d's scene graph
 *
 * r3f's pointer events set it from the camera on every pointer move and ask it to intersect each
 * object that has a handler. The ray is built from the camera's own matrices, so any camera picks,
 * not only the one a view draws with. Each object is tested through its `raycast` method, as in
 * three: a mesh tests every triangle of its geometry, an `InstancedMesh` every instance, and
 * `<mesh raycast={() => null}>` opts an object out.
 *
 * Hits are three's: every triangle the ray crosses is a hit, nearest first, with `face`, `faceIndex`,
 * `barycoord`, `uv` and the blended vertex `normal`. Hidden objects are hit too, and the material's
 * `side` decides which faces count, as in three. pixi-3d has no layers, so there is no `layers` and
 * every object is tested.
 * @example
 * ```ts
 * import { Raycaster, Vector2 } from 'react-pixi-fiber/three';
 *
 * const raycaster = new Raycaster();
 * raycaster.setFromCamera(new Vector2(0, 0), camera);
 * const [nearest] = raycaster.intersectObject(scene, true);
 * ```
 * @category events
 * @standard
 */
export class Raycaster {
  /** The ray in world space */
  public readonly ray: Ray;
  /** Hits nearer than this are ignored */
  public near: number;
  /** Hits farther than this are ignored */
  public far: number;
  /** The camera the ray was last set from; r3f sets it to `null` or `undefined` to skip a layer */
  public camera: Camera3D | null | undefined = null;
  /** Per-type settings, kept for three's shape */
  public params: RaycasterParameters = {
    Mesh: {},
    Line: { threshold: 1 },
    LOD: {},
    Points: { threshold: 1 },
    Sprite: {},
  };

  /**
   * @param origin - Where the ray starts
   * @param direction - Which way it points; normalised
   * @param near - Hits nearer than this are ignored
   * @param far - Hits farther than this are ignored
   */
  constructor(origin?: PointData3D, direction?: PointData3D, near = 0, far: number = Infinity) {
    this.ray = new Ray();
    if (origin && direction) this.set(origin, direction);
    this.near = near;
    this.far = far;
  }

  /**
   * Points the ray
   * @param origin - Where the ray starts
   * @param direction - Which way it points; normalised
   */
  public set(origin: PointData3D, direction: PointData3D): void {
    this.ray.origin.copyFrom(origin);
    this.ray.direction.copyFrom(direction).normalize();
  }

  /**
   * Points the ray from a camera through a point on screen. A perspective camera casts from its
   * position; an orthographic one casts straight ahead from the point on its near plane.
   * @param coords - The point in normalised device coordinates, -1 to 1 on each axis
   * @param camera - The camera to cast from
   */
  public setFromCamera(coords: PointData, camera: Camera3D): void {
    const projectionInverse = cameraProjectionInverse(camera);
    const world = cameraWorld(camera);
    const { origin, direction } = this.ray;
    this.camera = camera;
    if (camera.mode === 'orthographic') {
      origin
        .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
        .applyMatrix4(projectionInverse)
        .applyMatrix4(world);
      direction.set(0, 0, -1).transformDirection(world);
    } else {
      origin.set(world.elements[12], world.elements[13], world.elements[14]);
      direction
        .set(coords.x, coords.y, 0.5)
        .applyMatrix4(projectionInverse)
        .applyMatrix4(world)
        .subtract(origin)
        .normalize();
    }
  }

  /**
   * Tests the ray against an object and, when `recursive`, its descendants
   * @param object - The object to test
   * @param recursive - Also test its descendants
   * @param intersects - List the hits are added to
   * @returns `intersects`, nearest first
   */
  public intersectObject<T extends Container3D = Container3D>(
    object: Container3D,
    recursive = true,
    intersects: Intersection<T>[] = [],
  ): Intersection<T>[] {
    this._intersect(object, recursive, intersects as Intersection[]);
    return intersects.sort(byDistance);
  }

  /**
   * Tests the ray against several objects and, when `recursive`, their descendants
   * @param objects - The objects to test
   * @param recursive - Also test their descendants
   * @param intersects - List the hits are added to
   * @returns `intersects`, nearest first
   */
  public intersectObjects<T extends Container3D = Container3D>(
    objects: Container3D[],
    recursive = true,
    intersects: Intersection<T>[] = [],
  ): Intersection<T>[] {
    for (const object of objects) this._intersect(object, recursive, intersects as Intersection[]);
    return intersects.sort(byDistance);
  }

  private _intersect(object: Container3D, recursive: boolean, intersects: Intersection[]): void {
    const stop = (object.raycast(this, intersects) as unknown) === false;
    if (stop || !recursive) return;
    for (const child of object.children) this._intersect(child, true, intersects);
  }
}

/** Reads one vertex attribute of a geometry, whatever its format, stride and offset */
interface AttributeReader {
  readonly components: number;
  /** Reads a vertex's components into `out`, decoding normalised integers to -1 to 1 or 0 to 1 */
  read(vertex: number, out: number[]): void;
}

const NORMALISED: Partial<Record<string, number>> = { snorm8: 127, unorm8: 255, snorm16: 32767, unorm16: 65535 };

/**
 * A reader for an attribute, or `null` when it has none or no CPU-side data
 * @param attribute - The attribute
 */
function attributeReader(attribute: Attribute | undefined): AttributeReader | null {
  const data = attribute?.buffer.data as ArrayLike<number> & { BYTES_PER_ELEMENT?: number };
  if (!attribute?.format || !data?.BYTES_PER_ELEMENT) return null;

  const [type, count] = attribute.format.split('x');
  const components = Number(count ?? 1);
  const bytes = data.BYTES_PER_ELEMENT;
  const scale = NORMALISED[type];
  const stride = attribute.stride ? attribute.stride / bytes : components;
  const offset = (attribute.offset ?? 0) / bytes;

  return {
    components,
    read(vertex, out) {
      const start = offset + vertex * stride;
      for (let i = 0; i < components; i++) {
        const value = data[start + i];
        out[i] = scale ? Math.max(value / scale, -1) : value;
      }
    },
  };
}

const worldSphere = new Sphere();
const nearRay = new Ray();
const localRay = new Ray();
const inverse = new Matrix4();
const meshWorld = new Matrix4();
const sphereHit = new Vector3();
const hitPoint = new Vector3();
const vA = new Vector3();
const vB = new Vector3();
const vC = new Vector3();
const edge0 = new Vector3();
const edge1 = new Vector3();
const edge2 = new Vector3();
const lanesA: number[] = [0, 0, 0, 0];
const lanesB: number[] = [0, 0, 0, 0];
const lanesC: number[] = [0, 0, 0, 0];

/**
 * The weights of a triangle's corners at a point in its plane, as three's `Triangle.getBarycoord`
 * @param point - The point
 * @param a - The first corner
 * @param b - The second corner
 * @param c - The third corner
 */
function barycoordOf(point: Vector3, a: Vector3, b: Vector3, c: Vector3): Vector3 {
  edge0.copyFrom(c).subtract(a);
  edge1.copyFrom(b).subtract(a);
  edge2.copyFrom(point).subtract(a);

  const dot00 = edge0.dot(edge0);
  const dot01 = edge0.dot(edge1);
  const dot02 = edge0.dot(edge2);
  const dot11 = edge1.dot(edge1);
  const dot12 = edge1.dot(edge2);
  const denom = dot00 * dot11 - dot01 * dot01;

  if (denom === 0) return new Vector3(0, 0, 0);

  const u = (dot11 * dot02 - dot01 * dot12) / denom;
  const v = (dot00 * dot12 - dot01 * dot02) / denom;

  return new Vector3(1 - u - v, v, u);
}

/**
 * Blends an attribute at three corners by their weights, as three's `Triangle.getInterpolatedAttribute`
 * @param reader - The attribute
 * @param a - The first corner's vertex
 * @param b - The second corner's vertex
 * @param c - The third corner's vertex
 * @param weights - The corners' weights
 */
function blend(reader: AttributeReader, a: number, b: number, c: number, weights: Vector3): number[] {
  reader.read(a, lanesA);
  reader.read(b, lanesB);
  reader.read(c, lanesC);

  const out: number[] = [];
  for (let i = 0; i < reader.components; i++) {
    out.push(lanesA[i] * weights.x + lanesB[i] * weights.y + lanesC[i] * weights.z);
  }

  return out;
}

/** three's material `side`, from three's own field when the material has one, else pixi-3d's `doubleSided` */
const sideOf = (material: BaseMaterial3D): number =>
  (material as { side?: number }).side ?? (material.doubleSided ? DoubleSide : FrontSide);

/** The ray's shear for `crossTriangles`: its origin along kx, ky and kz, then sx, sy and sz */
const shear = new Float64Array(6);
/** What `crossTriangles` found: a triangle's number and the distance along the local ray, for each crossing */
let crossed = new Float64Array(64);

/**
 * Finds every triangle a ray crosses, by three's watertight test, the ray already sheared into
 * `shear`. Kept to typed arrays and numbers, so the loop over every triangle allocates nothing.
 * @param data - The positions
 * @param indices - The triangles' corners, or `null` when every three positions are one
 * @param corners - How many corners to read
 * @param stride - Floats from one position to the next
 * @param offset - The float the first position starts at
 * @param kx - The axis the ray's shear maps to x
 * @param ky - The axis it maps to y
 * @param kz - The ray's largest axis
 * @param side - three's material side
 * @returns How many crossings `crossed` holds
 */
function crossTriangles(
  data: Float32Array,
  indices: Uint16Array | Uint32Array | null,
  corners: number,
  stride: number,
  offset: number,
  kx: number,
  ky: number,
  kz: number,
  side: number,
): number {
  const okx = shear[0];
  const oky = shear[1];
  const okz = shear[2];
  const sx = shear[3];
  const sy = shear[4];
  const sz = shear[5];
  const cull = side !== DoubleSide;
  const back = side === BackSide;
  let count = 0;

  for (let i = 0; i + 2 < corners; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;
    const first = (back ? c : a) * stride + offset;
    const second = b * stride + offset;
    const third = (back ? a : c) * stride + offset;
    const bkz = data[second + kz] - okz;
    const ckz = data[third + kz] - okz;
    const pbx = data[second + kx] - okx - sx * bkz;
    const pby = data[second + ky] - oky - sy * bkz;
    const pcx = data[third + kx] - okx - sx * ckz;
    const pcy = data[third + ky] - oky - sy * ckz;
    const u = pcx * pby - pcy * pbx;

    if (cull && u < 0) continue;

    const akz = data[first + kz] - okz;
    const pax = data[first + kx] - okx - sx * akz;
    const pay = data[first + ky] - oky - sy * akz;
    const v = pax * pcy - pay * pcx;
    const w = pbx * pay - pby * pax;

    if (cull ? v < 0 || w < 0 : (u < 0 || v < 0 || w < 0) && (u > 0 || v > 0 || w > 0)) continue;

    const det = u + v + w;
    if (det === 0) continue;

    const tScaled = sz * (u * akz + v * bkz + w * ckz);
    if (det > 0 ? tScaled < 0 : tScaled > 0) continue;

    if (count * 2 + 2 > crossed.length) {
      const grown = new Float64Array(crossed.length * 2);
      grown.set(crossed);
      crossed = grown;
    }
    crossed[count * 2] = i / 3;
    crossed[count * 2 + 1] = tScaled / det;
    count++;
  }

  return count;
}

/**
 * Tests a ray against every triangle of a geometry placed by a world matrix, as three's
 * `Mesh.raycast` does, and adds a hit for each triangle it crosses
 * @param object - The object the hits name
 * @param geometry - The triangles
 * @param material - Its `side` decides which faces count
 * @param world - Where the geometry is in world space
 * @param raycaster - The ray, with its near and far limits
 * @param intersects - List the hits are added to
 * @returns How many hits were added
 * @internal
 */
export function raycastGeometry(
  object: Container3D,
  geometry: Geometry3D | undefined,
  material: BaseMaterial3D | undefined,
  world: Matrix4,
  raycaster: Raycaster,
  intersects: Intersection[],
): number {
  if (!geometry || !material || geometry.topology !== 'triangle-list') return 0;

  const { near, far } = raycaster;

  worldSphere.copyFrom(geometry.boundsSphere).applyMatrix4(world);
  nearRay.copy(raycaster.ray).recast(near);
  if (!worldSphere.containsPoint(nearRay.origin)) {
    if (nearRay.intersectSphere(worldSphere, sphereHit) === null) return 0;
    if (nearRay.origin.distanceToSquared(sphereHit) > (far - near) ** 2) return 0;
  }

  localRay.copy(raycaster.ray).applyMatrix4(inverse.getInverse(world));
  if (!localRay.intersectsBox(geometry.bounds3D)) return 0;

  const position = geometry.attributes.aPosition;
  const data = position.buffer.data;
  if (!(data instanceof Float32Array) || !position.format?.startsWith('float32')) return 0;

  const stride = position.stride ? position.stride / 4 : 3;
  const offset = (position.offset ?? 0) / 4;
  const uvs = attributeReader(geometry.attributes.aUV);
  const normals = attributeReader(geometry.attributes.aNormal);
  const indices = geometry.indexBuffer?.data as Uint16Array | Uint32Array | undefined;
  const side = sideOf(material);
  const corners = indices ? indices.length : Math.floor((data.length - offset) / stride);
  const before = intersects.length;

  // three's watertight test (`Ray.intersectTriangle`): the ray's largest axis is kz, and kx and ky
  // swap when it points down kz, which keeps the winding; the shear is the same for every triangle.
  const o = localRay.origin;
  const d = localRay.direction;
  const ax = Math.abs(d.x);
  const ay = Math.abs(d.y);
  const az = Math.abs(d.z);
  const kz = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
  const dz = kz === 0 ? d.x : kz === 1 ? d.y : d.z;
  if (dz === 0) return 0;
  const kx = kz === 0 ? (dz >= 0 ? 1 : 2) : kz === 1 ? (dz >= 0 ? 2 : 0) : dz >= 0 ? 0 : 1;
  const ky = kz === 0 ? (dz >= 0 ? 2 : 1) : kz === 1 ? (dz >= 0 ? 0 : 2) : dz >= 0 ? 1 : 0;

  shear[0] = kx === 0 ? o.x : kx === 1 ? o.y : o.z;
  shear[1] = ky === 0 ? o.x : ky === 1 ? o.y : o.z;
  shear[2] = kz === 0 ? o.x : kz === 1 ? o.y : o.z;
  shear[3] = (kx === 0 ? d.x : kx === 1 ? d.y : d.z) / dz;
  shear[4] = (ky === 0 ? d.x : ky === 1 ? d.y : d.z) / dz;
  shear[5] = 1 / dz;

  const crossings = crossTriangles(data, indices ?? null, corners, stride, offset, kx, ky, kz, side);

  for (let n = 0; n < crossings; n++) {
    const i = crossed[n * 2] * 3;
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;

    localRay.at(crossed[n * 2 + 1], hitPoint);

    const point = new Vector3().copyFrom(hitPoint).applyMatrix4(world);
    const distance = raycaster.ray.origin.distanceTo(point);
    if (distance < near || distance > far) continue;

    vA.fromArray(data, a * stride + offset);
    vB.fromArray(data, b * stride + offset);
    vC.fromArray(data, c * stride + offset);

    const barycoord = barycoordOf(hitPoint, vA, vB, vC);
    const faceNormal = new Vector3().copyFrom(vC).subtract(vB).cross(edge0.copyFrom(vA).subtract(vB));
    const lengthSq = faceNormal.dot(faceNormal);

    if (lengthSq > 0) faceNormal.multiplyScalar(1 / Math.sqrt(lengthSq));
    else faceNormal.set(0, 0, 0);

    const intersection: Intersection = {
      distance,
      point,
      object,
      face: { a, b, c, normal: faceNormal, materialIndex: 0 },
      faceIndex: Math.floor(i / 3),
      barycoord,
    };

    if (uvs) {
      const [x, y] = blend(uvs, a, b, c, barycoord);
      intersection.uv = new Vector2(x, y);
    }

    if (normals) {
      const [x, y, z] = blend(normals, a, b, c, barycoord);
      const normal = new Vector3(x, y, z);
      if (normal.dot(localRay.direction) > 0) normal.multiplyScalar(-1);
      intersection.normal = normal;
    }

    intersects.push(intersection);
  }

  return intersects.length - before;
}

/**
 * Tests a ray against every triangle of a mesh, as three's `Mesh.raycast` does
 * @param mesh - The mesh to test
 * @param raycaster - The ray, with its near and far limits
 * @param intersects - List the hits are added to
 * @internal
 */
export function raycastMesh(mesh: Mesh3D, raycaster: Raycaster, intersects: Intersection[]): void {
  raycastGeometry(mesh, mesh.geometry, mesh.material, mesh.getGlobalTransform(meshWorld), raycaster, intersects);
}

/**
 * Gives every `Mesh3D` three's `raycast`, so the {@link Raycaster} tests its triangles; the support
 * calls it with the rest of the three.js surface
 * @internal
 */
export function installRaycasting(): void {
  Object.defineProperty(Mesh3D.prototype, 'raycast', {
    configurable: true,
    writable: true,
    value(this: Mesh3D, raycaster: Raycaster, intersects: Intersection[]) {
      raycastMesh(this, raycaster, intersects);
    },
  });
}

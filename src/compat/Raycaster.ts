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
  /** How many vertices the attribute's buffer holds */
  readonly count: number;
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
    count: Math.floor((data.length - offset) / stride),
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
 * Where a ray crosses a triangle, by three's watertight test (`Ray.intersectTriangle`), into `out`
 * @param ray - The ray, in the triangle's space
 * @param a - The first corner
 * @param b - The second corner
 * @param c - The third corner
 * @param backfaceCulling - Miss a triangle that faces away from the ray
 * @param out - Where the crossing goes
 * @returns `out`, or `null` for a miss
 */
function intersectTriangle(
  ray: Ray,
  a: Vector3,
  b: Vector3,
  c: Vector3,
  backfaceCulling: boolean,
  out: Vector3,
): Vector3 | null {
  const { origin, direction } = ray;
  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;
  const aox = a.x - origin.x;
  const aoy = a.y - origin.y;
  const aoz = a.z - origin.z;
  const box = b.x - origin.x;
  const boy = b.y - origin.y;
  const boz = b.z - origin.z;
  const cox = c.x - origin.x;
  const coy = c.y - origin.y;
  const coz = c.z - origin.z;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const adz = Math.abs(dz);

  let dkx: number;
  let dky: number;
  let dkz: number;
  let akx: number;
  let aky: number;
  let akz: number;
  let bkx: number;
  let bky: number;
  let bkz: number;
  let ckx: number;
  let cky: number;
  let ckz: number;

  if (adx >= ady && adx >= adz) {
    dkz = dx;
    akz = aox;
    bkz = box;
    ckz = cox;
    if (dx >= 0) {
      dkx = dy;
      dky = dz;
      akx = aoy;
      aky = aoz;
      bkx = boy;
      bky = boz;
      ckx = coy;
      cky = coz;
    } else {
      dkx = dz;
      dky = dy;
      akx = aoz;
      aky = aoy;
      bkx = boz;
      bky = boy;
      ckx = coz;
      cky = coy;
    }
  } else if (ady >= adz) {
    dkz = dy;
    akz = aoy;
    bkz = boy;
    ckz = coy;
    if (dy >= 0) {
      dkx = dz;
      dky = dx;
      akx = aoz;
      aky = aox;
      bkx = boz;
      bky = box;
      ckx = coz;
      cky = cox;
    } else {
      dkx = dx;
      dky = dz;
      akx = aox;
      aky = aoz;
      bkx = box;
      bky = boz;
      ckx = cox;
      cky = coz;
    }
  } else {
    dkz = dz;
    akz = aoz;
    bkz = boz;
    ckz = coz;
    if (dz >= 0) {
      dkx = dx;
      dky = dy;
      akx = aox;
      aky = aoy;
      bkx = box;
      bky = boy;
      ckx = cox;
      cky = coy;
    } else {
      dkx = dy;
      dky = dx;
      akx = aoy;
      aky = aox;
      bkx = boy;
      bky = box;
      ckx = coy;
      cky = cox;
    }
  }

  if (dkz === 0) return null;

  const sx = dkx / dkz;
  const sy = dky / dkz;
  const sz = 1 / dkz;
  const ax = akx - sx * akz;
  const ay = aky - sy * akz;
  const bx = bkx - sx * bkz;
  const by = bky - sy * bkz;
  const cx = ckx - sx * ckz;
  const cy = cky - sy * ckz;
  const u = cx * by - cy * bx;
  const v = ax * cy - ay * cx;
  const w = bx * ay - by * ax;

  if (backfaceCulling) {
    if (u < 0 || v < 0 || w < 0) return null;
  } else if ((u < 0 || v < 0 || w < 0) && (u > 0 || v > 0 || w > 0)) return null;

  const det = u + v + w;
  if (det === 0) return null;

  const tScaled = sz * (u * akz + v * bkz + w * ckz);
  if (det > 0 ? tScaled < 0 : tScaled > 0) return null;

  return ray.at(tScaled / det, out) as Vector3;
}

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

  const positions = attributeReader(geometry.attributes.aPosition);
  if (!positions) return 0;

  const uvs = attributeReader(geometry.attributes.aUV);
  const normals = attributeReader(geometry.attributes.aNormal);
  const indices = geometry.indexBuffer?.data as Uint16Array | Uint32Array | undefined;
  const side = sideOf(material);
  const corners = indices ? indices.length : positions.count;
  const before = intersects.length;

  for (let i = 0; i + 2 < corners; i += 3) {
    const a = indices ? indices[i] : i;
    const b = indices ? indices[i + 1] : i + 1;
    const c = indices ? indices[i + 2] : i + 2;

    positions.read(a, lanesA);
    vA.set(lanesA[0], lanesA[1], lanesA[2]);
    positions.read(b, lanesB);
    vB.set(lanesB[0], lanesB[1], lanesB[2]);
    positions.read(c, lanesC);
    vC.set(lanesC[0], lanesC[1], lanesC[2]);

    const crossed =
      side === BackSide
        ? intersectTriangle(localRay, vC, vB, vA, true, hitPoint)
        : intersectTriangle(localRay, vA, vB, vC, side === FrontSide, hitPoint);
    if (!crossed) continue;

    const point = new Vector3().copyFrom(hitPoint).applyMatrix4(world);
    const distance = raycaster.ray.origin.distanceTo(point);
    if (distance < near || distance > far) continue;

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
      const [u, v] = blend(uvs, a, b, c, barycoord);
      intersection.uv = new Vector2(u, v);
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

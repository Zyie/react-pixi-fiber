import { Matrix4, Ray, Vector3 as PixiVector3, createHitResult3D, intersectRayGeometry } from '@pixi/3d';
import type { Camera3D, Container3D, Mesh3D, PointData3D } from '@pixi/3d';
import type { PointData } from 'pixi.js';

import { cameraProjectionInverse, cameraWorld } from './cameraMatrices';
import { ThreeVector2 } from './ThreeVector2';
import { ThreeVector3 } from './ThreeVector3';

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
  /** The triangle's flat normal, in the object's local space */
  normal: ThreeVector3;
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
  point: ThreeVector3;
  /** The object that was hit */
  object: TObject;
  /** The triangle that was hit */
  face: Face | null;
  /** Index of the triangle that was hit */
  faceIndex?: number;
  /** Texture coordinates at the hit */
  uv?: ThreeVector2;
  /** The hit triangle's flat normal, in the object's local space */
  normal?: ThreeVector3;
  /** The instance hit, for instanced meshes; pixi-3d has none yet */
  instanceId?: number;
  /** The vertex or segment hit, for points and lines; pixi-3d has none yet */
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
 * three's `Raycaster` over pixi-3d's per-triangle picking
 *
 * r3f's pointer events set it from the camera on every pointer move and ask it to intersect each
 * object that has a handler. The ray is built from the camera's own matrices, so any camera picks,
 * not only the one a view draws with. Each object is tested through its `raycast` method, as in
 * three: a mesh tests its geometry's triangles, and `<mesh raycast={() => null}>` opts a mesh out.
 *
 * As in three, hidden objects are hit too, and a single-sided material is not hit from behind.
 * @example
 * ```ts
 * import { Raycaster, ThreeVector2 } from 'react-pixi-fiber';
 *
 * const raycaster = new Raycaster();
 * raycaster.setFromCamera(new ThreeVector2(0, 0), camera);
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
   * Points the ray from a camera through a point on screen
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

const meshWorld = new Matrix4();
const meshInverse = new Matrix4();
const localRay = new Ray();
const hit = createHitResult3D();
const worldPoint = new PixiVector3();

/**
 * Tests a ray against every triangle of a mesh, as three's `Mesh.raycast` does, and adds the hit
 * @param mesh - The mesh to test
 * @param raycaster - The ray, with its near and far limits
 * @param intersects - List the hit is added to
 * @internal
 */
export function raycastMesh(mesh: Mesh3D, raycaster: Raycaster, intersects: Intersection[]): void {
  const geometry = mesh.geometry;
  if (!geometry) return;

  meshInverse.getInverse(mesh.getGlobalTransform(meshWorld));
  localRay.origin.copyFrom(raycaster.ray.origin).applyMatrix4(meshInverse);
  localRay.direction.copyFrom(raycaster.ray.direction).transformDirection(meshInverse);
  if (intersectRayGeometry(localRay, geometry, hit) < 0) return;

  const backFace = hit.normal.dot(localRay.direction) > 0;
  if (backFace && !mesh.material.doubleSided) return;

  worldPoint.copyFrom(hit.point).applyMatrix4(meshWorld);
  const distance = worldPoint.distanceTo(raycaster.ray.origin);
  if (distance < raycaster.near || distance > raycaster.far) return;

  const triangle = hit.triangleIndex;
  const indices = geometry.indexBuffer?.data as Uint16Array | Uint32Array | undefined;
  const vertex = (corner: number): number => (indices ? indices[triangle * 3 + corner] : triangle * 3 + corner);
  const normal = new ThreeVector3(hit.normal.x, hit.normal.y, hit.normal.z);

  intersects.push({
    distance,
    point: new ThreeVector3(worldPoint.x, worldPoint.y, worldPoint.z),
    object: mesh,
    face: { a: vertex(0), b: vertex(1), c: vertex(2), normal, materialIndex: 0 },
    faceIndex: triangle,
    uv: new ThreeVector2(hit.uv.x, hit.uv.y),
    normal: normal.clone(),
  });
}

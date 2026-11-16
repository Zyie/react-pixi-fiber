import { Matrix4, Mesh3D, Ray, Vector3, createHitResult3D, intersectRayHitVolume, resolveHitVolume } from '@pixi/3d';
import type { Camera3D, Container3D, HitVolume3D, PointData3D } from '@pixi/3d';
import type { PointData } from 'pixi.js';

import { cameraProjectionInverse, cameraWorld } from '../renderer/cameraMatrices';
import { noteCast } from '../stage/hitTest';
import type { Hit3D, RaycasterLike } from '../types/register';

const world = new Matrix4();
const inverse = new Matrix4();
const localRay = new Ray();
const result = createHitResult3D();

/**
 * The shape pixi-3d picks a node by: its `hitVolume`, else a mesh's geometry bounds, else none
 * @param node - The node
 */
function volumeOf(node: Container3D): HitVolume3D | null {
  if (node.hitVolume != null) return resolveHitVolume(node, node.hitVolume);
  return node instanceof Mesh3D ? node.geometry.bounds3D : null;
}

/**
 * Whether a node and every ancestor are visible, and no ancestor keeps its children from events, as
 * pixi-3d's picking requires
 * @param node - The node
 */
function reachable(node: Container3D): boolean {
  if (!node.visible || node.eventMode === 'none') return false;
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (!parent.visible || parent.eventMode === 'none' || !parent.interactiveChildren) return false;
  }
  return true;
}

/**
 * The raycaster core makes for a root, a portal and an anchor's occlusion test while no package
 * registers its own. It picks as pixi-3d's `EventBoundary3D` does, with pixi-3d's `hitVolume`s: a
 * mesh by its geometry's bounds unless its `hitVolume` says otherwise (`'geometry'` picks per
 * triangle), any other node only by a `hitVolume` of its own; hidden nodes, a node whose `eventMode`
 * is `'none'` and the children of one whose `interactiveChildren` is off are left out. Each hit is
 * pixi-3d's `RaycastHit3D`, with the node hit as r3f's `object`.
 * @category events
 * @advanced
 */
export class RootRaycaster implements RaycasterLike {
  /** The ray, in world space */
  public readonly ray: Ray = new Ray();
  /** The camera it was last set from; r3f sets it to `null` or `undefined` to skip a layer */
  public camera: Camera3D | undefined = undefined;
  /** Hits nearer than this are left out */
  public near: number = 0;
  /** Hits farther than this are left out */
  public far: number = Infinity;
  /** Settings by object type, which r3f's `raycaster` prop merges into; none apply here */
  public params: Record<string, object> = {};

  /**
   * Points the ray from an origin along a direction
   * @param origin - Where it starts
   * @param direction - Its unit direction
   */
  public set(origin: PointData3D, direction: PointData3D): void {
    this.ray.set(origin, direction);
  }

  /**
   * Points the ray from a camera through a point on screen, as r3f's events do for each pointer event
   * @param coords - The point, -1 to 1 on both axes, y up
   * @param camera - The camera
   */
  public setFromCamera(coords: PointData, camera: Camera3D): void {
    const projectionInverse = cameraProjectionInverse(camera);
    const cameraMatrix = cameraWorld(camera);
    const { origin, direction } = this.ray;
    noteCast();
    this.camera = camera;
    if (camera.mode === 'orthographic') {
      origin
        .set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far))
        .applyMatrix4(projectionInverse)
        .applyMatrix4(cameraMatrix);
      direction.set(0, 0, -1).transformDirection(cameraMatrix);
    } else {
      const elements = cameraMatrix.elements;
      origin.set(elements[12], elements[13], elements[14]);
      direction
        .set(coords.x, coords.y, 0.5)
        .applyMatrix4(projectionInverse)
        .applyMatrix4(cameraMatrix)
        .subtract(origin)
        .normalize();
    }
  }

  /**
   * The hits on an object, and on its descendants when `recursive`, nearest first
   * @param object - The object
   * @param recursive - Whether to test its descendants
   * @param target - A list the hits are added to
   * @returns `target`
   */
  public intersectObject(object: Container3D, recursive = true, target: Hit3D[] = []): Hit3D[] {
    if (reachable(object)) this._cast(object, recursive, target);
    return target.sort((a, b) => a.distance - b.distance);
  }

  /**
   * The hits on several objects, nearest first
   * @param objects - The objects
   * @param recursive - Whether to test their descendants
   * @param target - A list the hits are added to
   * @returns `target`
   */
  public intersectObjects(objects: readonly Container3D[], recursive = true, target: Hit3D[] = []): Hit3D[] {
    for (const object of objects) if (reachable(object)) this._cast(object, recursive, target);
    return target.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Adds a node's hit, then its children's
   * @param node - A node that is reachable
   * @param recursive - Whether to test its children
   * @param target - The hits so far
   */
  private _cast(node: Container3D, recursive: boolean, target: Hit3D[]): void {
    const volume = volumeOf(node);
    if (volume) this._castVolume(node, volume, target);
    if (!recursive || !node.interactiveChildren) return;
    for (const child of node.children) {
      if (child.visible && child.eventMode !== 'none') this._cast(child, true, target);
    }
  }

  /**
   * Adds the hit of the ray on a node's volume, if it is between `near` and `far`
   * @param node - The node
   * @param volume - Its volume, in its own space
   * @param target - The hits so far
   */
  private _castVolume(node: Container3D, volume: HitVolume3D, target: Hit3D[]): void {
    node.getGlobalTransform(world);
    this.ray.applyMatrix4(inverse.getInverse(world), localRay);
    if (intersectRayHitVolume(localRay, volume, result) < 0) return;
    const point = result.point.applyAffineMatrix4(world, new Vector3());
    const distance = point.distanceTo(this.ray.origin);
    if (distance < this.near || distance > this.far) return;
    const normal = new Vector3();
    if (result.triangleIndex !== -1) normal.copyFrom(result.normal).transformDirection(inverse.transpose());
    target.push({
      object: node,
      distance,
      point,
      localPoint: result.point.clone(),
      normal,
      uv: result.uv.clone(),
      triangleIndex: result.triangleIndex,
    });
  }
}

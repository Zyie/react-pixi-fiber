/*!
 * Adapted from three.js r187: src/objects/Points.js, Line.js and Sprite.js, src/math/Ray.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Matrix4 as PixiMatrix4 } from '@pixi/3d';
import type { Camera3D, Container3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { Sphere } from '../../math/Sphere';
import type { Vector2 } from '../../math/Vector2';
import { Vector3 } from '../../math/Vector3';
import type { BufferGeometry } from '../geometries/BufferGeometry';

/** A hit on a point or a line, with three's extra `distanceToRay` */
type DrawableHit = Intersection & { distanceToRay?: number };

const inverse = new PixiMatrix4();
const origin = new Vector3();
const direction = new Vector3();
const sphere = new Sphere();
const point = new Vector3();
const start = new Vector3();
const end = new Vector3();
const onRay = new Vector3();
const onSegment = new Vector3();

/**
 * The ray in an object's own space, from the world ray and the object's world matrix
 * @param raycaster - The raycaster
 * @param world - The object's world matrix
 */
function localRay(raycaster: Raycaster, world: PixiMatrix4): void {
  inverse.copyFrom(world).invert();
  origin.copyFrom(raycaster.ray.origin).applyMatrix4(inverse);
  direction.copyFrom(raycaster.ray.direction).transformDirection(inverse);
}

/** three's `Ray.distanceSqToSegment`, over the local ray, writing the closest points */
function distanceSqToSegment(v0: Vector3, v1: Vector3): number {
  const segCenter = new Vector3().addVectors(v0, v1).multiplyScalar(0.5);
  const segDir = new Vector3().subVectors(v1, v0).normalize();
  const diff = new Vector3().subVectors(origin, segCenter);
  const segExtent = v0.distanceTo(v1) * 0.5;
  const a01 = -direction.dot(segDir);
  const b0 = diff.dot(direction);
  const b1 = -diff.dot(segDir);
  const c = diff.lengthSq();
  const det = Math.abs(1 - a01 * a01);
  let s0: number;
  let s1: number;
  let sqrDist: number;

  if (det > 0) {
    s0 = a01 * b1 - b0;
    s1 = a01 * b0 - b1;
    const extDet = segExtent * det;
    if (s0 >= 0) {
      if (s1 >= -extDet) {
        if (s1 <= extDet) {
          const invDet = 1 / det;
          s0 *= invDet;
          s1 *= invDet;
          sqrDist = s0 * (s0 + a01 * s1 + 2 * b0) + s1 * (a01 * s0 + s1 + 2 * b1) + c;
        } else {
          s1 = segExtent;
          s0 = Math.max(0, -(a01 * s1 + b0));
          sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
        }
      } else {
        s1 = -segExtent;
        s0 = Math.max(0, -(a01 * s1 + b0));
        sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
      }
    } else if (s1 <= -extDet) {
      s0 = Math.max(0, -(-a01 * segExtent + b0));
      s1 = s0 > 0 ? -segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
      sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
    } else if (s1 <= extDet) {
      s0 = 0;
      s1 = Math.min(Math.max(-segExtent, -b1), segExtent);
      sqrDist = s1 * (s1 + 2 * b1) + c;
    } else {
      s0 = Math.max(0, -(a01 * segExtent + b0));
      s1 = s0 > 0 ? segExtent : Math.min(Math.max(-segExtent, -b1), segExtent);
      sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
    }
  } else {
    s1 = a01 > 0 ? -segExtent : segExtent;
    s0 = Math.max(0, -(a01 * s1 + b0));
    sqrDist = -s0 * s0 + s1 * (s1 + 2 * b1) + c;
  }

  onRay.copyFrom(direction).multiplyScalar(s0).add(origin);
  onSegment.copyFrom(segDir).multiplyScalar(s1).add(segCenter);
  return sqrDist;
}

/**
 * The geometry's world bounding sphere, grown by a threshold, misses the ray
 * @param geometry - The geometry
 * @param world - The object's world matrix
 * @param threshold - How far from the ray still counts
 * @param raycaster - The raycaster
 */
function missesBounds(geometry: BufferGeometry, world: PixiMatrix4, threshold: number, raycaster: Raycaster): boolean {
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  sphere.copy(geometry.boundingSphere!);
  sphere.applyMatrix4(world);
  sphere.radius += threshold;
  return !raycaster.ray.intersectsSphere(sphere);
}

/**
 * three's `Points.raycast`: each point within `raycaster.params.Points.threshold` of the ray is a hit
 * @param object - The points
 * @param geometry - Their geometry
 * @param raycaster - The raycaster
 * @param intersects - List the hits are added to
 * @internal
 */
export function raycastPoints(
  object: Container3D,
  geometry: BufferGeometry,
  raycaster: Raycaster,
  intersects: Intersection[],
): void {
  const world = object.matrixWorld as PixiMatrix4;
  const threshold = raycaster.params.Points.threshold;
  const position = geometry.getAttribute('position');
  if (!position || missesBounds(geometry, world, threshold, raycaster)) return;

  localRay(raycaster, world);
  const scale = object.scale;
  const localThreshold = threshold / ((scale.x + scale.y + scale.z) / 3);
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const first = Math.max(0, geometry.drawRange.start);
  const last = Math.min(count, geometry.drawRange.start + geometry.drawRange.count);

  for (let i = first; i < last; i++) {
    const vertex = index ? index.getX(i) : i;
    point.fromBufferAttribute(position, vertex);
    const toPoint = new Vector3().subVectors(point, origin);
    const along = Math.max(0, toPoint.dot(direction));
    const closest = new Vector3().copyFrom(direction).multiplyScalar(along).add(origin);
    const distanceSq = closest.distanceToSquared(point);
    if (distanceSq >= localThreshold * localThreshold) continue;
    closest.applyMatrix4(world);
    const distance = raycaster.ray.origin.distanceTo(closest);
    if (distance < raycaster.near || distance > raycaster.far) continue;
    intersects.push({
      distance,
      distanceToRay: Math.sqrt(distanceSq),
      point: closest,
      index: vertex,
      face: null,
      object,
    } as DrawableHit);
  }
}

/**
 * three's `Line.raycast`: each segment within `raycaster.params.Line.threshold` of the ray is a hit
 * @param object - The line
 * @param geometry - Its geometry
 * @param step - 1 for a strip, 2 for separate segments
 * @param loop - Whether the last vertex joins the first
 * @param raycaster - The raycaster
 * @param intersects - List the hits are added to
 * @internal
 */
export function raycastLine(
  object: Container3D,
  geometry: BufferGeometry,
  step: number,
  loop: boolean,
  raycaster: Raycaster,
  intersects: Intersection[],
): void {
  const world = object.matrixWorld as PixiMatrix4;
  const threshold = raycaster.params.Line.threshold;
  const position = geometry.getAttribute('position');
  if (!position || missesBounds(geometry, world, threshold, raycaster)) return;

  localRay(raycaster, world);
  const scale = object.scale;
  const localThreshold = threshold / ((scale.x + scale.y + scale.z) / 3);
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const first = Math.max(0, geometry.drawRange.start);
  const last = Math.min(count, geometry.drawRange.start + geometry.drawRange.count);
  const at = (i: number): number => (index ? index.getX(i) : i);

  const test = (a: number, b: number, segment: number): void => {
    start.fromBufferAttribute(position, a);
    end.fromBufferAttribute(position, b);
    const distanceSq = distanceSqToSegment(start, end);
    if (distanceSq > localThreshold * localThreshold) return;
    const hit = new Vector3().copyFrom(onRay).applyMatrix4(world);
    const distance = raycaster.ray.origin.distanceTo(hit);
    if (distance < raycaster.near || distance > raycaster.far) return;
    intersects.push({
      distance,
      point: new Vector3().copyFrom(onSegment).applyMatrix4(world),
      index: segment,
      face: null,
      faceIndex: undefined,
      object,
    });
  };

  for (let i = first; i < last - 1; i += step) test(at(i), at(i + 1), i);
  if (loop && last - first > 1) test(at(last - 1), at(first), last - 1);
}

const corner = [new Vector3(), new Vector3(), new Vector3()];
const viewPosition = new Vector3();
const worldScale = new Vector3();
const edge1 = new Vector3();
const edge2 = new Vector3();
const normal = new Vector3();
const diff = new Vector3();

/** three's `Ray.intersectTriangle`, two-sided, against the world ray; the distance along it, or `null` */
function intersectTriangle(raycaster: Raycaster, a: Vector3, b: Vector3, c: Vector3): number | null {
  const rayOrigin = raycaster.ray.origin;
  const rayDirection = raycaster.ray.direction;
  edge1.subVectors(b, a);
  edge2.subVectors(c, a);
  normal.crossVectors(edge1, edge2);
  let DdN = rayDirection.dot(normal);
  let sign: number;
  if (DdN > 0) sign = 1;
  else if (DdN < 0) {
    sign = -1;
    DdN = -DdN;
  } else return null;
  diff.subVectors(rayOrigin, a);
  const DdQxE2 = sign * rayDirection.dot(edge2.crossVectors(diff, edge2));
  if (DdQxE2 < 0) return null;
  const DdE1xQ = sign * rayDirection.dot(edge1.cross(diff));
  if (DdE1xQ < 0 || DdQxE2 + DdE1xQ > DdN) return null;
  const QdN = -sign * diff.dot(normal);
  return QdN < 0 ? null : QdN / DdN;
}

/**
 * three's `Sprite.raycast`: the sprite's camera-facing quad, as the raycaster's camera sees it
 * @param object - The sprite
 * @param center - The sprite's anchor, 0.5 for its middle
 * @param rotation - Its material's rotation in the screen plane, in radians
 * @param raycaster - The raycaster
 * @param intersects - List the hit is added to
 * @internal
 */
export function raycastSprite(
  object: Container3D,
  center: Vector2,
  rotation: number,
  raycaster: Raycaster,
  intersects: Intersection[],
): void {
  const camera = raycaster.camera as (Camera3D & { matrixWorld: PixiMatrix4; matrixWorldInverse: PixiMatrix4 }) | null;
  if (!camera) return;
  const world = object.matrixWorld as PixiMatrix4;
  const e = world.elements;
  worldScale.set(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
  viewPosition.set(e[12], e[13], e[14]).applyMatrix4(camera.matrixWorldInverse);
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);
  const cameraWorld = camera.matrixWorld;
  const place = (out: Vector3, x: number, y: number): Vector3 => {
    const ax = (x - center.x + 0.5) * worldScale.x;
    const ay = (y - center.y + 0.5) * worldScale.y;
    return out
      .set(viewPosition.x + cos * ax - sin * ay, viewPosition.y + sin * ax + cos * ay, viewPosition.z)
      .applyMatrix4(cameraWorld);
  };

  place(corner[0], -0.5, -0.5);
  place(corner[1], 0.5, -0.5);
  place(corner[2], 0.5, 0.5);
  let t = intersectTriangle(raycaster, corner[0], corner[1], corner[2]);
  if (t === null) {
    place(corner[1], -0.5, 0.5);
    t = intersectTriangle(raycaster, corner[0], corner[2], corner[1]);
    if (t === null) return;
  }
  const hit = new Vector3().copyFrom(raycaster.ray.direction).multiplyScalar(t).add(raycaster.ray.origin);
  const distance = raycaster.ray.origin.distanceTo(hit);
  if (distance < raycaster.near || distance > raycaster.far) return;
  intersects.push({ distance, point: hit, face: null, object });
}

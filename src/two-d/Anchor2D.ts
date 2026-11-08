import { Container3D, Matrix4 } from '@pixi/3d';
import type { Camera3D, View3D } from '@pixi/3d';
import { Container, Point } from 'pixi.js';
import type { ContainerOptions, DestroyOptions, PointData } from 'pixi.js';

import { cameraProjection, cameraWorld, cameraWorldInverse } from '../compat/cameraMatrices';
import { Raycaster } from '../compat/Raycaster';
import type { Intersection } from '../compat/Raycaster';
import { Vector3 } from '../math/Vector3';

/**
 * A 3D object an {@link Anchor2D} follows or is hidden behind: the object, or a ref to it
 * @category types
 * @advanced
 */
export type AnchorTarget = Container3D | { readonly current: Container3D | null };

/**
 * Which point of an {@link Anchor2D}'s bounds sits on its point: `true` for the middle, a fraction of
 * its width and height for both axes, a pair of them, or `false` or `null` for its own origin
 * @category types
 * @advanced
 */
export type AnchorCenter = boolean | number | readonly [number, number] | PointData | null;

/** Every live anchor, in no order; each knows its index, so one is taken out by swapping in the last */
const anchors: Anchor2D[] = [];
const ownAnchors = new WeakMap<Container, Anchor2D>();

const viewProjection = new Matrix4();
const nodeWorld = new Matrix4();
const cameraPosition = new Vector3();
const worldPoint = new Vector3();
const direction = new Vector3();
const screenPoint = new Point();
const occlusion = new Raycaster();
const occlusionHits: Intersection[] = [];
const occluders: Container3D[] = [];

/**
 * The object a target names, or `null` while a ref is empty
 * @param target - An object or a ref
 */
const resolveTarget = (target: AnchorTarget | null): Container3D | null =>
  target === null ? null : target instanceof Container3D ? target : target.current;

/**
 * The topmost ancestor of a 3D node: the scene it is drawn in, when it is in one
 * @param node - The node
 */
const rootOf = (node: Container3D): Container3D => {
  let root = node;
  while (root.parent) root = root.parent;
  return root;
};

/**
 * Whether a node and every ancestor of it are visible
 * @param node - The node
 */
const isShown = (node: Container3D): boolean => {
  for (let at: Container3D | null = node; at; at = at.parent) if (!at.visible) return false;
  return true;
};

/**
 * 2D that follows a 3D object on screen, `<anchor2D>`: labels, health bars, floating score text,
 * particle bursts at a hit point. It is drawn by pixi.js, like drei's `<Html>` is by the DOM.
 *
 * Put it inside a 3D object and it follows that object's origin, or `point` in the object's space.
 * Elsewhere, give it a `target` (an object or a ref), or a `point` in world space. Each frame, before
 * the scene draws, the point is projected with the camera the scene is drawn from, so the 2D moves in
 * the same frame as the 3D. It is drawn in the scene's 3D layer, over the 3D and under 2D at a zIndex
 * of 0 or more, and moves, fades and filters with that layer.
 *
 * Its `x` and `y` are where the point lands, in the screen layer's CSS pixels, and are written every
 * frame; move the 2D with `offset`. It hides itself (`renderable` off) while the point is behind the
 * camera, while the target or an ancestor is hidden, while `hideOffscreen` is on and the point is off
 * the view, and while `occlude` finds a 3D object in front of the point.
 *
 * A 2D element placed directly inside a 3D object is put in an anchor of its own, which follows the
 * object's origin with the defaults below.
 * @example
 * ```tsx
 * <mesh position={[1, 0, 0]}>
 *   <boxGeometry />
 *   <meshStandardMaterial />
 *   <anchor2D point={[0, 0.8, 0]} center={[0.5, 1]} distanceFactor={6}>
 *     <text2D text="Crate" style={{ fill: 'white' }} />
 *   </anchor2D>
 * </mesh>
 * ```
 * @category catalog
 * @standard
 */
export class Anchor2D extends Container {
  /** The 3D object to follow, or a ref to it; `null` follows the 3D object the anchor is inside @default null */
  public target: AnchorTarget | null = null;
  /** The point to follow, in the target's local space, or in world space with no target @default [0, 0, 0] */
  public readonly point: Vector3 = new Vector3();
  /** Moves the 2D from where the point lands, in CSS pixels @default [0, 0] */
  public readonly offset: Point = new Point();
  /**
   * The size the 2D has at a distance of `distanceFactor` from a perspective camera with a vertical
   * field of view of 2 atan(1/2), scaled with distance as drei's `<Html distanceFactor>` is; with an
   * orthographic camera, scaled by its `zoom`. `null` keeps the 2D at its own size. @default null
   */
  public distanceFactor: number | null = null;
  /**
   * Hide the 2D while a 3D object is between the camera and the point: `true` tests every object in
   * the scene, a list tests those objects and their children. It costs a raycast per frame. @default false
   */
  public occlude: boolean | readonly AnchorTarget[] = false;
  /** Draw the anchors nearer the camera over those farther away, through their `zIndex` @default false */
  public sortByDepth: boolean = false;
  /** Hide the 2D while the point is outside the view @default false */
  public hideOffscreen: boolean = false;
  /** How far the point is from the camera, in world units, as of the last frame */
  public depth: number = 0;
  /** The 3D node the anchor was added to by its element, if any @internal */
  public _host: Container3D | null = null;
  /** Its index in the list of live anchors, or -1 once destroyed @internal */
  public _index: number = -1;
  private _center: PointData | null = null;
  private _shown = true;

  /** @param options - pixi's container options */
  constructor(options?: ContainerOptions) {
    super(options);
    this._index = anchors.length;
    anchors.push(this);
  }

  /**
   * Which point of the 2D's bounds sits on the point: `true` for the middle, a pair of fractions of
   * its width and height such as `[0.5, 1]` for the bottom middle, or `false` to leave the 2D's own
   * origin there @default false
   */
  public get center(): AnchorCenter {
    return this._center;
  }

  public set center(value: AnchorCenter) {
    if (value === true) this._center = { x: 0.5, y: 0.5 };
    else if (value === false || value === null) this._center = null;
    else if (typeof value === 'number') this._center = { x: value, y: value };
    else if (Array.isArray(value)) this._center = { x: value[0], y: value[1] };
    else this._center = { x: (value as PointData).x, y: (value as PointData).y };
  }

  /** Whether the 2D was drawn on the last frame: the point was in front of the camera, unhidden and unoccluded */
  public get onScreen(): boolean {
    return this._shown;
  }

  public override destroy(options?: DestroyOptions): void {
    if (this._index !== -1) {
      const last = anchors.pop()!;
      if (last !== this) {
        anchors[this._index] = last;
        last._index = this._index;
      }
      this._index = -1;
    }
    super.destroy(options);
  }

  /**
   * Moves the anchor to where its point lands in a view, and shows or hides it
   * @param node - The 3D node it follows
   * @param camera - The camera the view draws with
   * @param view - The view
   * @internal
   */
  public _place(node: Container3D, camera: Camera3D, view: View3D): void {
    const e = node.getGlobalTransform(nodeWorld, false).elements;
    const { x, y, z } = this.point;
    worldPoint.set(
      e[0] * x + e[4] * y + e[8] * z + e[12],
      e[1] * x + e[5] * y + e[9] * z + e[13],
      e[2] * x + e[6] * y + e[10] * z + e[14],
    );
    const m = viewProjection.elements;
    const cx = m[0] * worldPoint.x + m[4] * worldPoint.y + m[8] * worldPoint.z + m[12];
    const cy = m[1] * worldPoint.x + m[5] * worldPoint.y + m[9] * worldPoint.z + m[13];
    const cz = m[2] * worldPoint.x + m[6] * worldPoint.y + m[10] * worldPoint.z + m[14];
    const cw = m[3] * worldPoint.x + m[7] * worldPoint.y + m[11] * worldPoint.z + m[15];
    const depth = worldPoint.distanceTo(cameraPosition);
    this.depth = depth;

    const nx = cx / cw;
    const ny = cy / cw;
    const nz = cz / cw;
    let shown = cw > 1e-6 && nz >= -1 && nz <= 1 && isShown(node);
    if (shown && this.hideOffscreen) shown = nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1;
    if (shown && this.occlude !== false) shown = !this._isOccluded(node, depth);
    this._shown = shown;
    this.renderable = shown;
    if (!shown) return;

    screenPoint.set(
      view.x + ((nx + 1) / 2) * view.width + this.offset.x,
      view.y + ((1 - ny) / 2) * view.height + this.offset.y,
    );
    const parent = this.parent;
    if (parent && parent !== view.parent) {
      view.parent?.worldTransform.apply(screenPoint, screenPoint);
      parent.worldTransform.applyInverse(screenPoint, screenPoint);
    }
    this.position.copyFrom(screenPoint);

    if (this.distanceFactor !== null) {
      const scale =
        camera.mode === 'orthographic'
          ? camera.zoom * this.distanceFactor
          : this.distanceFactor / (2 * Math.tan((camera.fov * Math.PI) / 360) * Math.max(depth, 1e-6));
      this.scale.set(scale);
    }
    if (this._center) {
      const bounds = this.getLocalBounds();
      this.pivot.set(bounds.minX + bounds.width * this._center.x, bounds.minY + bounds.height * this._center.y);
    }
    if (this.sortByDepth) this.zIndex = -depth;
  }

  /**
   * Whether a 3D object lies between the camera and the point
   * @param node - The node the anchor follows
   * @param depth - How far the point is from the camera
   */
  private _isOccluded(node: Container3D, depth: number): boolean {
    direction.copyFrom(worldPoint).subtract(cameraPosition).normalize();
    occlusion.set(cameraPosition, direction);
    occlusion.far = depth * (1 - 1e-4);
    occluders.length = 0;
    if (this.occlude === true) occluders.push(rootOf(node));
    else if (this.occlude !== false) {
      for (let i = 0; i < this.occlude.length; i++) {
        const object = resolveTarget(this.occlude[i]);
        if (object) occluders.push(object);
      }
    }
    occlusionHits.length = 0;
    occlusion.intersectObjects(occluders, true, occlusionHits);
    const occluded = occlusionHits.length > 0;
    occlusionHits.length = 0;
    occluders.length = 0;
    return occluded;
  }
}

/**
 * Puts a 2D object that was placed directly inside a 3D object in an anchor of its own, which follows
 * that object's origin
 * @param node - The 3D object
 * @param child - The 2D object
 * @internal
 */
export function adoptIntoAnchor(node: Container3D, child: Container): void {
  let anchor = ownAnchors.get(child);
  if (anchor?._host === node) return;
  anchor ??= new Anchor2D({ label: 'anchor' });
  ownAnchors.set(child, anchor);
  anchor._host = node;
  anchor.addChild(child);
}

/**
 * Takes a 2D object out of the anchor {@link adoptIntoAnchor} gave it, and frees the anchor
 * @param node - The 3D object it was inside
 * @param child - The 2D object
 * @returns Whether the object had an anchor
 * @internal
 */
export function releaseAnchor(node: Container3D, child: Container): boolean {
  const anchor = ownAnchors.get(child);
  if (!anchor || anchor._host !== node) return false;
  ownAnchors.delete(child);
  if (child.parent === anchor) anchor.removeChild(child);
  anchor.parent?.removeChild(anchor);
  anchor.destroy();
  return true;
}

/**
 * The 3D node an anchor follows: its `target`, else the 3D node its element is inside
 * @param anchor - The anchor
 */
const nodeOf = (anchor: Anchor2D): Container3D | null => resolveTarget(anchor.target) ?? anchor._host;

/**
 * Whether any anchor follows a 3D node in a scene
 * @param scene - The scene
 * @internal
 */
export function hasAnchorsIn(scene: Container3D): boolean {
  for (let i = 0; i < anchors.length; i++) {
    const node = nodeOf(anchors[i]);
    if (node && rootOf(node) === scene) return true;
  }
  return false;
}

/**
 * Places every anchor that follows a node of a scene where its point lands in the scene's view, for the
 * frame about to be drawn, and takes anchors whose node has left the scene off its 3D layer. An anchor
 * with no parent goes into the layer.
 * @param scene - The scene about to be drawn
 * @param camera - The camera it is drawn from
 * @param view - The view drawing it
 * @param layer - The scene's 3D layer
 * @internal
 */
export function placeAnchors(scene: Container3D, camera: Camera3D, view: View3D, layer: Container): void {
  let ready = false;
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const node = nodeOf(anchor);
    if (!node || rootOf(node) !== scene) {
      if (anchor.parent === layer) layer.removeChild(anchor);
      continue;
    }
    if (!ready) {
      ready = true;
      viewProjection.multiplyMatrices(cameraProjection(camera), cameraWorldInverse(camera));
      const world = cameraWorld(camera).elements;
      cameraPosition.set(world[12], world[13], world[14]);
    }
    if (!anchor.parent) layer.addChild(anchor);
    anchor._place(node, camera, view);
  }
}

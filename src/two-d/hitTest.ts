import { View3D } from '@pixi/3d';
import { EventBoundary, Point } from 'pixi.js';
import type { Container, PointData } from 'pixi.js';

import { castCount, layerSlotOf, setLayerSlot } from '../compat/Raycaster';
import type { Intersection, LayerSlot, Raycaster } from '../compat/Raycaster';
import { Vector3 } from '../math/Vector3';
import { getRootState } from '../r3f/src/core/utils';
import type { DomEvent } from '../types/events';
import type { RootState } from '../types/state';
import { layerOf, sceneOfScreen } from './screen';
import type { Linked } from './screen';
import type { Intersection2D } from './types';

/**
 * pixi's `EventBoundary`, for its hit test: `hitPruneFn` leaves out a subtree whose `hitArea` or mask
 * misses the point, and `hitTestFn` tests a container's own `hitArea` or `containsPoint`
 */
class ScreenBoundary extends EventBoundary {
  /**
   * Whether a container's `hitArea` or mask leaves the point out, with all its children
   * @param container - The container
   * @param location - The point, in the screen's pixels
   */
  public misses(container: Container, location: Point): boolean {
    return this.hitPruneFn(container, location);
  }

  /**
   * Whether the point is on the container itself
   * @param container - The container
   * @param location - The point, in the screen's pixels
   */
  public hits(container: Container, location: Point): boolean {
    return this.hitTestFn(container, location);
  }
}

/** What is under one point of a screen layer, front to back */
interface ScreenHits {
  /** The raycast count the hits were found at, so a new pointer event finds them again */
  cast: number;
  /**
   * The pointer, in the screen's CSS pixels: every 2D hit's `global`, moved by each pointer event, as
   * r3f's `pointer` is
   */
  readonly location: Point;
  /** Every 2D object under the point that takes events, with its place from the front, 0 first */
  readonly order: Map<Container, number>;
  /** The place of the first object behind the scene's 3D view; anything from here on draws under the 3D */
  behindFrom: number;
  /** The screen layer's 3D layer, whose view marks where the 3D is drawn */
  readonly layer: Container | undefined;
}

/**
 * How far in front of the 3D a 2D hit in front of it sorts: r3f sorts hits by `distance`, and a 3D hit's
 * distance is never negative
 */
const FRONT = -1e9;
/** How far a 2D hit behind the 3D sorts: past any 3D hit */
const BEHIND = 1e15;

let boundary: ScreenBoundary | null = null;
const hitsOf = new WeakMap<Container, ScreenHits>();
const scratch = new Point();

/**
 * Whether a container takes events by itself: it has an r3f handler, or pixi's `eventMode` makes it
 * interactive
 * @param container - The container
 */
const takesEvents = (container: Linked<Container>): boolean =>
  (container.__r3f?.eventCount ?? 0) > 0 || container.isInteractive();

/**
 * Walks a subtree front to back, as pixi's `EventBoundary` does, and records every container that takes
 * events and is under the point. A container is left out with its children when it is hidden, not
 * renderable or measurable (a mask), has `eventMode="none"`, or its `hitArea` or mask misses the point;
 * its children are walked only while `interactiveChildren` is on.
 * @param container - The subtree's root
 * @param hits - Where hits are recorded
 * @param active - Whether a container above takes events, which makes its children take them too
 */
function walk(container: Linked<Container>, hits: ScreenHits, active: boolean): void {
  if (!container.visible || !container.renderable || !container.measurable || container.eventMode === 'none') return;
  if (container instanceof View3D) {
    if (container.parent === hits.layer && hits.behindFrom === Infinity) hits.behindFrom = hits.order.size;
    return;
  }
  if (sceneOfScreen(container)) {
    if (!boundary!.misses(container, hits.location) && boundary!.hits(container, hits.location)) {
      hits.order.set(container, hits.order.size);
    }
    return;
  }
  const takes = active || takesEvents(container);
  if (!takes && !container.interactiveChildren) return;
  if (boundary!.misses(container, hits.location)) return;
  if (container.interactiveChildren) {
    const { children } = container;
    for (let i = children.length - 1; i >= 0; i--) walk(children[i], hits, takes);
  }
  if (takes && boundary!.hits(container, hits.location)) hits.order.set(container, hits.order.size);
}

/**
 * What is under a point of a screen layer, found once per pointer event: the hits are kept until the
 * root's raycaster is set from a camera again, which every pointer event does first. The screen layer
 * of a `<View3D>` inside it counts as one object, which the view's own layer hit tests.
 * @param screen - The screen layer
 * @param x - The point's x, in pixi's global space: the CSS pixels of the canvas, or of the target the
 *   screen layer is drawn into
 * @param y - The point's y
 * @internal
 */
export function screenHits(screen: Container, x: number, y: number): ScreenHits {
  let hits = hitsOf.get(screen);
  const cast = castCount();
  if (hits && hits.cast === cast && hits.location.x === x && hits.location.y === y) return hits;
  if (!hits) {
    hits = { cast, location: new Point(), order: new Map(), behindFrom: Infinity, layer: layerOf(screen) };
    hitsOf.set(screen, hits);
  }
  boundary ??= new ScreenBoundary();
  hits.cast = cast;
  hits.location.set(x, y);
  hits.order.clear();
  hits.behindFrom = Infinity;
  const { children } = screen;
  for (let i = children.length - 1; i >= 0; i--) walk(children[i], hits, false);
  return hits;
}

/**
 * Where a hit sorts in r3f's `distance`: on the root's screen layer, before every 3D hit when it is
 * drawn over the 3D and after them all when it is drawn under it; in a slot, in the slot's first
 * quarter over its layer's 3D, and after its 3D, short of {@link NESTED_OWN_HIT}, under it
 * @param slot - The slot of the screen layer's portal, or `undefined` on the root's
 * @param order - The hit's place from the front
 * @param behind - Whether it is drawn under the 3D
 */
function distanceOf(slot: LayerSlot | undefined, order: number, behind: boolean): number {
  if (!slot) return behind ? BEHIND + order : FRONT + order;
  const along = order / (order + 1);
  return slot.base + slot.span * (behind ? 0.75 + 0.2 * along : 0.25 * along);
}

/**
 * Where in its slot the hit of a `<View3D>`'s own screen layer sorts: after every hit inside the view,
 * so the view's 3D and 2D get an event before the view and the 2D around it, as a child does before
 * its parent
 */
const NESTED_OWN_HIT = 0.975;

/**
 * The `distance` of a nested screen layer's own hit: near the end of the slot its view's hits sort in
 * @param slot - The slot of the screen layer it is on, or `undefined` on the root's
 * @param order - Its place from the front
 * @param behind - Whether it is drawn under the 3D
 */
function nestedDistanceOf(slot: LayerSlot | undefined, order: number, behind: boolean): number {
  const base = distanceOf(slot, order, behind);
  return base + (distanceOf(slot, order + 1, behind) - base) * NESTED_OWN_HIT;
}

/**
 * The pointer of a root in its canvas's CSS pixels, from the normalised `state.pointer` its event layer set
 * @param state - The root's state
 * @param out - Receives the point
 * @internal
 */
export function pointerInPixels(state: RootState, out: PointData): PointData {
  out.x = ((state.pointer.x + 1) / 2) * state.size.width;
  out.y = ((1 - state.pointer.y) / 2) * state.size.height;
  return out;
}

/**
 * The screen layer a 2D object is drawn on, or `undefined` when it isn't on one
 * @param container - The 2D object
 * @internal
 */
export function screenAbove(container: Container): Container | undefined {
  for (let node: Container | null = container; node; node = node.parent) if (sceneOfScreen(node)) return node;
  return undefined;
}

/**
 * Whether a container is another or under it
 * @param node - The container
 * @param ancestor - The one it may be under
 */
const isWithin = (node: Container, ancestor: Container): boolean => {
  for (let at: Container | null = node; at; at = at.parent) if (at === ancestor) return true;
  return false;
};

/**
 * Adds a hit to `intersects` for each object under the pointer in a 2D element's subtree, the element
 * included, for r3f's event layer. Hits sort by draw order: in front of every 3D hit for 2D drawn over
 * the 3D, behind them for 2D drawn under it. A `<View3D>`'s screen layer is hit as the container that
 * holds it, sorted after the hits inside the view.
 * @param container - The 2D element r3f asks
 * @param intersects - r3f's list of hits
 * @internal
 */
export function raycastScreen(container: Container, intersects: Intersection[]): void {
  const screen = screenAbove(container);
  const state = screen && (getRootState(container as never) as RootState | undefined);
  if (!screen || !state) return;
  screen.worldTransform.apply(pointerInPixels(state, scratch), scratch);
  const { x, y } = scratch;
  const hits = screenHits(screen, x, y);
  const global = hits.location;
  const slot = layerSlotOf(state.raycaster as Raycaster);
  for (const [hitObject, order] of hits.order) {
    if (!isWithin(hitObject, container)) continue;
    const nested = sceneOfScreen(hitObject) !== undefined;
    const object = nested ? (hitObject.parent ?? hitObject) : hitObject;
    const behind = order >= hits.behindFrom;
    const hit: Intersection2D = {
      distance: nested ? nestedDistanceOf(slot, order, behind) : distanceOf(slot, order, behind),
      point: new Vector3(x, y, 0),
      face: null,
      object,
      global,
      local: object.toLocal(global),
      getLocalPosition: <P extends PointData = Point>(target: Container, point?: P): P =>
        target.toLocal(global, undefined, point),
    };
    intersects.push(hit as unknown as Intersection);
  }
}

/**
 * The object whose cursor a point of a screen layer shows: the frontmost object there that takes
 * events, or the nearest container above it that has a `cursor`, as pixi picks it
 * @param screen - The screen layer
 * @param x - The point's x, in CSS pixels
 * @param y - The point's y, in CSS pixels
 * @internal
 */
export function cursorSourceAt(screen: Container, x: number, y: number): Container | null {
  const { order } = screenHits(screen, x, y);
  for (const front of order.keys()) {
    if (sceneOfScreen(front)) {
      const nested = cursorSourceAt(front, x, y);
      if (nested) return nested;
    }
    for (let node: Container | null = front; node && node !== screen; node = node.parent) {
      if (node.cursor) return node;
    }
    return null;
  }
  return null;
}

/**
 * Points a `<View3D>`'s portal at the pointer, as r3f's `events.compute`: the pointer in the layer the
 * view is drawn in is found in the view's own space, and its portal's raycaster is set from its camera
 * there and given the slot the view has in that layer's draw order, so its hits sort where it is drawn.
 * Away from the view, or where a mask or `hitArea` above it leaves the point out, the portal's
 * raycaster isn't set, and r3f skips its objects.
 * @param event - The DOM event
 * @param state - The portal's state
 * @param screen - The view's screen layer, drawn inside the parent layer's 2D
 * @param width - The view's width, in its own pixels
 * @param height - The view's height
 * @param previous - The state of the layer the view is drawn in
 * @internal
 */
export function computeEmbedded(
  event: DomEvent,
  state: RootState,
  screen: Container,
  width: number,
  height: number,
  previous: RootState | undefined,
): void {
  const parentScreen = screen.parent && screenAbove(screen.parent);
  if (!previous || !parentScreen) return;
  if (previous.raycaster.camera === undefined) {
    previous.events.compute?.(event, previous, previous.previousRoot?.getState());
  }
  parentScreen.worldTransform.apply(pointerInPixels(previous, scratch), scratch);
  const hits = screenHits(parentScreen, scratch.x, scratch.y);
  const order = hits.order.get(screen);
  if (order === undefined) return;
  screen.worldTransform.applyInverse(scratch, scratch);
  state.pointer.set((scratch.x / width) * 2 - 1, 1 - (scratch.y / height) * 2);
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const parentSlot = layerSlotOf(previous.raycaster as Raycaster);
  const behind = order >= hits.behindFrom;
  const base = distanceOf(parentSlot, order, behind);
  setLayerSlot(state.raycaster as Raycaster, base, distanceOf(parentSlot, order + 1, behind) - base);
}

/**
 * Gives a portal drawn into a texture on a 3D object the slot of the object's hit, just in front of
 * it, so the hits of the 2D in the texture sort where the object is
 * @param raycaster - The portal's raycaster
 * @param distance - The object's hit distance
 * @internal
 */
export function slotAtHit(raycaster: Raycaster, distance: number): void {
  const span = Math.max(distance * 1e-6, 1e-9);
  setLayerSlot(raycaster, distance - span, span);
}

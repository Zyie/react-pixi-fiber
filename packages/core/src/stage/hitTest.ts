import { View3D } from '@pixi/3d';
import { EventBoundary, Point } from 'pixi.js';
import type { Container, PointData } from 'pixi.js';

import { OVER_3D, UNDER_3D, drawOrder, layerOrderOf, setHitOrder, setLayerOrder } from '../events/hitOrder';
import { classesOf } from '../support/classes';
import type { DomEvent } from '../types/events';
import type { RootState } from '../types/state';
import type { Intersection2D } from '../types/twoD';
import { layerOf, sceneOfScreen } from './screen';
import type { Linked } from './screen';

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

let boundary: ScreenBoundary | null = null;
let casts = 0;
const hitsOf = new WeakMap<Container, ScreenHits>();
const scratch = new Point();

/**
 * Counts a raycast, which a raycaster calls each time it is set: a screen layer's hit test keeps what it
 * found until the root's raycaster is set again, which every pointer event does first
 * @category renderer
 * @advanced
 */
export function noteCast(): void {
  casts++;
}

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
  const cast = casts;
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
 * The draw order of the object at a place of a screen layer: the layer's own, then over or under its 3D
 * @param layer - The draw order of the screen layer's portal, from its raycaster
 * @param hits - What is under the point
 * @param order - The object's place from the front
 */
const orderOnScreen = (layer: readonly number[], hits: ScreenHits, order: number): readonly number[] =>
  drawOrder(layer, order >= hits.behindFrom ? UNDER_3D : OVER_3D, order);

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
 * The hits of r3f's event layer on a 2D element: one for each object under the pointer in its subtree,
 * the element included. Each sorts where it is drawn (`compareHits` in `src/events/hitOrder.ts`): over
 * the 3D, in front of every 3D hit, or under it, behind them. A `<View3D>`'s screen layer is hit as the
 * container that holds it, after the hits inside the view.
 * @param container - The 2D element r3f asks
 * @param state - The state of its root or portal
 * @category renderer
 * @advanced
 */
export function hitTestScreen(container: Container, state: RootState): Intersection2D[] {
  const screen = screenAbove(container);
  if (!screen) return [];
  screen.worldTransform.apply(pointerInPixels(state, scratch), scratch);
  const { x, y } = scratch;
  const hits = screenHits(screen, x, y);
  const global = hits.location;
  const layer = layerOrderOf(state.raycaster);
  const found: Intersection2D[] = [];
  const { Vector3 } = classesOf(state);
  for (const [hitObject, order] of hits.order) {
    if (!isWithin(hitObject, container)) continue;
    const object = sceneOfScreen(hitObject) ? (hitObject.parent ?? hitObject) : hitObject;
    const hit: Intersection2D = {
      distance: 0,
      point: new Vector3(x, y, 0),
      object,
      global,
      local: object.toLocal(global),
      getLocalPosition: <P extends PointData = Point>(target: Container, point?: P): P =>
        target.toLocal(global, undefined, point),
    };
    setHitOrder(hit, orderOnScreen(layer, hits, order));
    found.push(hit);
  }
  return found;
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
 * there and given the view's draw order in that layer, so its hits sort where it is drawn.
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
  setLayerOrder(state.raycaster, orderOnScreen(layerOrderOf(previous.raycaster), hits, order));
}

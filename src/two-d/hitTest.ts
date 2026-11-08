import { View3D } from '@pixi/3d';
import { EventBoundary, Point } from 'pixi.js';
import type { Container, PointData } from 'pixi.js';

import { castCount } from '../compat/Raycaster';
import type { Intersection } from '../compat/Raycaster';
import { Vector3 } from '../math/Vector3';
import { getRootState } from '../r3f/src/core/utils';
import type { RootState } from '../types/state';
import { sceneOfScreen } from './screen';
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
 * root's raycaster is set from a camera again, which every pointer event does first
 * @param screen - The screen layer
 * @param x - The point's x, in CSS pixels from the canvas's left
 * @param y - The point's y, in CSS pixels from the canvas's top
 * @internal
 */
export function screenHits(screen: Container, x: number, y: number): ScreenHits {
  let hits = hitsOf.get(screen);
  const cast = castCount();
  if (hits && hits.cast === cast && hits.location.x === x && hits.location.y === y) return hits;
  if (!hits) hitsOf.set(screen, (hits = { cast, location: new Point(), order: new Map(), behindFrom: Infinity }));
  boundary ??= new ScreenBoundary();
  hits.cast = cast;
  hits.location.set(x, y);
  hits.order.clear();
  hits.behindFrom = Infinity;
  const { children } = screen;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child instanceof View3D) hits.behindFrom = hits.order.size;
    else walk(child, hits, false);
  }
  return hits;
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
 * the 3D, behind them for 2D drawn under it.
 * @param container - The 2D element r3f asks
 * @param intersects - r3f's list of hits
 * @internal
 */
export function raycastScreen(container: Container, intersects: Intersection[]): void {
  const screen = screenAbove(container);
  const state = screen && (getRootState(container as never) as RootState | undefined);
  if (!screen || !state) return;
  const { x, y } = pointerInPixels(state, scratch);
  const hits = screenHits(screen, x, y);
  const global = hits.location;
  for (const [object, order] of hits.order) {
    if (!isWithin(object, container)) continue;
    const hit: Intersection2D = {
      distance: order < hits.behindFrom ? FRONT + order : BEHIND + order,
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
 * The cursor for a point of a screen layer: the `cursor` of the frontmost object there that takes
 * events, or of the nearest container above it that has one, as pixi picks it
 * @param screen - The screen layer
 * @param x - The point's x, in CSS pixels
 * @param y - The point's y, in CSS pixels
 * @internal
 */
export function cursorAt(screen: Container, x: number, y: number): string | null {
  const { order } = screenHits(screen, x, y);
  for (const front of order.keys()) {
    for (let node: Container | null = front; node && node !== screen; node = node.parent) {
      if (node.cursor) return node.cursor;
    }
    return null;
  }
  return null;
}

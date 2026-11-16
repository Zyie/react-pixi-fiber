import { Container3D } from '@pixi/3d';
import { createPointerEvents as coreEvents } from '@react-fiber/r3f/src/core/events';
import { Point } from 'pixi.js';

import { showCursorOf } from '../stage/cursor';
import type { CursorSource } from '../stage/cursor';
import { cursorSourceAt, frontIsOver3D } from '../stage/hitTest';
import { layerOf, screenOf } from '../stage/screen';
import { pixiHooks } from '../support/hooks';
import type { SceneHit } from '../support/hooks';
import type { DomEvent, EventManager } from '../types/events';
import type { RootState, RootStore } from '../types/state';
import { compareHits } from './hitOrder';

const layerPoint = new Point();
const rayPointer = new Point();

/**
 * The frontmost hit under the pointer on a 3D node that takes events, one with handlers or under one, or
 * `null` when there is none. It casts only while a node that takes events, or one above it, has a
 * `cursor`, since r3f's own pointer move casts only at nodes with hover handlers.
 * @param state - The root's state, its raycaster set from the event
 * @param event - The pointer event
 */
function front3D(state: RootState, event: DomEvent): SceneHit | null {
  const nodes = state.internal.interaction as readonly object[];
  if (!nodes.some((object) => object instanceof Container3D && cursorHolder(object))) return null;
  let front: SceneHit | null = null;
  for (const object of nodes) {
    if (!(object instanceof Container3D)) continue;
    for (const hit of pixiHooks.hitTest(object, event, state)) if (!front || compareHits(hit, front) < 0) front = hit;
  }
  return front;
}

/**
 * The node whose `cursor` a 3D node under the pointer shows: it, or the nearest node above it with one
 * @param node - The node
 */
function cursorHolder(node: Container3D): Container3D | null {
  for (let at: unknown = node; at instanceof Container3D; at = at.parent) if (at.cursor) return at;
  return null;
}

/**
 * r3f's pointer event layer, with `onDoubleClick` delivered and the canvas's cursor following the 2D
 *
 * r3f v10 keeps what a pointerdown hit per `pointerId` and fires a click-type handler only on an object
 * the matching pointerdown hit. Chrome's `dblclick` is a plain `MouseEvent` with no `pointerId`, so r3f
 * looks for pointer 0, which no pointerdown filled, and `onDoubleClick` never fires, on three.js too.
 * This layer gives a `dblclick` the `pointerId` of the last pointerdown before r3f handles it.
 *
 * On a pointer move it sets the canvas's cursor to the `cursor` of the frontmost element under the
 * pointer that takes events, as pixi does: a 2D element, or a 3D node with handlers, or the nearest node
 * above either with a `cursor`. It clears it when there is none, when the pointer leaves, or when that
 * element is taken out of the tree.
 *
 * While the scene's 3D layer is moved, scaled or turned (`<Layer3D>`), the ray is cast through the
 * point of the 3D under the pointer, so the 3D picks where it is drawn; `pointer` stays the canvas's.
 * @param store - The root's store
 * @internal
 */
export function createPointerEvents(store: RootStore): EventManager<HTMLElement> {
  const manager = (coreEvents as unknown as (store: RootStore) => EventManager<HTMLElement>)(store);
  const handlers = manager.handlers!;
  const coreCompute = manager.compute!;
  manager.compute = (event, state, previous) => {
    coreCompute(event, state, previous);
    const screen = screenOf(state.scene);
    const layer = screen && layerOf(screen);
    if (!layer || layer.worldTransform.isIdentity()) return;
    layerPoint.set((event as PointerEvent).offsetX, (event as PointerEvent).offsetY);
    layer.worldTransform.applyInverse(layerPoint, layerPoint);
    rayPointer.set((layerPoint.x / state.size.width) * 2 - 1, 1 - (layerPoint.y / state.size.height) * 2);
    state.raycaster.setFromCamera(rayPointer, state.camera);
  };
  const { onPointerDown, onDoubleClick, onPointerMove, onPointerLeave } = handlers;
  let lastPointerId = 0;
  let cursorSet = false;

  const setCursor = (state: RootState, source: CursorSource | null): void => {
    const canvas = state.renderer.domElement;
    if (!('style' in canvas) || (!source && !cursorSet)) return;
    canvas.style.cursor = source?.cursor ?? '';
    cursorSet = source !== null;
    showCursorOf(clearCursor, source);
  };
  const clearCursor = (): void => setCursor(store.getState(), null);

  handlers.onPointerDown = (event) => {
    lastPointerId = (event as PointerEvent).pointerId;
    onPointerDown(event);
  };
  handlers.onDoubleClick = (event) => {
    if (!('pointerId' in (event as DomEvent))) Object.defineProperty(event, 'pointerId', { value: lastPointerId });
    onDoubleClick(event);
  };
  handlers.onPointerMove = (event) => {
    onPointerMove(event);
    const state = store.getState();
    const screen = screenOf(state.scene);
    if (!screen || !state.events.enabled) return;
    const { offsetX, offsetY } = event as PointerEvent;
    const hit = front3D(state, event as DomEvent);
    setCursor(
      state,
      hit && !frontIsOver3D(screen, offsetX, offsetY)
        ? cursorHolder(hit.object as Container3D)
        : cursorSourceAt(screen, offsetX, offsetY),
    );
  };
  handlers.onPointerLeave = (event) => {
    onPointerLeave(event);
    clearCursor();
  };

  return manager;
}

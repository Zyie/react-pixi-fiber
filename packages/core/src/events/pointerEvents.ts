import { Point } from 'pixi.js';
import type { Container } from 'pixi.js';

import { Vector2 } from '../math/Vector2';
import { createPointerEvents as coreEvents } from '../r3f/src/core/events';
import { showCursorOf } from '../two-d/cursor';
import { cursorSourceAt } from '../two-d/hitTest';
import { layerOf, screenOf } from '../two-d/screen';
import type { DomEvent, EventManager } from '../types/events';
import type { RootState, RootStore } from '../types/state';

const layerPoint = new Point();
const rayPointer = new Vector2();

/**
 * r3f's pointer event layer, with `onDoubleClick` delivered and the canvas's cursor following the 2D
 *
 * r3f v10 keeps what a pointerdown hit per `pointerId` and fires a click-type handler only on an object
 * the matching pointerdown hit. Chrome's `dblclick` is a plain `MouseEvent` with no `pointerId`, so r3f
 * looks for pointer 0, which no pointerdown filled, and `onDoubleClick` never fires, on three.js too.
 * This layer gives a `dblclick` the `pointerId` of the last pointerdown before r3f handles it.
 *
 * On a pointer move it sets the canvas's cursor to the `cursor` of the 2D element under the pointer
 * that takes events, as pixi does, and clears it when there is none, when the pointer leaves, or when
 * that element is taken out of the tree.
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

  const setCursor = (state: RootState, source: Container | null): void => {
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
    setCursor(state, cursorSourceAt(screen, (event as PointerEvent).offsetX, (event as PointerEvent).offsetY));
  };
  handlers.onPointerLeave = (event) => {
    onPointerLeave(event);
    clearCursor();
  };

  return manager;
}

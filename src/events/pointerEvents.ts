import { createPointerEvents as coreEvents } from '../r3f/src/core/events';
import { cursorAt } from '../two-d/hitTest';
import { screenOf } from '../two-d/screen';
import type { DomEvent, EventManager } from '../types/events';
import type { RootState, RootStore } from '../types/state';

/**
 * r3f's pointer event layer, with `onDoubleClick` delivered and the canvas's cursor following the 2D
 *
 * r3f v10 keeps what a pointerdown hit per `pointerId` and fires a click-type handler only on an object
 * the matching pointerdown hit. Chrome's `dblclick` is a plain `MouseEvent` with no `pointerId`, so r3f
 * looks for pointer 0, which no pointerdown filled, and `onDoubleClick` never fires, on three.js too.
 * This layer gives a `dblclick` the `pointerId` of the last pointerdown before r3f handles it.
 *
 * On a pointer move it sets the canvas's cursor to the `cursor` of the 2D element under the pointer
 * that takes events, as pixi does, and clears it when there is none or the pointer leaves.
 * @param store - The root's store
 * @internal
 */
export function createPointerEvents(store: RootStore): EventManager<HTMLElement> {
  const manager = (coreEvents as unknown as (store: RootStore) => EventManager<HTMLElement>)(store);
  const handlers = manager.handlers!;
  const { onPointerDown, onDoubleClick, onPointerMove, onPointerLeave } = handlers;
  let lastPointerId = 0;
  let cursorSet = false;

  const setCursor = (state: RootState, cursor: string | null): void => {
    const canvas = state.renderer.domElement;
    if (!('style' in canvas) || (!cursor && !cursorSet)) return;
    canvas.style.cursor = cursor ?? '';
    cursorSet = cursor !== null;
  };

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
    setCursor(state, cursorAt(screen, (event as PointerEvent).offsetX, (event as PointerEvent).offsetY));
  };
  handlers.onPointerLeave = (event) => {
    onPointerLeave(event);
    setCursor(store.getState(), null);
  };

  return manager;
}

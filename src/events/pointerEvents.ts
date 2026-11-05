import { createPointerEvents as coreEvents } from '../r3f/src/core/events';
import type { DomEvent, EventManager } from '../types/events';
import type { RootStore } from '../types/state';

/**
 * r3f's pointer event layer, with `onDoubleClick` delivered
 *
 * r3f v10 keeps what a pointerdown hit per `pointerId` and fires a click-type handler only on an object
 * the matching pointerdown hit. Chrome's `dblclick` is a plain `MouseEvent` with no `pointerId`, so r3f
 * looks for pointer 0, which no pointerdown filled, and `onDoubleClick` never fires, on three.js too.
 * This layer gives a `dblclick` the `pointerId` of the last pointerdown before r3f handles it.
 * @param store - The root's store
 * @internal
 */
export function createPointerEvents(store: RootStore): EventManager<HTMLElement> {
  const manager = (coreEvents as unknown as (store: RootStore) => EventManager<HTMLElement>)(store);
  const handlers = manager.handlers!;
  const { onPointerDown, onDoubleClick } = handlers;
  let lastPointerId = 0;

  handlers.onPointerDown = (event) => {
    lastPointerId = (event as PointerEvent).pointerId;
    onPointerDown(event);
  };
  handlers.onDoubleClick = (event) => {
    if (!('pointerId' in (event as DomEvent))) Object.defineProperty(event, 'pointerId', { value: lastPointerId });
    onDoubleClick(event);
  };

  return manager;
}

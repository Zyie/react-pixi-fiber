/**
 * An event three's `EventDispatcher` sends: its `type`, any fields the sender adds, and `target`,
 * set to the dispatcher while the listeners run
 * @category catalog
 * @advanced
 */
export interface DispatchedEvent<TType extends string = string> {
  /** The event's name, such as `'change'` or `'dispose'` */
  type: TType;
  /** The dispatcher, while its listeners run */
  target?: unknown;
  /** Fields the sender adds */
  [field: string]: unknown;
}

/**
 * A listener of an {@link EventDispatcher}
 * @category catalog
 * @advanced
 */
export type EventListener<TEvent extends DispatchedEvent = DispatchedEvent> = (event: TEvent) => void;

/**
 * three's `EventDispatcher`: named events for plain objects, as render targets and controls send them
 *
 * The same as three's: a listener is added once per type, `dispatchEvent` sets the event's `target`
 * while the listeners run and calls a copy of the list, so a listener can remove itself.
 * @example
 * ```ts
 * controls.addEventListener('change', () => invalidate());
 * ```
 * @category catalog
 * @advanced
 */
export class EventDispatcher {
  private _listeners?: Record<string, EventListener[]>;

  /**
   * Calls `listener` whenever an event of this type is dispatched
   * @param type - The event's name
   * @param listener - What to call
   */
  public addEventListener(type: string, listener: EventListener): void {
    this._listeners ??= {};
    const listeners = (this._listeners[type] ??= []);
    if (!listeners.includes(listener)) listeners.push(listener);
  }

  /**
   * Whether `listener` is listening for this type
   * @param type - The event's name
   * @param listener - The listener
   */
  public hasEventListener(type: string, listener: EventListener): boolean {
    return this._listeners?.[type]?.includes(listener) ?? false;
  }

  /**
   * Stops calling `listener` for this type
   * @param type - The event's name
   * @param listener - The listener
   */
  public removeEventListener(type: string, listener: EventListener): void {
    const listeners = this._listeners?.[type];
    const index = listeners?.indexOf(listener) ?? -1;
    if (index !== -1) listeners!.splice(index, 1);
  }

  /**
   * Calls the listeners of the event's type with it
   * @param event - The event, with its `type`
   */
  public dispatchEvent(event: DispatchedEvent): void {
    const listeners = this._listeners?.[event.type];
    if (!listeners) return;
    event.target = this;
    for (const listener of listeners.slice()) listener.call(this, event);
    event.target = null;
  }
}

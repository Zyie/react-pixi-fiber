/**
 * An event three's `EventDispatcher` sends: a `type`, the dispatcher as `target` while listeners
 * run, and whatever else the sender puts on it
 * @category catalog
 * @advanced
 */
export interface DispatchedEvent<TType extends string = string> {
  /** The event's name, such as `'finished'` or `'dispose'` */
  type: TType;
  /** The dispatcher, while the event's listeners run */
  target?: unknown;
  /** Anything else the sender puts on the event, such as a mixer's `action` */
  [key: string]: unknown;
}

/**
 * A listener three's `EventDispatcher` calls with the event, and with the dispatcher as `this`
 * @category catalog
 * @advanced
 */
export type EventListener<E extends DispatchedEvent = DispatchedEvent> = (event: E) => void;

/**
 * three's `EventDispatcher`: named events with listeners, the base of `AnimationMixer`, the render
 * targets and the controls
 *
 * It is three's own class, not pixi's `EventEmitter`: listeners are added with
 * `addEventListener(type, listener)` and get the event object, whose `target` is the dispatcher.
 * @example
 * ```ts
 * mixer.addEventListener('finished', (event) => console.log(event.action));
 * ```
 * @category catalog
 * @advanced
 */
export class EventDispatcher {
  private _listeners?: Record<string, EventListener[]>;

  /**
   * Calls a listener each time an event of a type is dispatched; adding it twice adds it once
   * @param type - The event's name
   * @param listener - The function to call
   */
  public addEventListener(type: string, listener: EventListener): void {
    this._listeners ??= {};
    const listeners = (this._listeners[type] ??= []);

    if (!listeners.includes(listener)) listeners.push(listener);
  }

  /**
   * Whether a listener is added for a type
   * @param type - The event's name
   * @param listener - The function
   */
  public hasEventListener(type: string, listener: EventListener): boolean {
    return this._listeners?.[type]?.includes(listener) ?? false;
  }

  /**
   * Stops calling a listener for a type
   * @param type - The event's name
   * @param listener - The function to stop calling
   */
  public removeEventListener(type: string, listener: EventListener): void {
    const listeners = this._listeners?.[type];
    const index = listeners?.indexOf(listener) ?? -1;

    if (index !== -1) listeners!.splice(index, 1);
  }

  /**
   * Calls every listener of the event's type, with the dispatcher as the event's `target`
   * @param event - The event, with its `type`
   */
  public dispatchEvent(event: DispatchedEvent): void {
    const listeners = this._listeners?.[event.type];

    if (!listeners?.length) return;

    event.target = this;
    for (const listener of listeners.slice()) listener.call(this, event);
    event.target = null;
  }
}

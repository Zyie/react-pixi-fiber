import { EventDispatcher } from './EventDispatcher';

/**
 * The element controls listen on: the canvas, usually `renderer.domElement`. An `OffscreenCanvas`
 * has no pointer events, so controls given one don't listen.
 * @category catalog
 * @advanced
 */
export type ControlsElement = HTMLElement | OffscreenCanvas;

/**
 * three's `Controls`: the base of camera controls such as `OrbitControls`, an object they move in
 * answer to input on an element
 *
 * The same as three's: `connect` starts listening on an element, `disconnect` stops, `update` runs
 * once a frame for controls that move on their own, and `dispose` lets go of everything.
 * @example
 * ```ts
 * class SpinControls extends Controls<Camera3D> {
 *   public override update(delta: number): void {
 *     this.object.rotation.y += delta;
 *   }
 * }
 * ```
 * @category catalog
 * @advanced
 */
export class Controls<TObject = unknown> extends EventDispatcher {
  /** The object the controls move */
  public object: TObject;
  /** The element they listen on, or `null` before `connect` */
  public domElement: ControlsElement | null;
  /** When `false`, input is ignored @default true */
  public enabled = true;
  /** What the controls are doing, `-1` for nothing */
  public state: number = -1;
  /** The keys the controls answer to */
  public keys: Record<string, string> = {};
  /** What each mouse button does, three's `MOUSE` values */
  public mouseButtons: { LEFT: number | null; MIDDLE: number | null; RIGHT: number | null } = {
    LEFT: null,
    MIDDLE: null,
    RIGHT: null,
  };
  /** What one and two fingers do, three's `TOUCH` values */
  public touches: { ONE: number | null; TWO: number | null } = { ONE: null, TWO: null };

  /**
   * @param object - The object to move
   * @param domElement - The element to listen on
   */
  constructor(object: TObject, domElement: ControlsElement | null = null) {
    super();
    this.object = object;
    this.domElement = domElement;
  }

  /**
   * Starts listening on an element, after stopping on the last one
   * @param element - The element
   */
  public connect(element: ControlsElement): void {
    if (this.domElement !== null) this.disconnect();
    this.domElement = element;
  }

  /** Stops listening */
  public disconnect(): void {}

  /** Lets go of the element and everything the controls hold */
  public dispose(): void {}

  /**
   * Moves the object for one frame; controls that move on their own need it every frame
   * @param _delta - Seconds since the last frame
   */
  public update(_delta?: number | null): void {}
}

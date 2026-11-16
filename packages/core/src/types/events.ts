import type { Container3D, Ray } from '@pixi/3d';

import type { Registered, RegisteredInstance } from './register';
import type { RootState } from './state';
import type { Properties } from './utils';

/** A raycaster's hit, as the package that gives the root its raycaster registers it */
type RaycastIntersection = Registered<'Intersection'>;

/**
 * The cameras a root draws from, as three's `PerspectiveCamera | OrthographicCamera`
 * @category types
 * @standard
 */
export type Camera = Registered<'Camera'> & {
  /** When `true`, r3f leaves the projection alone on resize */
  manual?: boolean;
};

/**
 * r3f's name for {@link Camera}
 * @category types
 * @advanced
 */
export type ThreeCamera = Camera;

/**
 * A raycaster hit with the object whose handler is running
 * @category events
 * @standard
 */
export interface Intersection extends RaycastIntersection {
  /** The object that registered the handler */
  eventObject: Container3D;
}

/**
 * What `event.target` and `event.currentTarget` are in a handler: the pointer capture methods. Each
 * takes the native event's `pointerId`; capturing makes the object whose handler is running part of
 * every later hit for that pointer until it is released, and captures the pointer on the element the
 * listeners are on.
 * @example
 * ```tsx
 * <mesh
 *   onPointerDown={(event) => event.target.setPointerCapture(event.pointerId)}
 *   onPointerUp={(event) => event.target.releasePointerCapture(event.pointerId)}
 * />
 * ```
 * @category events
 * @standard
 */
export interface EventCaptureTarget {
  /** Captures the pointer for the object whose handler is running */
  setPointerCapture(pointerId: number): void;
  /** Releases a pointer this object captured */
  releasePointerCapture(pointerId: number): void;
  /** Whether this object holds the pointer */
  hasPointerCapture(pointerId: number): boolean;
}

/**
 * The fields r3f adds to every pointer event it hands a handler
 * @category events
 * @standard
 */
export interface IntersectionEvent<TSourceEvent> extends Intersection {
  /** The object that registered the handler */
  eventObject: Container3D;
  /** Every hit under the pointer, nearest first */
  intersections: Intersection[];
  /** The pointer unprojected onto the camera's near plane */
  unprojectedPoint: RegisteredInstance<'Vector3'>;
  /** Normalised pointer coordinates, -1 to 1 */
  pointer: RegisteredInstance<'Vector2'>;
  /** `pointerId` of the native event */
  pointerId: number;
  /** Distance in pixels between the pointer-down and this event */
  delta: number;
  /** The ray that was cast */
  ray: Ray;
  /** The camera the ray was cast from */
  camera: Camera;
  /** Stops handlers on objects behind this one */
  stopPropagation: () => void;
  /** The native event */
  nativeEvent: TSourceEvent;
  /** Whether `stopPropagation` was called */
  stopped: boolean;
  /**
   * The pointer capture methods, in place of the native event's target. r3f types it as the DOM's
   * `EventTarget`, so r3f code casts it; the cast still compiles here.
   */
  target: EventCaptureTarget;
  /** The same as `target` */
  currentTarget: EventCaptureTarget;
}

/**
 * What a pointer handler receives: the hit, r3f's fields and the native event's fields
 * @example
 * ```tsx
 * <mesh onClick={(event: ThreeEvent<MouseEvent>) => console.log(event.point, event.object)} />
 * ```
 * @category events
 * @standard
 */
export type ThreeEvent<TEvent> = IntersectionEvent<TEvent> & Properties<TEvent>;

/**
 * What a 3D element's pointer handler receives, {@link ThreeEvent} under a name that doesn't say three:
 * r3f's event, with @pixi/3d's hit on it
 * @example
 * ```tsx
 * <mesh3D onClick={(event: FiberEvent<MouseEvent>) => console.log(event.point, event.object)} />
 * ```
 * @category events
 * @standard
 */
export type FiberEvent<TEvent> = ThreeEvent<TEvent>;

/**
 * The DOM events r3f turns into pointer events
 * @category events
 * @standard
 */
export type DomEvent = PointerEvent | MouseEvent | WheelEvent;

/**
 * The DOM listeners r3f registers on the event source
 * @category events
 * @advanced
 */
export interface Events {
  /** Listens for `click` */
  onClick: EventListener;
  /** Listens for `contextmenu` */
  onContextMenu: EventListener;
  /** Listens for `dblclick` */
  onDoubleClick: EventListener;
  /** Listens for `wheel` */
  onWheel: EventListener;
  /** Listens for `pointerdown` */
  onPointerDown: EventListener;
  /** Listens for `pointerup` */
  onPointerUp: EventListener;
  /** Listens for `pointerleave` */
  onPointerLeave: EventListener;
  /** Listens for `pointermove` */
  onPointerMove: EventListener;
  /** Listens for `pointercancel` */
  onPointerCancel: EventListener;
  /** Listens for `lostpointercapture` */
  onLostPointerCapture: EventListener;
  /** Listens for `dragenter` */
  onDragEnter: EventListener;
  /** Listens for `dragleave` */
  onDragLeave: EventListener;
  /** Listens for `dragover` */
  onDragOver: EventListener;
  /** Listens for `drop` */
  onDrop: EventListener;
}

/**
 * Event props every scene element takes
 * @category events
 * @standard
 */
export interface EventHandlers {
  /** Fires on a click on the object, after a pointerdown on it */
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  /** Fires on a right click or long press on the object */
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
  /** Fires on a double click on the object */
  onDoubleClick?: (event: ThreeEvent<MouseEvent>) => void;
  /** Fires continuously while dragging over the object */
  onDragOver?: (event: ThreeEvent<DragEvent>) => void;
  /** Fires once when a drag enters the object */
  onDragOverEnter?: (event: ThreeEvent<DragEvent>) => void;
  /** Fires once when a drag leaves the object */
  onDragOverLeave?: (event: ThreeEvent<DragEvent>) => void;
  /** Fires when a drag misses this object */
  onDragOverMissed?: (event: DragEvent) => void;
  /** Fires when something is dropped on this object */
  onDrop?: (event: ThreeEvent<DragEvent>) => void;
  /** Fires when a drop misses this object */
  onDropMissed?: (event: DragEvent) => void;
  /** Fires when a button is released over the object */
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when a button is pressed over the object */
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the pointer moves onto the object or one of its children */
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the pointer moves off the object or one of its children */
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the pointer moves onto the object; it doesn't bubble */
  onPointerEnter?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the pointer moves off the object; it doesn't bubble */
  onPointerLeave?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the pointer moves over the object */
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires on a click that misses the object */
  onPointerMissed?: (event: MouseEvent) => void;
  /**
   * Typed as in r3f, which never calls it: a pointer the browser cancels ends with `onPointerOut` and
   * `onPointerLeave` on what it hovered
   */
  onPointerCancel?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires on a wheel turn over the object */
  onWheel?: (event: ThreeEvent<WheelEvent>) => void;
  /**
   * Typed as in r3f, which never calls it: when the canvas loses a capture, r3f drops every capture of
   * that pointer on the next frame and ends its hovers with `onPointerOut` and `onPointerLeave`
   */
  onLostPointerCapture?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the object enters or leaves the camera's frustum */
  onFramed?: (inView: boolean) => void;
  /** Never fires: pixi-3d has no occlusion queries */
  onOccluded?: (occluded: boolean) => void;
  /** Fires when the object's combined visibility (frustum and `visible`) changes */
  onVisible?: (visible: boolean) => void;
}

/**
 * An object with visibility handlers, as r3f's frame loop tracks it in `state.internal.visibilityRegistry`
 * @category events
 * @advanced
 */
export interface VisibilityEntry {
  /** The object */
  object: Container3D;
  /** Its visibility handlers */
  handlers: Pick<EventHandlers, 'onFramed' | 'onOccluded' | 'onVisible'>;
  /** Whether it was in the frustum last frame; `null` before the first check */
  lastFramedState: boolean | null;
  /** Whether it was occluded last frame; always `null` on pixi-3d */
  lastOccludedState: boolean | null;
  /** Whether it was visible last frame; `null` before the first check */
  lastVisibleState: boolean | null;
}

/**
 * Reorders or filters the hits before handlers run
 * @category events
 * @advanced
 */
export type FilterFunction = (items: RaycastIntersection[], state: RootState) => RaycastIntersection[];

/**
 * Sets the pointer and raycaster from a DOM event
 * @category events
 * @advanced
 */
export type ComputeFunction = (event: DomEvent, root: RootState, previous?: RootState) => void;

/**
 * An XR controller or hand registered as a pointer
 * @category events
 * @advanced
 */
export interface XRPointerConfig {
  /** Ray origin, updated each frame */
  ray: Ray;
  /** Custom compute for this pointer */
  compute?: (state: RootState) => void;
  /** What kind of pointer it is */
  type: 'controller' | 'hand' | 'gaze';
  /** Which hand */
  handedness?: 'left' | 'right';
}

/**
 * A root's event layer: how DOM events reach scene objects
 * @category events
 * @advanced
 */
export interface EventManager<TTarget> {
  /** Whether the layer handles events */
  enabled: boolean;
  /** Higher priority layers handle events first */
  priority: number;
  /** Sets the pointer and raycaster from a DOM event */
  compute?: ComputeFunction;
  /** Reorders or filters the hits */
  filter?: FilterFunction;
  /** The element the listeners are on */
  connected?: TTarget;
  /** The DOM listeners */
  handlers?: Events;
  /** Moves the listeners to another element */
  connect?: (target: TTarget) => void;
  /** Removes the listeners */
  disconnect?: () => void;
  /** Replays the last pointer move, for objects that moved under a still pointer */
  update?: (pointerId?: number) => void;
  /** Raycast pointer moves at the start of the next frame instead of on the event @default true */
  frameTimedRaycasts?: boolean;
  /** Raycast scroll events at once @default true */
  alwaysFireOnScroll?: boolean;
  /** Raycast every frame to catch objects moving under the pointer @default false */
  updateOnFrame?: boolean;
  /** Runs deferred raycasts; the scheduler calls it at frame start */
  flush?: () => void;
  /** Registers an XR pointer and returns its id */
  registerPointer?: (config: XRPointerConfig) => number;
  /** Removes an XR pointer */
  unregisterPointer?: (pointerId: number) => void;
}

/**
 * The hit and element a pointer is captured by
 * @category events
 * @advanced
 */
export interface PointerCaptureTarget {
  /** The hit that set the capture */
  intersection: Intersection;
  /** The element holding the DOM capture */
  target: Element;
}

import type { Container3D, Ray } from '@pixi/3d';

import type { OrthographicCamera } from '../catalog/OrthographicCamera';
import type { PerspectiveCamera } from '../catalog/PerspectiveCamera';
import type { Intersection as RaycastIntersection } from '../compat/Raycaster';
import type { Vector2 } from '../compat/Vector2';
import type { Vector3 } from '../compat/Vector3';
import type { RootState } from './state';
import type { Properties } from './utils';

/**
 * The cameras a root draws from, as three's `PerspectiveCamera | OrthographicCamera`
 * @category types
 * @standard
 */
export type Camera = (PerspectiveCamera | OrthographicCamera) & {
  /** When `true`, r3f leaves the projection alone on resize */
  manual?: boolean;
};

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
  unprojectedPoint: Vector3;
  /** Normalised pointer coordinates, -1 to 1 */
  pointer: Vector2;
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
  onClick: EventListener;
  onContextMenu: EventListener;
  onDoubleClick: EventListener;
  onWheel: EventListener;
  onPointerDown: EventListener;
  onPointerUp: EventListener;
  onPointerLeave: EventListener;
  onPointerMove: EventListener;
  onPointerCancel: EventListener;
  onLostPointerCapture: EventListener;
  onDragEnter: EventListener;
  onDragLeave: EventListener;
  onDragOver: EventListener;
  onDrop: EventListener;
}

/**
 * Event props every scene element takes
 * @category events
 * @standard
 */
export interface EventHandlers {
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (event: ThreeEvent<MouseEvent>) => void;
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
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerEnter?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerMissed?: (event: MouseEvent) => void;
  onPointerCancel?: (event: ThreeEvent<PointerEvent>) => void;
  onWheel?: (event: ThreeEvent<WheelEvent>) => void;
  onLostPointerCapture?: (event: ThreeEvent<PointerEvent>) => void;
  /** Fires when the object enters or leaves the camera's frustum */
  onFramed?: (inView: boolean) => void;
  /** Never fires: pixi-3d has no occlusion queries */
  onOccluded?: (occluded: boolean) => void;
  /** Fires when the object's combined visibility (frustum and `visible`) changes */
  onVisible?: (visible: boolean) => void;
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

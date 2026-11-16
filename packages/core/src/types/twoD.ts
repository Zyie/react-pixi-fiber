import type {
  AnimatedSprite,
  AnimatedSpriteFrames,
  CacheAsTextureOptions,
  ColorSource,
  Container,
  Filter,
  Graphics,
  GraphicsContext,
  HTMLText,
  HTMLTextStyle,
  HTMLTextStyleOptions,
  Mask,
  MaskOptionsAndMask,
  Particle,
  Point,
  PointData,
  RenderLayer,
  TextString,
  TextStyle,
  TextStyleOptions,
} from 'pixi.js';

import type { IntersectionEvent } from './events';
import type { Registered } from './register';
import type { Properties } from './utils';

/**
 * A hit on a 2D element: r3f's intersection, with the 2D object and the pointer in 2D's spaces
 *
 * 2D hits sort by draw order, not by depth: one drawn over the 3D comes before every 3D hit, and one
 * drawn under the 3D after them all. Its `distance` is 0.
 * @category events
 * @standard
 */
export interface Intersection2D extends Pick<Registered<'Intersection'>, 'distance' | 'point'> {
  /** The 2D object under the pointer */
  object: Container;
  /**
   * The pointer in the canvas's CSS pixels from its top-left corner, pixi's `global`. Like r3f's
   * `pointer`, it is the root's live point, which every pointer event moves, so a captured drag reads
   * where the pointer is now; copy it to keep it.
   */
  global: Point;
  /** The pointer in the local space of `object`, where it was hit */
  local: Point;
  /**
   * The pointer, as `global` has it now, in the local space of any container, such as the
   * `eventObject` whose handler runs; pixi's `getLocalPosition`
   * @param container - The container
   * @param point - Receives the point; a new one when left out
   */
  getLocalPosition<P extends PointData = Point>(container: Container, point?: P): P;
}

/**
 * What a 2D element's pointer handler receives: r3f's event, with the 2D hit's `global`, `local` and
 * `getLocalPosition`, and `object` and `eventObject` as pixi.js containers
 * @example
 * ```tsx
 * <sprite2D texture={texture} onClick={(event: ThreeEvent2D<MouseEvent>) => console.log(event.local)} />
 * ```
 * @category events
 * @standard
 */
export type ThreeEvent2D<TEvent> = Omit<IntersectionEvent<TEvent>, 'object' | 'eventObject'> &
  Intersection2D &
  Omit<Properties<TEvent>, 'target' | 'currentTarget'> & {
    /** The 2D element whose handler runs */
    eventObject: Container;
  };

/**
 * r3f's pointer event props on a 2D element, with r3f's semantics in the same event system as the 3D:
 * a 2D element over the 3D is hit first, and its `stopPropagation` stops the 3D beneath it
 * @category events
 * @standard
 */
export interface EventHandlers2D {
  /** Fires on a click on the element, after a pointerdown on it */
  onClick?: (event: ThreeEvent2D<MouseEvent>) => void;
  /** Fires on a right click or long press on the element */
  onContextMenu?: (event: ThreeEvent2D<MouseEvent>) => void;
  /** Fires on a double click on the element */
  onDoubleClick?: (event: ThreeEvent2D<MouseEvent>) => void;
  /** Fires continuously while dragging over the element */
  onDragOver?: (event: ThreeEvent2D<DragEvent>) => void;
  /** Fires once when a drag enters the element */
  onDragOverEnter?: (event: ThreeEvent2D<DragEvent>) => void;
  /** Fires once when a drag leaves the element */
  onDragOverLeave?: (event: ThreeEvent2D<DragEvent>) => void;
  /** Fires when a drag misses the element */
  onDragOverMissed?: (event: DragEvent) => void;
  /** Fires when something is dropped on the element */
  onDrop?: (event: ThreeEvent2D<DragEvent>) => void;
  /** Fires when a drop misses the element */
  onDropMissed?: (event: DragEvent) => void;
  /** Fires when a button is released over the element */
  onPointerUp?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when a button is pressed over the element */
  onPointerDown?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when the pointer moves onto the element or one of its children */
  onPointerOver?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when the pointer moves off the element or one of its children */
  onPointerOut?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when the pointer moves onto the element; it doesn't bubble */
  onPointerEnter?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when the pointer moves off the element; it doesn't bubble */
  onPointerLeave?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires when the pointer moves over the element */
  onPointerMove?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires on a click that misses the element */
  onPointerMissed?: (event: MouseEvent) => void;
  /** Typed as in r3f, which never calls it */
  onPointerCancel?: (event: ThreeEvent2D<PointerEvent>) => void;
  /** Fires on a wheel turn over the element */
  onWheel?: (event: ThreeEvent2D<WheelEvent>) => void;
  /** Typed as in r3f, which never calls it */
  onLostPointerCapture?: (event: ThreeEvent2D<PointerEvent>) => void;
}

/**
 * The props of every 2D container that take more than its fields: its filters and mask, which
 * elements also attach to, its render layer and its texture cache
 * @category types
 * @advanced
 */
export interface ContainerProps2D {
  /** One filter or a list; `attach="filters-0"` puts a filter element in it */
  filters: Filter | readonly Filter[] | null;
  /**
   * A container or a colour mask, or pixi's mask options as `setMask` takes them
   * (`{ mask, inverse: true }`); options without a `mask` keep the current one, such as an
   * `attach="mask"` child's
   */
  mask: Mask | Partial<MaskOptionsAndMask>;
  /** The render layer that draws this container, or `null` for none: `layer.attach(this)` as a prop */
  parentRenderLayer: RenderLayer | null;
  /** Caches the container and its children as one texture: `cacheAsTexture(value)` as a prop */
  cacheAsTexture: boolean | CacheAsTextureOptions;
}

/**
 * The props of a 2D object whose setter takes more than its getter returns: `tint` any colour pixi's
 * `Color` takes, a container's {@link ContainerProps2D}, text's `text` and `style` what their setters
 * take, and an animated sprite's `textures` and `playing`, which plays or stops it
 * @category types
 * @advanced
 */
export type SetterProps2D<P> = (P extends { tint: number } ? { tint: ColorSource } : {}) &
  (P extends Container ? ContainerProps2D : {}) &
  (P extends { text: string; style: object }
    ? {
        text: TextString;
        style: P extends HTMLText ? HTMLTextStyle | HTMLTextStyleOptions : TextStyle | TextStyleOptions;
      }
    : {}) &
  (P extends AnimatedSprite ? { textures: AnimatedSpriteFrames; playing: boolean } : {});

/**
 * The `draw` prop of a graphics or a graphics context: a callback that draws into it after it is
 * cleared, run on mount and again whenever a new function is passed
 * @category types
 * @advanced
 */
export type DrawProps2D<P> = P extends Graphics | GraphicsContext
  ? {
      /** Draws into the object after clearing it; runs on mount and whenever a new function is passed */
      draw: (target: P) => void;
    }
  : {};

/**
 * Whether an instance is one of pixi.js's 2D objects, whose elements get the 2D props and events
 * @category types
 * @advanced
 */
export type Is2D<P> = P extends Container | Filter | GraphicsContext | Particle ? true : false;

/**
 * Every constructor signature of a class, as a union of argument lists: a 2D element's `args` takes
 * any of pixi's overloads, such as `Text`'s options object
 * @category types
 * @advanced
 */
export type OverloadArgs<T> = T extends {
  new (...args: infer A): unknown;
  new (...args: infer B): unknown;
}
  ? A | B
  : T extends new (...args: infer A) => unknown
    ? A
    : never;

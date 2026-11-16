import type { Container3D } from '@pixi/3d';
import type { Color as PixiColor, ColorSource, Container, Particle } from 'pixi.js';
import type * as React from 'react';

import type { Color as ThreeColor } from '../math/Color';
import type { EulerOrder } from '../math/Euler';
import type { DrawProps2D, EventHandlers2D, Is2D, OverloadArgs, SetterProps2D } from '../two-d/types';
import type { EventHandlers } from './events';
import type { Color } from './math';
import type { RootStore } from './state';
import type { ConstructorRepresentation, IsAllOptional, Mutable, Overwrite } from './utils';

/**
 * Anything with a numeric `set`: pixi-3d's vectors, quaternions and matrices
 * @category types
 * @advanced
 */
export interface MathRepresentation {
  /** Sets the components */
  set(...args: number[]): unknown;
}

/**
 * Anything with three's Euler `set`: angles and an optional axis order, as a node's `rotation`
 * @category types
 * @advanced
 */
export interface EulerRepresentation {
  /** Sets the angles and, optionally, the order */
  set(x?: number, y?: number, z?: number, order?: EulerOrder): unknown;
}

/**
 * Every object a math prop can hold: anything with a numeric `set`, which covers pixi-3d's vectors,
 * quaternions and matrices, and Euler angles
 * @category types
 * @advanced
 */
export type MathTypes = MathRepresentation | EulerRepresentation;

/**
 * The plain object a vector or quaternion prop also takes, which the node copies in: `{ x, y }`,
 * `{ x, y, z }` or `{ x, y, z, w }`. That covers three's classes from `react-pixi-fiber/three`
 * (`position={new Vector3(1, 2, 3)}`), which extend pixi-3d's plain vectors rather than the observable
 * ones a node holds. Euler angles take only an `Euler` or its arguments, as in three.
 * @internal
 */
type MathObject<T> = T extends { order: unknown }
  ? never
  : T extends { x: number; y: number; z: number; w: number }
    ? { x: number; y: number; z: number; w: number }
    : T extends { x: number; y: number; z: number }
      ? { x: number; y: number; z: number }
      : T extends { x: number; y: number }
        ? { x: number; y: number }
        : never;

/**
 * What a math prop accepts: the object, the arguments of its `set`, one number for every component
 * when `set` takes it (`scale={2}`), or for a vector or quaternion any object with its components,
 * three's classes from `react-pixi-fiber/three` among them (`position={new Vector3(1, 2, 3)}`)
 * @category types
 * @advanced
 */
export type MathType<T extends MathTypes> =
  | T
  | Parameters<T['set']>
  | Readonly<Parameters<T['set']>>
  | (IsAllOptional<Parameters<T['set']>> extends true ? number : never)
  | MathObject<T>;

/**
 * The math props of `P`, widened to {@link MathType}; colours are {@link ColorProps}
 * @category types
 * @advanced
 */
export type MathProps<P> = {
  [K in keyof P as P[K] extends ThreeColor ? never : P[K] extends MathTypes ? K : never]: P[K] extends MathTypes
    ? MathType<P[K]>
    : never;
};

/**
 * The colour props of `P`: a three `Color` field takes what three's colour props take (`color="red"`,
 * `color={0xff0000}`, `color={[1, 0, 0]}`), and a pixi `Color` field any pixi `ColorSource`
 * @category types
 * @advanced
 */
export type ColorProps<P> = {
  [K in keyof P as P[K] extends ThreeColor | PixiColor ? K : never]: P[K] extends ThreeColor ? Color : ColorSource;
};

/**
 * The React props every element takes
 * @category types
 * @advanced
 */
export interface ReactProps<P> {
  /** Child elements, which attach to this one */
  children?: React.ReactNode;
  /** Receives the object behind the element */
  ref?: React.Ref<P>;
  /** React's key */
  key?: React.Key;
}

/**
 * Event props: r3f's handlers on scene nodes, and their 2D form on pixi.js containers
 * @category types
 * @advanced
 */
export type EventProps<P> = P extends Container3D
  ? Partial<EventHandlers>
  : P extends Container
    ? Partial<EventHandlers2D>
    : {};

/**
 * The props a 2D object adds to its fields: what its setters take beyond their getters' types, and a
 * graphics' `draw`
 * @category types
 * @advanced
 */
export type Props2D<P> = Is2D<P> extends true ? SetterProps2D<P> & DrawProps2D<P> : {};

/**
 * A function that attaches a child to its parent and returns the detach
 * @category types
 * @advanced
 */
export type AttachFnType<O = unknown> = (parent: unknown, self: O) => () => void;

/**
 * Where a child attaches on its parent: a property path, or a function that attaches it and
 * returns the detach
 * @category types
 * @advanced
 */
export type AttachType<O = unknown> = string | AttachFnType<O>;

/**
 * Classes by name, as `extend` takes them
 * @category types
 * @advanced
 */
export interface Catalogue {
  /** A class by its name */
  [name: string]: ConstructorRepresentation;
}

/**
 * Constructor arguments of a class, as the `args` prop; for a pixi.js 2D class, those of any of its
 * constructor's overloads, and none for a particle, which its props can build alone
 * @category types
 * @advanced
 */
export type Args<T> = T extends ConstructorRepresentation
  ? Is2D<InstanceType<T>> extends true
    ? OverloadArgs<T> | (InstanceType<T> extends Particle ? [] : never)
    : ConstructorParameters<T>
  : unknown[];

type ArgsProp<P> = P extends ConstructorRepresentation
  ? true extends IsAllOptional<Args<P>>
    ? { args?: Args<P> }
    : { args: Args<P> }
  : { args: unknown[] };

/**
 * The r3f props every element takes: `args`, `object`, `dispose` and `attach`
 * @category types
 * @advanced
 */
export type InstanceProps<T = unknown, P = unknown> = ArgsProp<P> & {
  /** An existing object to use instead of constructing one */
  object?: T;
  /** `null` keeps the object alive when the element unmounts */
  dispose?: null;
  /** Where the object attaches on its parent */
  attach?: AttachType<T>;
};

/**
 * The props of an element for class `T`: its fields, math and colour props, React props and events,
 * and for a pixi.js 2D class the props its setters take
 * @category types
 * @advanced
 */
export type ElementProps<T extends ConstructorRepresentation, P = InstanceType<T>> = Partial<
  Overwrite<P, MathProps<P> & ColorProps<P> & Props2D<P> & ReactProps<P> & EventProps<P>>
>;

/**
 * The JSX props for class `T`
 * @example
 * ```tsx
 * import { extend, type ThreeElement } from 'react-pixi-fiber';
 *
 * class Spinner extends Mesh3D {}
 * extend({ Spinner });
 *
 * declare module 'react-pixi-fiber' {
 *   interface ThreeElements {
 *     spinner: ThreeElement<typeof Spinner>;
 *   }
 * }
 * ```
 * @category types
 * @standard
 */
export type ThreeElement<T extends ConstructorRepresentation> = Mutable<
  Overwrite<ElementProps<T>, Omit<InstanceProps<InstanceType<T>, T>, 'object'>>
>;

/**
 * Every class in a namespace as an element named in camelCase; everything else is dropped
 * @category types
 * @advanced
 */
export type ThreeToJSXElements<T extends object> = {
  [
    K in keyof T & string as T[K] extends ConstructorRepresentation ? Uncapitalize<K> : never
  ]: T[K] extends ConstructorRepresentation ? ThreeElement<T[K]> : never;
};

/**
 * The entry of element map `E` named `K`
 * @category types
 * @advanced
 */
export type ElementOf<E, K extends string> = E[Extract<keyof E, K>];

/**
 * Element names HTML or SVG already use; a catalog class with one of these names is reachable
 * with a `three` prefix instead (pixi-3d's `Track` is `<threeTrack>`)
 * @category types
 * @advanced
 */
export type DomElementName = 'audio' | 'source' | 'line' | 'path' | 'track';

/**
 * The JSX element map for a namespace of classes, plus `<primitive>`
 * @category types
 * @advanced
 */
export type ThreeElementsOf<T extends object> = Omit<ThreeToJSXElements<T>, DomElementName> & {
  /** Wraps an existing object; any prop is applied to it by name */
  primitive: Partial<EventHandlers> & {
    object: object;
    ref?: React.Ref<unknown>;
    key?: React.Key;
    children?: React.ReactNode;
    dispose?: null;
    /** Where it attaches; any element's attach, since the object can be of any class */
    attach?: AttachType<never>;
    [prop: string]: unknown;
  };
} & {
  [K in DomElementName & keyof ThreeToJSXElements<T> as `three${Capitalize<K>}`]: ThreeToJSXElements<T>[K];
};

/**
 * A React element's place in r3f's tree: what `useInstanceHandle` returns
 * @category types
 * @advanced
 */
export interface Instance<O = unknown> {
  /** The root's store */
  root: RootStore;
  /** The element name */
  type: string;
  /** The parent instance */
  parent: Instance | null;
  /** The child instances */
  children: Instance[];
  /** The element's props */
  props: InstanceProps<O> & Record<string, unknown>;
  /** The object the element made */
  object: O & { __r3f?: Instance<O> };
  /** How many event handlers it has */
  eventCount: number;
  /** Its event handlers */
  handlers: Partial<EventHandlers>;
  /** Where it attaches on its parent */
  attach?: AttachType<O>;
  /** Whether Suspense or Activity is hiding it */
  isHidden: boolean;
}

/**
 * The types r3f's reconciler is built with
 * @category types
 * @advanced
 */
export interface HostConfig {
  /** An element name */
  type: string;
  /** An element's props */
  props: Instance['props'];
  /** A root's store */
  container: RootStore;
  /** An element's instance record */
  instance: Instance;
  /** Text has no instance */
  textInstance: void;
  /** A suspended element's instance record */
  suspenseInstance: Instance;
  /** Never hydrates */
  hydratableInstance: never;
  /** No forms */
  formInstance: never;
  /** What a ref receives: the element's object */
  publicInstance: Instance['object'];
  /** No host context */
  hostContext: {};
  /** No persistent mode */
  childSet: never;
  /** A timer handle */
  timeoutHandle: number | undefined;
  /** No timer */
  noTimeout: -1;
  /** No transition status */
  TransitionStatus: null;
}

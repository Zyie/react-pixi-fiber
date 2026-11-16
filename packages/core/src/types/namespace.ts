/**
 * r3f's `ReactThreeFiber` namespace: the element and math-prop types under the names r3f gives
 * them, typed against pixi-3d, so code written as `ReactThreeFiber.Vector3` keeps compiling. three's
 * `Layers`, the geometry `once()` props and the node-material props have no pixi-3d counterpart and
 * are left out.
 * @example
 * ```tsx
 * import type { ReactThreeFiber } from 'react-pixi-fiber';
 *
 * interface BoxProps {
 *   position?: ReactThreeFiber.Vector3;
 *   color?: ReactThreeFiber.Color;
 * }
 * ```
 * @category types
 * @advanced
 */
import type { ThreeElements as EntryElements, ThreeExports as EntryExports } from '../index';
import type * as Elements from './elements';
import type * as Props from './math';
import type { ConstructorRepresentation } from './utils';

/** The parameters of a function, mutable or read-only */
export type MutableOrReadonlyParameters<T extends (...args: never[]) => unknown> = Props.MutableOrReadonlyParameters<T>;
/** Anything with a numeric `set` */
export type MathRepresentation = Elements.MathRepresentation;
/** Anything with three's Euler `set` */
export type EulerRepresentation = Elements.EulerRepresentation;
/** A math object whose `set` also takes one number */
export type VectorRepresentation = Props.VectorRepresentation;
/** Every object a math prop can hold */
export type MathTypes = Elements.MathTypes;
/** What a math prop accepts for a math object */
export type MathType<T extends Elements.MathTypes> = Elements.MathType<T>;
/** The math props of `P`, widened to what they accept */
export type MathProps<P> = Elements.MathProps<P>;
/** What a `Vector2` prop takes */
export type Vector2 = Props.Vector2;
/** What a `Vector3` prop takes */
export type Vector3 = Props.Vector3;
/** What a `Vector4` prop takes */
export type Vector4 = Props.Vector4;
/** What a colour prop takes */
export type Color = Props.Color;
/** What a `quaternion` prop takes */
export type Quaternion = Props.Quaternion;
/** What a `rotation` prop takes */
export type Euler = Props.Euler;
/** What a `Matrix3` prop takes */
export type Matrix3 = Props.Matrix3;
/** What a `Matrix4` prop takes */
export type Matrix4 = Props.Matrix4;
/** Event props, for scene nodes */
export type EventProps<P> = Elements.EventProps<P>;
/** The React props every element takes */
export type ReactProps<P> = Elements.ReactProps<P>;
/** The props of an element for class `T` */
export type ElementProps<T extends ConstructorRepresentation, P = InstanceType<T>> = Elements.ElementProps<T, P>;
/** The JSX props for class `T` */
export type ThreeElement<T extends ConstructorRepresentation> = Elements.ThreeElement<T>;
/** Every class in a namespace as an element named in camelCase */
export type ThreeToJSXElements<T extends object> = Elements.ThreeToJSXElements<T>;
/** The JSX element map for a namespace of classes, plus `<primitive>` */
export type ThreeElementsOf<T extends object> = Elements.ThreeElementsOf<T>;
/** The entry of element map `E` named `K` */
export type ElementOf<E, K extends string> = Elements.ElementOf<E, K>;
/** Every element a scene can use */
export type ThreeElements = EntryElements;
/** The classes elements resolve to */
export type ThreeExports = EntryExports;

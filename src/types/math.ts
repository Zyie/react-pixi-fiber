import type {
  Container3D,
  Matrix3 as PixiMatrix3,
  Matrix4 as PixiMatrix4,
  Vector2 as PixiVector2,
  Vector4 as PixiVector4,
} from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

import type { MathRepresentation, MathType } from './elements';

/**
 * The parameters of a function, mutable or read-only, as a math prop takes its `set` arguments
 * @category types
 * @advanced
 */
export type MutableOrReadonlyParameters<T extends (...args: never[]) => unknown> =
  | Parameters<T>
  | Readonly<Parameters<T>>;

/**
 * A math object whose `set` also takes one number for every component (`scale={2}`)
 * @category types
 * @advanced
 */
export interface VectorRepresentation extends MathRepresentation {
  /** Sets every component to one value */
  setScalar(value: number): unknown;
}

/**
 * Every object a math prop can hold: anything with a numeric `set`, which covers pixi-3d's
 * vectors, quaternions and matrices
 * @category types
 * @advanced
 */
export type MathTypes = MathRepresentation;

/**
 * What a `Vector2` prop takes: a vector, `[x, y]`, or one number for both
 * @category math
 * @standard
 */
export type Vector2 = MathType<PixiVector2>;

/**
 * What a `Vector3` prop such as `position` or `scale` takes: a vector, `[x, y, z]`, or one number
 * for all three
 * @example
 * ```tsx
 * import type { Vector3 } from 'react-pixi-fiber';
 *
 * function Box({ position = [0, 1, 0] }: { position?: Vector3 }) {
 *   return <mesh position={position} />;
 * }
 * ```
 * @category math
 * @standard
 */
export type Vector3 = MathType<Container3D['position']>;

/**
 * What a `Vector4` prop takes: a vector, `[x, y, z, w]`, or one number for every component
 * @category math
 * @advanced
 */
export type Vector4 = MathType<PixiVector4>;

/**
 * What a `rotation` prop takes: Euler angles in radians as a vector, `[x, y, z]`, or one number
 * for all three. pixi-3d keeps rotation in a vector, so three's order argument has no slot.
 * @category math
 * @standard
 */
export type Euler = MathType<Container3D['rotation']>;

/**
 * What a `quaternion` prop takes: a quaternion or `[x, y, z, w]`
 * @category math
 * @advanced
 */
export type Quaternion = MathType<Container3D['quaternion']>;

/**
 * What a `Matrix3` prop takes: a matrix or its nine elements
 * @category math
 * @advanced
 */
export type Matrix3 = MathType<PixiMatrix3>;

/**
 * What a `Matrix4` prop takes: a matrix or its sixteen elements
 * @category math
 * @advanced
 */
export type Matrix4 = MathType<PixiMatrix4>;

/**
 * What a colour prop takes: any pixi `ColorSource`, such as `"red"`, `"#ff8800"`, `0xff8800` or
 * `[1, 0.5, 0]`, as three's take a `ColorRepresentation`
 * @category math
 * @standard
 */
export type Color = ColorSource;

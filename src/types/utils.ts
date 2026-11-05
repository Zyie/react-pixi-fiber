/**
 * Keys of `P` whose values are not functions
 * @category types
 * @advanced
 */
export type NonFunctionKeys<P> = { [K in keyof P]-?: P[K] extends (...args: never[]) => unknown ? never : K }[keyof P];

/**
 * `P` with the non-function keys of `O` replaced by `O`'s
 * @category types
 * @advanced
 */
export type Overwrite<P, O> = Omit<P, NonFunctionKeys<O>> & O;

/**
 * The non-function members of `T`
 * @category types
 * @advanced
 */
export type Properties<T> = Pick<T, NonFunctionKeys<T>>;

/**
 * `P` with `readonly` removed
 * @category types
 * @advanced
 */
export type Mutable<P> = { -readonly [K in keyof P]: P[K] };

/**
 * Whether `undefined` is assignable to `T`
 * @category types
 * @advanced
 */
export type IsOptional<T> = undefined extends T ? true : false;

/**
 * Whether every element of a tuple is optional
 * @category types
 * @advanced
 */
export type IsAllOptional<T extends unknown[]> = T extends [infer First, ...infer Rest]
  ? IsOptional<First> extends true
    ? IsAllOptional<Rest>
    : false
  : true;

/**
 * Any class
 * @category types
 * @advanced
 */
export type ConstructorRepresentation<T = unknown> = new (...args: never[]) => T;

/**
 * React's `act`, typed for async callbacks
 * @category types
 * @advanced
 */
export type Act = <T = unknown>(callback: () => Promise<T>) => Promise<T>;

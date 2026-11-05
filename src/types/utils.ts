import type * as React from 'react';

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

/**
 * How `is.equ` compares two values
 * @category types
 * @advanced
 */
export interface EquConfig {
  /** Compare arrays by reference (the default) or shallowly */
  arrays?: 'reference' | 'shallow';
  /** Compare objects by reference (the default) or shallowly */
  objects?: 'reference' | 'shallow';
  /** When `true` (the default), both values must have the same keys; when `false`, `a`'s keys must be in `b` */
  strict?: boolean;
}

/**
 * Something `dispose` can free: it has a `dispose` method, and a scene's `type` keeps it alive
 * @category types
 * @advanced
 */
export interface Disposable {
  /** The object's type name; `'Scene'` is never disposed */
  type?: string;
  /** Frees the object */
  dispose?: () => void;
}

/**
 * A component that carries the React context of the renderer it was made in, from `useBridge`
 * @category types
 * @advanced
 */
export type Bridge = React.FC<{ children?: React.ReactNode }>;

/**
 * What `Block` hands its setter: a promise that never settles while it is mounted, `false` once it unmounts
 * @category types
 * @advanced
 */
export type SetBlock = false | Promise<null> | null;

/**
 * The props of a component that unblocks rendering through `set`
 * @category types
 * @advanced
 */
export interface UnblockProps {
  /** Receives the blocking promise, then `false` */
  set: React.Dispatch<React.SetStateAction<SetBlock>>;
  /** What renders once unblocked */
  children: React.ReactNode;
}

/**
 * A callback of `addEffect`, `addAfterEffect` or `addTail`
 * @category types
 * @advanced
 */
export type GlobalRenderCallback = (timestamp: number) => void;

/**
 * When a global effect runs: before every frame, after it, or when the loop goes idle
 * @category types
 * @advanced
 */
export type GlobalEffectType = 'before' | 'after' | 'tail';

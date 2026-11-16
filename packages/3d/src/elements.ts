import type { ConstructorRepresentation, Mutable, Overwrite, ThreeElement } from '@react-fiber/core';

/** The first argument of a class's constructor, an options object for @pixi/3d's classes */
type OptionsOf<T> = T extends new (options: infer O, ...rest: never[]) => unknown
  ? O
  : T extends new (options?: infer O, ...rest: never[]) => unknown
    ? O
    : never;

/** Every key of any member of a union */
type KeysOf<O> = O extends unknown ? keyof O : never;

/** The type of a key in whichever members of a union have it */
type ValueOf<O, K extends PropertyKey> = O extends unknown ? (K extends keyof O ? O[K] : never) : never;

/** Keys an element's own props hold, which an option of the same name never replaces */
type ElementKeys = 'children' | 'parent' | 'ref' | 'key' | 'args' | 'object' | 'attach' | 'dispose';

/**
 * The props a @pixi/3d class takes beyond its fields' types: where its constructor options name a field,
 * what the option takes, as its setter does (`baseColor="tomato"` where the field reads back a number,
 * `color` on a light, `position={{ x, y, z }}`)
 * @category types
 * @advanced
 */
export type OptionProps3D<T extends ConstructorRepresentation> = {
  [K in Exclude<KeysOf<OptionsOf<T>> & keyof InstanceType<T>, ElementKeys>]?:
    | ValueOf<OptionsOf<T>, K>
    | (K extends keyof ThreeElement<T> ? ThreeElement<T>[K] : never);
};

/**
 * The JSX props of a @pixi/3d class: its fields, math and colour props, React props and events, as
 * every element's, widened by its constructor options where they name a field, and its constructor's
 * arguments as `args`
 * @category types
 * @advanced
 */
export type Element3D<T extends ConstructorRepresentation> = Mutable<Overwrite<ThreeElement<T>, OptionProps3D<T>>>;

/**
 * Every class in a namespace as an element named in camelCase, typed by {@link Element3D}
 * @category types
 * @advanced
 */
export type Elements3D<T extends object> = {
  [
    K in keyof T & string as T[K] extends ConstructorRepresentation ? Uncapitalize<K> : never
  ]: T[K] extends ConstructorRepresentation ? Element3D<T[K]> : never;
};

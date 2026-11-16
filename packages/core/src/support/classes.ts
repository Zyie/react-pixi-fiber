import { getThree } from '@react-fiber/r3f/src/core/three';

import type { RaycasterLike, Registered, RegisteredInstance } from '../types/register';
import type { RootState } from '../types/state';

/** A registered camera, which core aims as r3f's core aims its default camera */
type CoreCamera<K extends 'PerspectiveCamera' | 'OrthographicCamera'> = RegisteredInstance<K> & {
  lookAt(x: number, y: number, z: number): void;
};

/**
 * The classes core builds its own objects from, as r3f's core builds a root's default scene, camera
 * and raycaster: the ones the registered packages give, three's with `@react-fiber/threejs-compat`
 * @internal
 */
export interface CoreClasses {
  /** A scene, as a `<View3D>` or a `<RenderTexture2D>` draws */
  Scene: Registered<'Scene'>;
  /** A perspective camera, made with three's arguments, as r3f's core makes its default camera */
  PerspectiveCamera: new (
    fov?: number,
    aspect?: number,
    near?: number,
    far?: number,
  ) => CoreCamera<'PerspectiveCamera'>;
  /** An orthographic camera, made with three's arguments */
  OrthographicCamera: new (
    left?: number,
    right?: number,
    top?: number,
    bottom?: number,
    near?: number,
    far?: number,
  ) => CoreCamera<'OrthographicCamera'>;
  /** A raycaster, of which core calls three's members */
  Raycaster: new () => RaycasterLike;
  /** A point in space, as a hit's `point` */
  Vector3: new (x?: number, y?: number, z?: number) => RegisteredInstance<'Vector3'>;
}

/**
 * The classes a root's support gives core
 * @param state - The root's state
 * @internal
 */
export const classesOf = (state: RootState): CoreClasses => state.internal.support.three as unknown as CoreClasses;

/**
 * The classes the first root's support gave core, for code that runs outside a root
 * @internal
 */
export const loadedClasses = (): CoreClasses => getThree() as unknown as CoreClasses;

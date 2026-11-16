import type { Container3D } from '@pixi/3d';
import type { Container, Particle } from 'pixi.js';

import { compareHits } from '../events/hitOrder';
import type { DomEvent } from '../types/events';
import type { Registered } from '../types/register';
import type { RootState } from '../types/state';
import type { Intersection2D } from '../types/twoD';
import { hooksOf } from './registry';

/**
 * An object of the scene graph: a pixi-3d node, a pixi.js 2D object, or a particle
 * @category renderer
 * @advanced
 */
export type SceneObject = Container3D | Container | Particle;

/**
 * A hit on a 3D node or on a 2D object
 * @category renderer
 * @advanced
 */
export type SceneHit = Registered<'Intersection'> | Intersection2D;

/**
 * How r3f's core reaches pixi's objects: the renderer hooks of the pixi support
 * @category renderer
 * @advanced
 */
export interface PixiHooks {
  /**
   * Adds a child, or moves it, before `before` when given, through the hooks of the package that owns
   * the child
   * @param parent - The parent's object
   * @param child - The child's object
   * @param before - The sibling it goes before
   */
  add(parent: SceneObject, child: SceneObject, before?: SceneObject): void;
  /**
   * Takes a child out of its parent, through the hooks of the package that owns the child
   * @param parent - The parent's object
   * @param child - The child's object
   */
  remove(parent: SceneObject, child: SceneObject): void;
  /**
   * Whether an object is in the scene graph, as the package that owns it says
   * @param object - An element's object
   */
  isInteractive(object: object): boolean;
  /**
   * Where an object attaches to its parent when its element doesn't say, as the package that owns it
   * says: `'geometry'` and `'material'` for a mesh's
   * @param object - An element's object
   */
  defaultAttach(object: object): string | undefined;
  /**
   * Writes a prop or an attach the package that owns the object handles itself, such as a method that
   * is also a prop or a slot of a list it keeps, and returns whether it did; core writes the rest
   * @param object - An element's object, or the parent an element attaches to
   * @param key - The prop as written, or the child's `attach`
   * @param value - The value, the attached child, or on detach what the attach replaced
   */
  applyProp(object: object, key: string, value: unknown): boolean;
  /**
   * The hits of a pointer event on an object and its descendants, from the package that owns it: the
   * root's raycaster on a 3D node, the screen layer under the pointer on a 2D element
   * @param object - An element's object that has handlers
   * @param event - The DOM event
   * @param state - The state of its root or portal
   */
  hitTest(object: SceneObject, event: DomEvent, state: RootState): SceneHit[];
  /**
   * Orders two hits as they are drawn, front first: 2D over the 3D, then the 3D by distance, then 2D under
   * it, with a `<View3D>`'s or a `<RenderTexture2D>`'s hits where it is drawn
   * @param a - A hit
   * @param b - Another
   */
  compareHits(a: SceneHit, b: SceneHit): number;
  /**
   * Frees an object r3f removed, through the package that owns it, else its own `dispose`; a scene is
   * never freed
   * @param object - The object
   */
  dispose(object: object): void;
}

/**
 * The renderer hooks of the pixi support: each asks the hooks of the package that owns the object
 * (`ObjectHooks`, registered with pixi.js's `extensions`), and `compareHits` orders hits by draw order
 * @internal
 */
export const pixiHooks: PixiHooks = {
  add(parent, child, before) {
    hooksOf(child)?.add?.(parent, child, before);
  },
  remove(parent, child) {
    hooksOf(child)?.remove?.(parent, child);
  },
  isInteractive: (object) => hooksOf(object)?.isInteractive?.(object) ?? false,
  defaultAttach: (object) => hooksOf(object)?.defaultAttach?.(object),
  applyProp: (object, key, value) => hooksOf(object)?.applyProp?.(object, key, value) ?? false,
  hitTest: (object, event, state) => hooksOf(object)?.hitTest?.(object, event, state) ?? [],
  compareHits,
  dispose(object) {
    const disposable = object as { type?: string; dispose?(): void };
    if (disposable.type === 'Scene') return;
    const hooks = hooksOf(object);
    if (hooks?.dispose) hooks.dispose(object);
    else disposable.dispose?.();
  },
};

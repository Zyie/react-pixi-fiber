import { BaseMaterial3D, Container3D, Geometry3D } from '@pixi/3d';
import { Container, Particle } from 'pixi.js';

import type { Intersection } from '../compat/Raycaster';
import { IN_3D, compareHits, drawOrder, layerOrderOf, setHitOrder } from '../events/hitOrder';
import { hitTestScreen } from '../two-d/hitTest';
import { addToScene, removeFromScene } from '../two-d/screen';
import { add2D, remove2D } from '../two-d/surface';
import type { Intersection2D } from '../two-d/types';
import type { DomEvent } from '../types/events';
import type { RootState } from '../types/state';

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
export type SceneHit = Intersection | Intersection2D;

/**
 * How r3f's core reaches pixi's objects: the renderer hooks of the pixi support
 * @category renderer
 * @advanced
 */
export interface PixiHooks {
  /**
   * Adds a child, or moves it, before `before` when given. A 3D node goes in the children of a 3D node; a
   * 2D object under a scene goes on its screen layer, under another 3D node in an anchor, and under a 2D
   * container where its element is among its siblings.
   * @param parent - The parent's object
   * @param child - The child's object
   * @param before - The sibling it goes before
   */
  add(parent: SceneObject, child: SceneObject, before?: SceneObject): void;
  /**
   * Takes a child out of its parent
   * @param parent - The parent's object
   * @param child - The child's object
   */
  remove(parent: SceneObject, child: SceneObject): void;
  /**
   * Whether an object is in the scene graph: a 3D node, a 2D object or a particle
   * @param object - An element's object
   */
  isInteractive(object: object): boolean;
  /**
   * `'geometry'` for a geometry and `'material'` for a material, which attach to a mesh unless their
   * element says otherwise
   * @param object - An element's object
   */
  defaultAttach(object: object): string | undefined;
  /**
   * The hits of a pointer event: on a 3D node and its descendants, cast with the root's raycaster, or on
   * the 2D under the pointer in a 2D element
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
   * Frees an object r3f removed, through its `dispose`; a scene is never freed
   * @param object - The object
   */
  dispose(object: object): void;
}

/**
 * The renderer hooks of the pixi support, over what the compat layer and the 2D surface give pixi's
 * classes
 * @internal
 */
export const pixiHooks: PixiHooks = {
  add(parent, child, before) {
    if (parent instanceof Container) return add2D(parent, child);
    if (!(parent instanceof Container3D)) return;
    if (!(child instanceof Container3D)) return addToScene(parent, child);
    const index = before instanceof Container3D ? parent.children.indexOf(before) : -1;
    if (index === -1) {
      parent.addChild(child);
      return;
    }
    const current = parent.children.indexOf(child);
    parent.addChildAt(child, current !== -1 && current < index ? index - 1 : index);
  },
  remove(parent, child) {
    if (parent instanceof Container) remove2D(parent, child);
    else if (parent instanceof Container3D) {
      if (child instanceof Container3D) parent.removeChild(child);
      else removeFromScene(parent, child);
    }
  },
  isInteractive: (object) => object instanceof Container3D || object instanceof Container || object instanceof Particle,
  defaultAttach(object) {
    if (object instanceof Geometry3D) return 'geometry';
    if (object instanceof BaseMaterial3D) return 'material';
    return undefined;
  },
  hitTest(object, _event, state) {
    if (object instanceof Container) return hitTestScreen(object, state);
    if (!(object instanceof Container3D)) return [];
    const hits = state.raycaster.intersectObject(object, true);
    const layer = layerOrderOf(state.raycaster);
    for (const hit of hits) setHitOrder(hit, drawOrder(layer, IN_3D, hit.distance));
    return hits;
  },
  compareHits,
  dispose(object) {
    const disposable = object as { type?: string; dispose?(): void };
    if (disposable.type !== 'Scene') disposable.dispose?.();
  },
};

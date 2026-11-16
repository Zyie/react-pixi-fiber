import { addToScene, hitTestScreen, isNode3D, removeFromScene } from '@react-fiber/core/extension';
import type { Linked, ObjectHooks } from '@react-fiber/core/extension';
import { AnimatedSprite, BlurFilter, Container, Filter, GraphicsContext, Particle } from 'pixi.js';

import { add2D, remove2D } from './children';
import { driveOnRootClock } from './frame';
import { applyProp2D } from './props';

/**
 * Whether an object is a node of the 2D scene graph, a container or a particle, rather than something
 * an element attaches, a filter or a graphics context
 * @param object - An element's object
 */
const isNode2D = (object: object): object is Container | Particle =>
  object instanceof Container || object instanceof Particle;

/**
 * Frees what an element made: a container, a graphics context or a filter, with `destroy()` and its
 * defaults, which leave a texture or a context passed in alone. A `BlurFilter` frees its two passes
 * too, which its own `destroy` leaves bound to the renderer's uniform buffers.
 * @param object - The object
 */
function dispose2D(object: object): void {
  if (object instanceof BlurFilter) {
    object.blurXFilter.destroy();
    object.blurYFilter.destroy();
  }
  if (object instanceof Container || object instanceof GraphicsContext || object instanceof Filter) object.destroy();
}

/**
 * The renderer hooks of pixi.js's 2D objects, which this package registers with core: a 2D object
 * joins a 2D container where its element is among its siblings, and a 3D node on its scene's screen
 * layer or in an anchor that follows the node (core's stage); an animated sprite then runs on its
 * root's clock. Containers and particles are in the scene graph, and a container's hits are what is
 * under the pointer on its screen layer. Filters and graphics contexts attach to a container. The
 * props and attaches pixi's fields don't take by assignment are {@link applyProp2D}'s, and unmounting
 * destroys what an element made.
 * @internal
 */
export const objects2D: ObjectHooks = {
  test: (object) => isNode2D(object) || object instanceof Filter || object instanceof GraphicsContext,
  add(parent, child) {
    if (parent instanceof Container) add2D(parent, child);
    else if (isNode3D(parent)) addToScene(parent, child);
    else return;
    if (child instanceof AnimatedSprite) driveOnRootClock(child as Linked<AnimatedSprite>);
  },
  remove(parent, child) {
    if (parent instanceof Container) remove2D(parent, child);
    else if (isNode3D(parent)) removeFromScene(parent, child);
  },
  isInteractive: isNode2D,
  applyProp: applyProp2D,
  hitTest: (object, _event, state) => (object instanceof Container ? hitTestScreen(object, state) : []),
  dispose: dispose2D,
};

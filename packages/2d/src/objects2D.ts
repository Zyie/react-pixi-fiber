import { addToScene, hitTestScreen, isNode3D, removeFromScene } from '@react-fiber/core/extension';
import type { Linked, ObjectHooks } from '@react-fiber/core/extension';
import { AnimatedSprite, Container, Particle } from 'pixi.js';

import { driveOnRootClock } from './frame';
import { add2D, remove2D } from './surface';

/**
 * The renderer hooks of pixi.js's 2D objects, which this package registers with core: a 2D object
 * joins a 2D container where its element is among its siblings, and a 3D node on its scene's screen
 * layer or in an anchor that follows the node (core's stage); an animated sprite then runs on its
 * root's clock. Every container and particle is in the scene graph, and a container's hits are what is
 * under the pointer on its screen layer.
 * @internal
 */
export const objects2D: ObjectHooks = {
  test: (object) => object instanceof Container || object instanceof Particle,
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
  isInteractive: () => true,
  hitTest: (object, _event, state) => (object instanceof Container ? hitTestScreen(object, state) : []),
};

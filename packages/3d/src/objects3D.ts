import { BaseMaterial3D, Container3D, Geometry3D } from '@pixi/3d';
import { IN_3D, THREE_IN_2D, drawOrder, layerOrderOf, setHitOrder, warnOnce } from '@react-fiber/core/extension';
import type { ObjectHooks } from '@react-fiber/core/extension';
import { Container } from 'pixi.js';

/** What the dispose hook frees: a node, geometry or material, through its own `dispose` when it has one */
type Freeable = (Container3D | Geometry3D | BaseMaterial3D) & { dispose?(): void };

/**
 * The renderer hooks of @pixi/3d's objects, which this package registers with core: a node joins a
 * node's children, before a sibling through `addChildAt`, and is left out of 2D with a warning; a
 * geometry attaches as its mesh's `geometry` and a material as its `material`; a node's hits are its
 * root's raycaster's, cast at the node and its descendants, ordered in the 3D of their screen layer
 * by distance; an object r3f removes is destroyed, through its `dispose` where a package gives it one.
 * @internal
 */
export const objects3D: ObjectHooks = {
  test: (object) => object instanceof Container3D || object instanceof Geometry3D || object instanceof BaseMaterial3D,
  add(parent, child, before) {
    if (!(child instanceof Container3D)) return;
    if (parent instanceof Container) {
      warnOnce(THREE_IN_2D);
      return;
    }
    if (!(parent instanceof Container3D)) return;
    const index = before instanceof Container3D ? parent.children.indexOf(before) : -1;
    if (index === -1) {
      parent.addChild(child);
      return;
    }
    const current = parent.children.indexOf(child);
    parent.addChildAt(child, current !== -1 && current < index ? index - 1 : index);
  },
  remove(parent, child) {
    if (parent instanceof Container3D && child instanceof Container3D) parent.removeChild(child);
  },
  isInteractive: (object) => object instanceof Container3D,
  defaultAttach(object) {
    if (object instanceof Geometry3D) return 'geometry';
    if (object instanceof BaseMaterial3D) return 'material';
    return undefined;
  },
  hitTest(object, _event, state) {
    if (!(object instanceof Container3D)) return [];
    const hits = state.raycaster.intersectObject(object, true);
    const layer = layerOrderOf(state.raycaster);
    for (const hit of hits) setHitOrder(hit, drawOrder(layer, IN_3D, hit.distance));
    return hits;
  },
  dispose(object) {
    const freeable = object as Freeable;
    if (freeable.dispose) freeable.dispose();
    else freeable.destroy();
  },
};

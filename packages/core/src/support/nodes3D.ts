import { Container3D } from '@pixi/3d';
import { Container } from 'pixi.js';

import { IN_3D, drawOrder, layerOrderOf, setHitOrder } from '../events/hitOrder';
import { THREE_IN_2D, warnOnce } from '../stage/screen';
import type { ObjectHooks } from './registry';

/** What the dispose hook frees: a node, through its own `dispose` when a package gives it one */
type FreeableNode = Container3D & { dispose?(): void };

/**
 * The renderer hooks of the 3D scene graph a root is built on, which core registers under every
 * package: a root's scene is a `Container3D`, so its nodes are core's whether or not `@react-fiber/3d`
 * is installed. A node joins a node's children, before a sibling through `addChildAt`, and is left
 * out of 2D with a warning; its hits are its root's raycaster's, cast at the node and its descendants
 * and ordered in the 3D of their screen layer by distance; a node r3f removes is destroyed, through
 * its `dispose` where a package gives it one.
 * @internal
 */
export const nodes3D: ObjectHooks = {
  test: (object) => object instanceof Container3D,
  add(parent, child, before) {
    const node = child as Container3D;
    if (parent instanceof Container) {
      warnOnce(THREE_IN_2D);
      return;
    }
    if (!(parent instanceof Container3D)) return;
    const index = before instanceof Container3D ? parent.children.indexOf(before) : -1;
    if (index === -1) {
      parent.addChild(node);
      return;
    }
    const current = parent.children.indexOf(node);
    parent.addChildAt(node, current !== -1 && current < index ? index - 1 : index);
  },
  remove(parent, child) {
    if (parent instanceof Container3D) parent.removeChild(child as Container3D);
  },
  isInteractive: () => true,
  hitTest(object, _event, state) {
    const hits = state.raycaster.intersectObject(object as Container3D, true);
    const layer = layerOrderOf(state.raycaster);
    for (const hit of hits) setHitOrder(hit, drawOrder(layer, IN_3D, hit.distance));
    return hits;
  },
  dispose(object) {
    const node = object as FreeableNode;
    if (node.dispose) node.dispose();
    else node.destroy();
  },
};

import { Container3D } from '@pixi/3d';
import { AnimatedSprite, Container, warn } from 'pixi.js';

import type { Instance } from '../types/elements';
import { Anchor2D, adoptIntoAnchor, releaseAnchor } from './Anchor2D';
import { clearCursorsUnder } from './cursor';
import { driveOnRootClock } from './frame';

/**
 * The zIndex of a scene's 3D view in its screen layer: just under 0, so 2D at the default zIndex of 0
 * draws over the 3D and 2D with a negative zIndex under it
 * @internal
 */
export const VIEW_Z_INDEX = -Number.EPSILON;

/**
 * The warning for a 3D element inside a 2D one, which is left out
 * @internal
 */
export const THREE_IN_2D =
  "react-pixi-fiber: a 3D element is inside a 2D element, which can't hold 3D, so it is left out. " +
  'Put 3D elements directly in the <Canvas> or inside other 3D elements, or draw them inside 2D with <View3D>.';

/**
 * The zIndex of a scene's 3D view in its 3D layer: under every anchored 2D object in the layer
 * @internal
 */
export const VIEW_IN_LAYER_Z_INDEX = -Number.MAX_VALUE;

const screens = new WeakMap<Container3D, Container>();
const screenScenes = new WeakMap<Container, Container3D>();
const layers = new WeakMap<Container, Container>();
const layerScreens = new WeakMap<Container, Container>();
const warned = new Set<string>();

/**
 * An object an element made, with r3f's record of the element
 * @internal
 */
export type Linked<T> = T & { __r3f?: Instance };

/**
 * Whether a 3D node takes 2D children on its screen layer: a scene, or any root node a renderer draws
 * as a scene
 * @param node - The 3D node
 */
const takesScreen = (node: Container3D): boolean => (node as { isScene?: boolean }).isScene === true || !node.parent;

/**
 * The screen layer of a scene: the pixi.js container its 2D elements are children of, drawn in CSS
 * pixels from the canvas's top-left corner, or `undefined` while the scene has none
 * @param scene - The scene
 * @internal
 */
export const screenOf = (scene: Container3D): Container | undefined => screens.get(scene);

/**
 * The scene a screen layer belongs to
 * @param screen - A container that may be a screen layer
 * @internal
 */
export const sceneOfScreen = (screen: Container): Container3D | undefined => screenScenes.get(screen);

/**
 * The 3D layer of a screen layer: the container that holds the scene's 3D view, and the 2D anchored to
 * 3D objects over it
 * @param screen - The screen layer
 * @internal
 */
export const layerOf = (screen: Container): Container | undefined => layers.get(screen);

/**
 * Whether a container is a screen layer's 3D layer, which stays where its screen layer put it
 * @param container - The container
 * @internal
 */
export const isLayer3D = (container: object): boolean => layerScreens.has(container as Container);

/**
 * The screen layer of a scene, made the first time it is asked for: a root's scene when the root is
 * created, any other scene when a 2D element first joins it. It sorts its children by zIndex. Its 3D
 * layer, at a zIndex just under 0, holds the scene's 3D view and the 2D anchored to the 3D. Both are
 * destroyed with the scene or by {@link releaseScreen}.
 * @param scene - The scene
 * @internal
 */
export function ensureScreen(scene: Container3D): Container {
  let screen = screens.get(scene);
  if (screen) return screen;
  screen = new Container({ label: 'screen', sortableChildren: true });
  const layer = new Container({ label: '3d', zIndex: VIEW_Z_INDEX, sortableChildren: true });
  screen.addChild(layer);
  screens.set(scene, screen);
  screenScenes.set(screen, scene);
  layers.set(screen, layer);
  layerScreens.set(layer, screen);
  scene.once('destroyed', () => releaseScreen(scene));
  return screen;
}

/**
 * Destroys a scene's screen layer and its 3D layer, leaving their children to the elements that made them
 * @param scene - The scene
 * @internal
 */
export function releaseScreen(scene: Container3D): void {
  const screen = screens.get(scene);
  if (!screen) return;
  screens.delete(scene);
  const layer = layers.get(screen);
  if (layer && !layer.destroyed) {
    layer.removeChildren();
    layer.destroy();
  }
  if (!screen.destroyed) screen.destroy();
}

/**
 * Logs a problem once per message, through pixi's `warn`
 * @param message - What went wrong
 * @internal
 */
export function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  warn(message);
}

/**
 * Where a child goes in a list so it keeps the order of its element among its siblings: before the
 * first sibling element after it whose object is already in the list
 * @param list - The children of the parent
 * @param child - The object being placed
 * @returns The index to insert at, counting the list without `child`, or -1 to append
 * @internal
 */
export function indexByElementOrder<T>(list: readonly T[], child: Linked<T>): number {
  const siblings = child.__r3f?.parent?.children;
  if (!siblings) return -1;
  let found = false;
  for (const sibling of siblings) {
    if (!found) {
      found = sibling.object === child;
      continue;
    }
    const index = list.indexOf(sibling.object as T);
    if (index === -1) continue;
    const current = list.indexOf(child);
    return current !== -1 && current < index ? index - 1 : index;
  }
  return -1;
}

/**
 * Adds a 2D child to a 2D container where its element is among its siblings, or moves it there. An
 * animated sprite joins its root's clock.
 * @param parent - The container
 * @param child - The child
 * @internal
 */
export function addInElementOrder(parent: Container, child: Linked<Container>): void {
  const index = indexByElementOrder(parent.children, child);
  if (index === -1) parent.addChild(child);
  else parent.addChildAt(child, index);
  if (child instanceof AnimatedSprite) driveOnRootClock(child);
}

/**
 * Adds a 2D object to a 3D node. A scene puts it on its screen layer, in the order of its element among
 * the scene's children. Any other 3D node anchors it: an `<anchor2D>` follows the node, and any other 2D
 * object is put in an anchor of its own that follows the node's origin. Anchors are drawn in the 3D
 * layer of the scene the node is in, over its 3D.
 * @param node - The 3D node
 * @param child - A 2D object
 * @internal
 */
export function addToScene(node: Container3D, child: Linked<object>): void {
  if (!(child instanceof Container)) {
    const name = `<${child.__r3f?.type ?? '2D element'}>`;
    warnOnce(`react-pixi-fiber: ${name} can only be inside a 2D element, so it is left out.`);
    return;
  }
  if (isLayer3D(child)) return;
  if (child instanceof Anchor2D) {
    child._host = node;
    if (takesScreen(node)) {
      const layer = layers.get(ensureScreen(node))!;
      if (child.parent !== layer) layer.addChild(child);
    } else if (child.parent && !isLayer3D(child.parent)) {
      child.parent.removeChild(child);
    }
    return;
  }
  if (!takesScreen(node)) {
    adoptIntoAnchor(node, child);
    if (child instanceof AnimatedSprite) driveOnRootClock(child);
    return;
  }
  addInElementOrder(ensureScreen(node), child);
}

/**
 * Takes a 2D object off a scene's screen layer, or out of the anchor that follows a 3D node
 * @param node - The 3D node it was added to
 * @param child - The 2D object
 * @internal
 */
export function removeFromScene(node: Container3D, child: object): void {
  if (!(child instanceof Container) || isLayer3D(child)) return;
  clearCursorsUnder(child);
  if (child instanceof Anchor2D) {
    if (child._host === node) child._host = null;
    child.parent?.removeChild(child);
    return;
  }
  if (releaseAnchor(node, child)) return;
  const screen = screens.get(node);
  if (screen && child.parent === screen) screen.removeChild(child);
}

/**
 * Whether an object is a 3D node, which a 2D container can't hold
 * @param object - A child r3f is adding
 * @internal
 */
export const isNode3D = (object: unknown): object is Container3D => object instanceof Container3D;

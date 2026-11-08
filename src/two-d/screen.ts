import { Container3D } from '@pixi/3d';
import { Container, warn } from 'pixi.js';

import type { Instance } from '../types/elements';

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
  'Put 3D elements directly in the <Canvas>, or inside other 3D elements.';

const screens = new WeakMap<Container3D, Container>();
const screenScenes = new WeakMap<Container, Container3D>();
const watchedChildren = new WeakSet<Container[]>();
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
 * The screen layer of a scene, made the first time it is asked for: a root's scene when the root is
 * created, any other scene when a 2D element first joins it. It sorts its children by zIndex, with the
 * scene's 3D view just under 0, and is destroyed with the scene or by {@link releaseScreen}.
 * @param scene - The scene
 * @internal
 */
export function ensureScreen(scene: Container3D): Container {
  let screen = screens.get(scene);
  if (screen) return screen;
  screen = new Container({ label: 'screen', sortableChildren: true });
  screens.set(scene, screen);
  screenScenes.set(screen, scene);
  watchChildOrder(screen);
  scene.once('destroyed', () => releaseScreen(scene));
  return screen;
}

/**
 * Destroys a scene's screen layer, leaving its children to the elements that made them
 * @param scene - The scene
 * @internal
 */
export function releaseScreen(scene: Container3D): void {
  const screen = screens.get(scene);
  if (!screen) return;
  screens.delete(scene);
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
 * Makes a container notice when r3f reorders its children by splicing `children` itself, as it does
 * when a keyed child moves: the container's render group rebuilds its draw order on the next frame.
 * pixi.js's own `addChildAt` and `removeChild` splice the same array and flag the same change.
 * @param container - A container elements are children of
 * @internal
 */
export function watchChildOrder(container: Container): void {
  const { children } = container;
  if (watchedChildren.has(children)) return;
  watchedChildren.add(children);
  Object.defineProperty(children, 'splice', {
    configurable: true,
    writable: true,
    value(this: Container[], ...args: Parameters<Container[]['splice']>) {
      const removed = Array.prototype.splice.apply(this, args);
      const renderGroup = container.renderGroup ?? container.parentRenderGroup;
      if (renderGroup) renderGroup.structureDidChange = true;
      if (container.sortableChildren) container.sortDirty = true;
      container._didContainerChangeTick++;
      return removed;
    },
  });
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
 * Adds a 2D child to a 2D container where its element is among its siblings, or moves it there
 * @param parent - The container
 * @param child - The child
 * @internal
 */
export function addInElementOrder(parent: Container, child: Linked<Container>): void {
  watchChildOrder(parent);
  const index = indexByElementOrder(parent.children, child);
  if (index === -1) parent.addChild(child);
  else parent.addChildAt(child, index);
}

/**
 * Adds a 2D object to a 3D node: a scene puts it on its screen layer, in the order of its element among
 * the scene's children. Under any other 3D node it is left out with a warning, since 3D objects can't
 * hold 2D yet.
 * @param node - The 3D node
 * @param child - A 2D object
 * @internal
 */
export function addToScene(node: Container3D, child: Linked<object>): void {
  const name = `<${child.__r3f?.type ?? '2D element'}>`;
  if (!(child instanceof Container)) {
    warnOnce(`react-pixi-fiber: ${name} can only be inside a 2D element, so it is left out.`);
    return;
  }
  if (!takesScreen(node)) {
    warnOnce(
      `react-pixi-fiber: ${name} is inside a 3D object, which can't hold 2D yet, so it is left out. ` +
        'Put 2D elements directly in the <Canvas>, or inside other 2D elements.',
    );
    return;
  }
  addInElementOrder(ensureScreen(node), child);
}

/**
 * Takes a 2D object off a scene's screen layer
 * @param node - The 3D node it was added to
 * @param child - The 2D object
 * @internal
 */
export function removeFromScene(node: Container3D, child: object): void {
  const screen = screens.get(node);
  if (screen && child instanceof Container && child.parent === screen) screen.removeChild(child);
}

/**
 * Whether an object is a 3D node, which a 2D container can't hold
 * @param object - A child r3f is adding
 * @internal
 */
export const isNode3D = (object: unknown): object is Container3D => object instanceof Container3D;

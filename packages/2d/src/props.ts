import type { Linked } from '@react-fiber/core/extension';
import { AnimatedSprite, Container, Graphics, GraphicsContext } from 'pixi.js';
import type { CacheAsTextureOptions, Filter, Mask, MaskOptionsAndMask, RenderLayer } from 'pixi.js';

/** The key of a filter attached to a slot of its parent's filters: `attach="filters-0"` */
const FILTER_SLOT = /^filters-(\d+)$/;

/** The filters an element gave each container, by slot, with the gaps a detached slot leaves */
const filterLists = new WeakMap<Container, (Filter | undefined)[]>();
/** The mask element each container holds as a child, so the mask is drawn in its space */
const adoptedMasks = new WeakMap<Container, Container>();

/**
 * Sets a container's filters to its list without the gaps, since pixi keeps a frozen copy
 * @param container - The container
 * @param list - Its filters by slot
 */
function applyFilters(container: Container, list: readonly (Filter | undefined)[]): void {
  container.filters = list.filter((filter): filter is Filter => filter !== undefined);
}

/**
 * The `filters` prop: one filter or a list, which `attach="filters-0"` children then write into
 * @param container - The container
 * @param value - The filters, or `null` for none
 */
function setFilters(container: Container, value: Filter | readonly Filter[] | null): void {
  if (!value) {
    filterLists.delete(container);
    container.filters = null;
    return;
  }
  const list: (Filter | undefined)[] = Array.isArray(value) ? value.slice() : [value as Filter];
  filterLists.set(container, list);
  applyFilters(container, list);
}

/**
 * A filter element's `attach="filters-N"`: puts it in slot N, or with `undefined` empties the slot
 * @param container - The container
 * @param slot - The slot
 * @param filter - The filter, or `undefined` on detach
 */
function setFilterSlot(container: Container, slot: number, filter: Filter | undefined): void {
  let list = filterLists.get(container);
  if (!list) filterLists.set(container, (list = container.filters ? [...container.filters] : []));
  list[slot] = filter;
  applyFilters(container, list);
}

/**
 * Whether a `mask` value is pixi's mask options, `setMask`'s argument, rather than a mask
 * @param value - What the `mask` prop got
 */
const isMaskOptions = (value: unknown): value is Partial<MaskOptionsAndMask> =>
  typeof value === 'object' && value !== null && !(value instanceof Container);

/**
 * The `mask` prop and `attach="mask"`: a mask, `null` or, on detach, `undefined` to clear it, or pixi's
 * mask options, which keep the current mask unless they name one. A mask element that has no parent,
 * as an attached one has none, becomes a child of what it masks, so it is drawn in that object's space.
 * @param container - The masked container
 * @param value - The mask, its options, or nothing
 */
function setMask(container: Container, value: unknown): void {
  if (isMaskOptions(value)) {
    container.setMask(value);
    return;
  }
  const adopted = adoptedMasks.get(container);
  if (adopted && adopted !== value) {
    adoptedMasks.delete(container);
    if (adopted.parent === container) container.removeChild(adopted);
  }
  if (value instanceof Container && !value.parent && (value as Linked<Container>).__r3f) {
    const { allowChildren } = container;
    container.allowChildren = true;
    container.addChild(value);
    container.allowChildren = allowChildren;
    adoptedMasks.set(container, value);
  }
  container.mask = (value ?? null) as Mask;
}

/**
 * The `parentRenderLayer` prop: attaches a container to a render layer, or with `null` detaches it
 * @param container - The container
 * @param layer - The layer
 */
function setRenderLayer(container: Container, layer: RenderLayer | null): void {
  if (layer === container.parentRenderLayer) return;
  if (layer) layer.attach(container);
  else container.parentRenderLayer?.detach(container);
}

/**
 * The `cacheAsTexture` prop: calls the method. The method itself, which r3f writes back when the prop
 * is removed, turns the cache off.
 * @param container - The container
 * @param value - Whether to cache, or the cache's options
 */
function setCacheAsTexture(
  container: Container,
  value: boolean | CacheAsTextureOptions | Container['cacheAsTexture'],
): void {
  const cache = typeof value === 'function' ? false : value;
  if (cache === false && !container.isCachedAsTexture) return;
  container.cacheAsTexture(cache);
}

/**
 * Writes what a 2D element's props and attaches mean beyond an assignment, through core's `applyProp`
 * hook, so no pixi.js class changes:
 *
 * - `filters` and `attach="filters-N"`: a list per container that a filter element writes into its slot
 *   of and empties on detach; the container's filters are the list without its gaps.
 * - `mask` and `attach="mask"`: a mask, cleared on detach, or pixi's mask options (`setMask`). A mask
 *   element with no parent becomes a child of what it masks.
 * - Methods that are props: `parentRenderLayer` (`layer.attach`, or `detach` with `null`),
 *   `cacheAsTexture`, and an animated sprite's `playing` (`play()` or `stop()`).
 * - `draw` on a graphics or a graphics context: clears it and calls the function with it.
 * @param object - The element's object, or the parent an element attaches to
 * @param key - The prop, or the child's `attach`
 * @param value - The value, the attached child, or `undefined` on detach
 * @returns Whether the key was written here; core writes any other
 * @internal
 */
export function applyProp2D(object: object, key: string, value: unknown): boolean {
  if (key === 'draw' && (object instanceof Graphics || object instanceof GraphicsContext)) {
    if (typeof value === 'function') {
      object.clear();
      (value as (target: Graphics | GraphicsContext) => void)(object);
    }
    return true;
  }
  if (object instanceof AnimatedSprite && key === 'playing') {
    if (value) object.play();
    else object.stop();
    return true;
  }
  if (!(object instanceof Container)) return false;
  switch (key) {
    case 'filters':
      setFilters(object, value as Filter | readonly Filter[] | null);
      return true;
    case 'mask':
      setMask(object, value);
      return true;
    case 'parentRenderLayer':
      setRenderLayer(object, value as RenderLayer | null);
      return true;
    case 'cacheAsTexture':
      setCacheAsTexture(object, value as boolean | CacheAsTextureOptions);
      return true;
  }
  const slot = FILTER_SLOT.exec(key);
  if (!slot) return false;
  setFilterSlot(object, Number(slot[1]), value as Filter | undefined);
  return true;
}

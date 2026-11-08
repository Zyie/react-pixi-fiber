import type { Container3D } from '@pixi/3d';
import {
  AnimatedSprite,
  Container,
  FederatedEvent,
  Filter,
  Graphics,
  GraphicsContext,
  Particle,
  ParticleContainer,
} from 'pixi.js';
import type { CacheAsTextureOptions, MaskOptionsAndMask, RenderLayer } from 'pixi.js';

import type { Intersection } from '../compat/Raycaster';
import { raycastScreen } from './hitTest';
import {
  THREE_IN_2D,
  addInElementOrder,
  addToScene,
  indexByElementOrder,
  isNode3D,
  screenOf,
  warnOnce,
} from './screen';
import type { Linked } from './screen';

/** What draws into a graphics or a context, as the `draw` prop */
type DrawCallback<T> = (target: T) => void;

/** A mutable list r3f writes `filters-0` into, kept per container, and the proxy that hands it out */
interface FilterList {
  readonly list: (Filter | undefined)[];
  readonly proxy: (Filter | undefined)[];
}

const drawCallbacks = new WeakMap<object, DrawCallback<never>>();
const filterLists = new WeakMap<Container, FilterList>();
const adoptedMasks = new WeakMap<Container, Container>();
const particleIds = new WeakMap<Particle, number>();
let nextParticleId = 0;
let installed = false;
let dispatchInstalled = false;

/**
 * A particle's id, given the first time r3f asks for its `uuid`, since particles have no `uid`
 * @param particle - The particle
 */
function particleId(particle: Particle): number {
  let id = particleIds.get(particle);
  if (id === undefined) particleIds.set(particle, (id = nextParticleId++));
  return id;
}

/**
 * Calls back with a container and every container under it
 * @param container - Where to start
 * @param callback - What to call
 */
function traverse(container: Container, callback: (object: Container) => void): void {
  callback(container);
  for (const child of container.children) traverse(child, callback);
}

/**
 * The descriptor of a property on a prototype or one of its ancestors
 * @param prototype - Where to start looking
 * @param key - The property
 */
function descriptorOf(prototype: object, key: string): PropertyDescriptor {
  for (let at: object | null = prototype; at; at = Object.getPrototypeOf(at) as object | null) {
    const descriptor = Object.getOwnPropertyDescriptor(at, key);
    if (descriptor) return descriptor;
  }
  throw new Error(`react-pixi-fiber: pixi.js has no ${key} to extend`);
}

/**
 * A list that calls back after every write or delete of an entry, as `attach="filters-0"` and its
 * detach make them
 * @param list - The list
 * @param onChange - What to call
 */
function listProxy<T>(list: T[], onChange: () => void): T[] {
  return new Proxy(list, {
    set(target, key, item: unknown) {
      (target as unknown as Record<PropertyKey, unknown>)[key] = item;
      onChange();
      return true;
    },
    deleteProperty(target, key) {
      delete (target as unknown as Record<PropertyKey, unknown>)[key];
      onChange();
      return true;
    },
  });
}

/**
 * Undoes r3f's insertion of a child before a sibling: r3f splices the child into its parent's
 * `children` and sets `parent` itself, then dispatches `{ type: 'added' }` on it. The child is taken
 * back out and added through the parent's own API, where its element is among its siblings. A 2D child
 * of a scene goes on the scene's screen layer, which keeps it as its child if it was there already.
 * @param child - The child r3f inserted
 * @param event - The plain event r3f dispatched
 */
function reinsert(child: Linked<Container>, event: { type: string }): void {
  const holder = child as { parent: Container | Container3D | null };
  const parent = holder.parent;
  if (event.type !== 'added' || !parent) return;
  const index = (parent.children as unknown[]).indexOf(child);
  if (index !== -1) parent.children.splice(index, 1);
  if (isNode3D(parent)) {
    const screen = screenOf(parent);
    holder.parent = screen?.children.includes(child) ? screen : null;
    addToScene(parent, child);
  } else {
    holder.parent = null;
    addInElementOrder(parent, child);
  }
}

/**
 * Adds a particle to a particle container where its element is among its siblings
 * @param container - The particle container
 * @param particle - The particle
 */
function addParticleInOrder(container: ParticleContainer, particle: Linked<Particle>): void {
  const particles = container.particleChildren;
  const current = particles.indexOf(particle);
  const index = indexByElementOrder(particles, particle);
  if (current !== -1) particles.splice(current, 1);
  if (index === -1) particles.push(particle);
  else particles.splice(index, 0, particle);
  container.update();
}

/**
 * Whether a `mask` value is pixi's mask options, `setMask`'s argument, rather than a mask
 * @param value - What the `mask` prop got
 */
const isMaskOptions = (value: unknown): value is Partial<MaskOptionsAndMask> =>
  typeof value === 'object' && value !== null && !(value instanceof Container);

/**
 * Runs a `draw` callback on a graphics or a context, after clearing it
 * @param target - The graphics or context
 * @param draw - The callback, or `undefined` to leave it as it is
 */
function runDraw<T extends Graphics | GraphicsContext>(target: T, draw: DrawCallback<T> | undefined): void {
  if (draw) drawCallbacks.set(target, draw);
  else drawCallbacks.delete(target);
  if (!draw) return;
  target.clear();
  draw(target);
}

/**
 * Gives pixi.js's 2D classes what r3f's core needs of an element's object, so 2D elements join the same
 * reconciler and event system as the 3D ones. Run once, when the first root loads the support.
 *
 * - Every `Container` answers r3f's duck typing: `isObject3D`, a `uuid`, `add` and `remove` (which keep
 *   children in the order of their elements), `traverse`,
 *   `traverseAncestors`, `dispose` (`destroy`) and `raycast`, which hit tests the screen layer with
 *   pixi's `EventBoundary`.
 * - `filters` hands out a list that `attach="filters-0"` can write into and r3f's detach can delete
 *   from; every change sets the container's filters to the list without its gaps.
 * - `mask` reads `null` when there is none, so a detached mask element clears it, and a mask element
 *   with no parent is added as a child of what it masks, which places it in that object's space. It
 *   also takes pixi's mask options, `setMask`'s argument (`{ mask, inverse: true }`); options without a
 *   `mask` keep the current one, such as a mask element attached as `attach="mask"`.
 * - `renderLayer` attaches a container to a `RenderLayer`, or detaches it with `null`.
 * - `cacheAsTexture` is a prop as well as a method: setting it calls the method.
 * - `AnimatedSprite`'s `playing` plays or stops it when set.
 * - `Graphics` and `GraphicsContext` take a `draw` prop: a callback that draws into them after they are
 *   cleared, run again whenever a new function is passed.
 * - `Particle` is a child r3f adds to a `ParticleContainer` and removes from it.
 * - `GraphicsContext` and `Filter` free themselves with `dispose`, as r3f calls it.
 * @internal
 */
export function install2DSurface(): void {
  if (installed) return;
  installed = true;
  const filters = descriptorOf(Container.prototype, 'filters');
  const mask = descriptorOf(Container.prototype, 'mask');
  const cacheAsTexture = descriptorOf(Container.prototype, 'cacheAsTexture').value as Container['cacheAsTexture'];
  const playing = descriptorOf(AnimatedSprite.prototype, 'playing');

  const applyFilters = (container: Container, list: readonly (Filter | undefined)[]): void => {
    filters.set!.call(
      container,
      list.filter((filter): filter is Filter => filter !== undefined),
    );
  };

  Object.defineProperties(Container.prototype, {
    isObject3D: { configurable: true, value: true },
    uuid: {
      configurable: true,
      get(this: Container) {
        return `pixi2d-${this.uid}`;
      },
    },
    add: {
      configurable: true,
      value(this: Container, ...objects: Linked<object>[]) {
        for (const object of objects) {
          if (object instanceof Particle) {
            if (this instanceof ParticleContainer) addParticleInOrder(this, object);
            else warnOnce('react-pixi-fiber: a <particle2D> must be inside a <particleContainer2D>.');
          } else if (object instanceof Container) addInElementOrder(this, object);
          else if (isNode3D(object)) warnOnce(THREE_IN_2D);
        }
        return this;
      },
    },
    remove: {
      configurable: true,
      value(this: Container, ...objects: object[]) {
        for (const object of objects) {
          if (object instanceof Particle && this instanceof ParticleContainer) this.removeParticle(object);
          else if (object instanceof Container && object.parent === this) this.removeChild(object);
        }
        return this;
      },
    },
    raycast: {
      configurable: true,
      writable: true,
      value(this: Container, _raycaster: unknown, intersects: Intersection[]) {
        raycastScreen(this, intersects);
        return false;
      },
    },
    updateWorldMatrix: { configurable: true, writable: true, value() {} },
    traverse: {
      configurable: true,
      writable: true,
      value(this: Container, callback: (object: Container) => void) {
        traverse(this, callback);
      },
    },
    traverseAncestors: {
      configurable: true,
      writable: true,
      value(this: Container, callback: (object: Container) => unknown) {
        for (let parent = this.parent; parent; parent = parent.parent) if (callback(parent) === false) return;
      },
    },
    dispose: {
      configurable: true,
      writable: true,
      value(this: Container) {
        if (!this.destroyed) this.destroy();
      },
    },
    filters: {
      configurable: true,
      get(this: Container) {
        return filterLists.get(this)?.proxy ?? filters.get!.call(this);
      },
      set(this: Container, value: Filter | readonly Filter[] | null | undefined) {
        if (value === null || value === undefined) {
          filterLists.delete(this);
          filters.set!.call(this, value);
          return;
        }
        const list: (Filter | undefined)[] = Array.isArray(value) ? value.slice() : [value as Filter];
        const proxy = listProxy(list, () => applyFilters(this, list));
        filterLists.set(this, { list, proxy });
        applyFilters(this, list);
      },
    },
    mask: {
      configurable: true,
      get(this: Container) {
        return (mask.get!.call(this) as Container | number | undefined) ?? null;
      },
      set(this: Linked<Container>, value: Linked<Container> | number | null | Partial<MaskOptionsAndMask>) {
        if (isMaskOptions(value)) {
          this.setMask(value);
          return;
        }
        const adopted = adoptedMasks.get(this);
        if (adopted && adopted !== value) {
          adoptedMasks.delete(this);
          if (adopted.parent === this) this.removeChild(adopted);
        }
        if (value instanceof Container && !value.parent && value.__r3f) {
          const allowChildren = this.allowChildren;
          this.allowChildren = true;
          this.addChild(value);
          this.allowChildren = allowChildren;
          adoptedMasks.set(this, value);
        }
        mask.set!.call(this, value);
      },
    },
    renderLayer: {
      configurable: true,
      get(this: Container) {
        return this.parentRenderLayer;
      },
      set(this: Container, layer: RenderLayer | null) {
        if (layer === this.parentRenderLayer) return;
        if (layer) layer.attach(this);
        else this.parentRenderLayer?.detach(this);
      },
    },
    cacheAsTexture: {
      configurable: true,
      get() {
        return cacheAsTexture;
      },
      set(this: Container, value: boolean | CacheAsTextureOptions | typeof cacheAsTexture) {
        const cache = typeof value === 'function' ? false : value;
        if (cache === false && !this.isCachedAsTexture) return;
        cacheAsTexture.call(this, cache);
      },
    },
  });

  Object.defineProperty(AnimatedSprite.prototype, 'playing', {
    configurable: true,
    get(this: AnimatedSprite) {
      return playing.get!.call(this) as boolean;
    },
    set(this: AnimatedSprite, value: boolean) {
      if (value) this.play();
      else this.stop();
    },
  });

  for (const Drawn of [Graphics, GraphicsContext]) {
    Object.defineProperty(Drawn.prototype, 'draw', {
      configurable: true,
      get(this: Graphics | GraphicsContext) {
        return drawCallbacks.get(this);
      },
      set(this: Graphics | GraphicsContext, draw: DrawCallback<Graphics | GraphicsContext> | undefined) {
        runDraw(this, draw);
      },
    });
  }

  Object.defineProperties(Particle.prototype, {
    isObject3D: { configurable: true, value: true },
    raycast: { configurable: true, writable: true, value: null },
    uuid: {
      configurable: true,
      get(this: Particle) {
        return `pixi2d-particle-${particleId(this)}`;
      },
    },
  });

  for (const Disposable of [GraphicsContext, Filter]) {
    Object.defineProperty(Disposable.prototype, 'dispose', {
      configurable: true,
      writable: true,
      value(this: { destroyed?: boolean; destroy(): void }) {
        if (!this.destroyed) this.destroy();
      },
    });
  }
}

/**
 * Lets r3f's plain `{ type: 'added' }` event, which it dispatches on a child it inserted before a
 * sibling, through pixi's `dispatchEvent`, which takes only federated events: the child is moved where
 * its element is. pixi.js mixes its event members into `Container` when its renderer loads them, which
 * would replace a `dispatchEvent` set earlier, so this runs once a root's renderer exists.
 * @internal
 */
export function install2DDispatch(): void {
  if (dispatchInstalled) return;
  dispatchInstalled = true;
  const federatedDispatch = descriptorOf(Container.prototype, 'dispatchEvent').value as Container['dispatchEvent'];
  Object.defineProperty(Container.prototype, 'dispatchEvent', {
    configurable: true,
    writable: true,
    value(this: Linked<Container>, event: FederatedEvent | { type: string }) {
      if (event instanceof FederatedEvent) return federatedDispatch.call(this, event);
      reinsert(this, event);
      return true;
    },
  });
}

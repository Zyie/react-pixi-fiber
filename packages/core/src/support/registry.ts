import { extensions } from 'pixi.js';
import type { ExtensionFormat, ExtensionType } from 'pixi.js';

import type { PixiRenderer } from '../renderer/PixiRenderer';
import type { DomEvent } from '../types/events';
import type { Registered } from '../types/register';
import type { RootState } from '../types/state';
import type { SceneHit } from './hooks';

/**
 * The extension types a package registers with pixi.js's `extensions` to plug into core, each read by
 * the renderer support every root loads:
 *
 * - `Objects`: {@link ObjectHooks}, the renderer hooks for the objects a package owns.
 * - `Catalog`: classes by the PascalCase name of their JSX element (`Sprite2D` is `<sprite2D>`), which
 *   `extensions.add` takes as `{ type, name, priority, ref }` with the classes as `ref`.
 * - `Classes`: the classes core builds its own objects from, by the names r3f's core reads (`Scene`,
 *   `PerspectiveCamera`, `OrthographicCamera`, `Raycaster`, `Vector2`, `Vector3`, `Frustum`): a
 *   root's default scene, camera and raycaster, a portal's, a `<View3D>`'s. They are not elements.
 *   Core registers its own, pixi-3d's with r3f's members, which a package can replace.
 * - `Support`: {@link SupportParts}, the renderer and render targets a package gives roots, and what it
 *   installs when the first root loads the support.
 *
 * Of two extensions of a type, the one with the higher `priority` wins: its hooks are asked first and
 * its classes and parts replace the other's of the same name.
 * @example
 * ```ts
 * import { extensions } from 'pixi.js';
 * import { FiberExtensionType } from '@react-fiber/core/extension';
 *
 * extensions.add({ type: FiberExtensionType.Catalog, name: 'my-package', ref: { Button2D: Button } });
 * ```
 * @category renderer
 * @advanced
 */
export const FiberExtensionType = {
  Objects: 'react-fiber-objects' as string as ExtensionType,
  Catalog: 'react-fiber-catalog' as string as ExtensionType,
  Classes: 'react-fiber-classes' as string as ExtensionType,
  Support: 'react-fiber-support' as string as ExtensionType,
} as const;

/**
 * The renderer hooks a package implements for the objects it owns. Core asks the hooks whose `test`
 * takes the object: the child for `add` and `remove`, the object itself for the rest. A hook a
 * package leaves out does what core does for an object no package owns: nothing, `false`, no attach,
 * no hits, and for `dispose` the object's own `dispose()`. Register them as the `ref` of an extension
 * of type {@link FiberExtensionType}`.Objects`.
 * @category renderer
 * @advanced
 */
export interface ObjectHooks {
  /**
   * Whether these hooks handle an object
   * @param object - An element's object
   */
  test(object: object): boolean;
  /**
   * Adds the object to a parent, or moves it, before `before` when given
   * @param parent - The parent's object
   * @param child - The object, which these hooks own
   * @param before - The sibling it goes before
   */
  add?(parent: object, child: object, before?: object): void;
  /**
   * Takes the object out of a parent
   * @param parent - The parent's object
   * @param child - The object, which these hooks own
   */
  remove?(parent: object, child: object): void;
  /**
   * Whether the object is in the scene graph, where its handlers are hit tested
   * @param object - The object
   */
  isInteractive?(object: object): boolean;
  /**
   * Where the object attaches on its parent when its element doesn't say
   * @param object - The object
   */
  defaultAttach?(object: object): string | undefined;
  /**
   * The hits of a pointer event on the object and its descendants
   * @param object - The object, which has handlers
   * @param event - The DOM event
   * @param state - The state of its root or portal
   */
  hitTest?(object: object, event: DomEvent, state: RootState): SceneHit[];
  /**
   * Frees the object once r3f has removed it
   * @param object - The object
   */
  dispose?(object: object): void;
}

/**
 * The parts of the renderer support a package gives roots. A root loads the support once, during its
 * first `configure()`; each part's `install` runs then, the first time, and the renderer and targets
 * of the highest priority package that gives them are the root's.
 * @category renderer
 * @advanced
 */
export interface SupportParts {
  /** The renderer r3f constructs, core's `PixiRenderer` or a subclass of it */
  Renderer?: typeof PixiRenderer;
  /** The target `useRenderTarget` makes */
  RenderTarget?: Registered<'RenderTarget'>;
  /** The cube target `<Environment>` makes for its children */
  CubeRenderTarget?: new (size: number, options?: object) => object;
  /** Runs once, when the first root loads the support: prototype patches, root extensions */
  install?(): void;
}

/** An extension's `ref`, kept with its priority */
interface Entry<T> {
  readonly priority: number;
  readonly ref: T;
}

/**
 * Keeps the extensions of a type in a list, highest priority first, and calls back on every change
 * @param type - The extension type
 * @param list - Where they are kept
 * @param changed - What to call after an extension joins or leaves
 */
function handleSorted<T>(type: ExtensionType, list: Entry<T>[], changed?: () => void): void {
  extensions.handle(
    type,
    ({ priority = 0, ref }: ExtensionFormat) => {
      if (list.some((entry) => entry.ref === ref)) return;
      list.push({ priority, ref: ref as T });
      list.sort((a, b) => b.priority - a.priority);
      changed?.();
    },
    ({ ref }: ExtensionFormat) => {
      const index = list.findIndex((entry) => entry.ref === ref);
      if (index === -1) return;
      list.splice(index, 1);
      changed?.();
    },
  );
}

/**
 * Every package's object hooks, highest priority first
 * @internal
 */
export const objectHooks: ObjectHooks[] = [];

const hooks: Entry<ObjectHooks>[] = [];
const catalogs: Entry<Record<string, unknown>>[] = [];
const classLists: Entry<Record<string, unknown>>[] = [];
const parts: Entry<SupportParts>[] = [];
const installed = new WeakSet<SupportParts>();

/**
 * The classes JSX names resolve to: every package's, a higher priority package's replacing a lower one's
 * of the same name. The object stays the same as packages join, so a root that loaded it sees them all.
 * @internal
 */
export const catalog: Record<string, unknown> = {};

handleSorted(FiberExtensionType.Objects, hooks, () => {
  objectHooks.length = 0;
  for (const { ref } of hooks) objectHooks.push(ref);
});
/**
 * The classes core builds its own objects from, r3f's `support.three`: every package's, a higher
 * priority package's replacing a lower one's of the same name, in one object that stays the same
 * @internal
 */
export const classes: Record<string, unknown> = {};

/**
 * Keeps an object the merge of a list of class records, the lowest priority first
 * @param target - The object
 * @param list - The records, highest priority first
 */
function merge(target: Record<string, unknown>, list: readonly Entry<Record<string, unknown>>[]): void {
  for (const key of Object.keys(target)) delete target[key];
  for (let i = list.length - 1; i >= 0; i--) Object.assign(target, list[i].ref);
}

handleSorted(FiberExtensionType.Catalog, catalogs, () => merge(catalog, catalogs));
handleSorted(FiberExtensionType.Classes, classLists, () => merge(classes, classLists));
handleSorted(FiberExtensionType.Support, parts);

/**
 * The hooks of the highest priority package whose `test` takes an object
 * @param object - An element's object
 * @internal
 */
export function hooksOf(object: object): ObjectHooks | undefined {
  for (let i = 0; i < objectHooks.length; i++) if (objectHooks[i].test(object)) return objectHooks[i];
  return undefined;
}

/**
 * A part of the support, from the highest priority package that gives it
 * @param key - The part
 * @internal
 */
export function supportPart<K extends keyof SupportParts>(key: K): SupportParts[K] | undefined {
  return parts.find((entry) => entry.ref[key] !== undefined)?.ref[key];
}

/**
 * Runs every package's `install`, once each, lowest priority first
 * @internal
 */
export function installParts(): void {
  for (let i = parts.length - 1; i >= 0; i--) {
    const { ref } = parts[i];
    if (installed.has(ref)) continue;
    installed.add(ref);
    ref.install?.();
  }
}

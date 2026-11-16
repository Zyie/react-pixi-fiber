import '@pixi/3d';
import * as pixi from 'pixi.js';
import 'pixi.js/browser';

/**
 * The own property descriptors of each prototype, by key
 * @internal
 */
export type Descriptors = Map<PropertyKey, PropertyDescriptor>;

/**
 * The own property descriptors of the prototype of every export of pixi.js that has one, by export
 * name. The frame loads this module first, with what changes pixi.js's prototypes before any package
 * of ours runs: pixi.js's browser extensions, which its first renderer loads (events and accessibility
 * on `Container`), and @pixi/3d, which extends pixi.js's pointer events.
 * @internal
 */
export function describePrototypes(): Map<string, Descriptors> {
  const prototypes = new Map<string, Descriptors>();
  for (const [name, value] of Object.entries(pixi)) {
    if (typeof value !== 'function' || typeof value.prototype !== 'object' || value.prototype === null) continue;
    const prototype = value.prototype as object;
    const descriptors: Descriptors = new Map();
    for (const key of Reflect.ownKeys(prototype))
      descriptors.set(key, Object.getOwnPropertyDescriptor(prototype, key)!);
    prototypes.set(name, descriptors);
  }
  return prototypes;
}

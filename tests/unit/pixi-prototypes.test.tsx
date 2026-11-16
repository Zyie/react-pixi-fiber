import { expect, it } from 'vitest';

import type { Descriptors, describePrototypes } from './pixi-prototypes/describe';
import type { renderEvery2DFeature } from './pixi-prototypes/render';

/** The window of a frame, which loads a module of this folder into its own realm */
interface Realm {
  eval(source: string): Promise<unknown>;
  /**
   * Vitest's browser runner, which every dynamic import in a served module calls. A frame has none, so
   * it gets what vitest gives a worker: a plain call.
   */
  __vitest_browser_runner__: { wrapDynamicImport(load: () => Promise<unknown>): Promise<unknown> };
}

/**
 * Whether two descriptors are the same property: the same value or accessors, and the same flags
 * @param a - A descriptor
 * @param b - Another
 */
const isSame = (a: PropertyDescriptor, b: PropertyDescriptor): boolean =>
  a.value === b.value &&
  a.get === b.get &&
  a.set === b.set &&
  a.writable === b.writable &&
  a.enumerable === b.enumerable &&
  a.configurable === b.configurable;

/**
 * Each own property of a prototype that was added, removed or changed, as `Class.prototype.key`
 * @param before - The prototypes before
 * @param after - The prototypes after
 */
function changesBetween(before: Map<string, Descriptors>, after: Map<string, Descriptors>): string[] {
  const changed: string[] = [];
  for (const [name, descriptors] of after) {
    const previous = before.get(name)!;
    for (const [key, descriptor] of descriptors) {
      const old = previous.get(key);
      if (!old) changed.push(`${name}.prototype.${String(key)} added`);
      else if (!isSame(old, descriptor)) changed.push(`${name}.prototype.${String(key)} changed`);
    }
    for (const key of previous.keys())
      if (!descriptors.has(key)) changed.push(`${name}.prototype.${String(key)} removed`);
  }
  return changed;
}

// A changed prototype shows in no picture. The test files share a page, where another has likely
// imported the packages already, so this runs in a frame, whose pixi.js is a module of its own: the frame
// describes pixi.js's prototypes, then imports the packages, renders with them and describes them again.
it("leaves every prototype of pixi.js's classes as it was through importing and rendering @react-fiber/2d and @react-fiber/3d", async () => {
  const frame = document.body.appendChild(document.createElement('iframe'));
  const realm = frame.contentWindow as unknown as Realm;
  realm.__vitest_browser_runner__ = { wrapDynamicImport: (load) => load() };
  const load = <T,>(path: string): Promise<T> =>
    realm.eval(`import(${JSON.stringify(new URL(path, import.meta.url).href)})`) as Promise<T>;
  try {
    const pixi = await load<{ describePrototypes: typeof describePrototypes }>('./pixi-prototypes/describe.ts');
    const before = pixi.describePrototypes();
    const app = await load<{ renderEvery2DFeature: typeof renderEvery2DFeature }>('./pixi-prototypes/render.tsx');
    const clicks = await app.renderEvery2DFeature();

    expect(before.size).toBeGreaterThan(100);
    expect(clicks).toBe(1);
    expect(changesBetween(before, pixi.describePrototypes())).toEqual([]);
  } finally {
    frame.remove();
  }
});

import type { Container3D } from '@pixi/3d';
import type { Container } from 'pixi.js';

/**
 * An object whose `cursor` a canvas shows: a 2D element or a 3D node
 * @internal
 */
export type CursorSource = Container | Container3D;

/** The object whose `cursor` each canvas shows, by the function that clears that canvas's cursor */
const shown = new Map<() => void, CursorSource>();

/**
 * Records which object's `cursor` a canvas shows, or that it shows none
 * @param clear - Clears the canvas's cursor; it stands for the canvas
 * @param source - The object, or `null`
 * @internal
 */
export function showCursorOf(clear: () => void, source: CursorSource | null): void {
  if (source) shown.set(clear, source);
  else shown.delete(clear);
}

/**
 * Clears the cursor of every canvas that shows the cursor of an object being taken out of the tree, or of
 * one under it, as pixi's own event system does on its next tick
 * @param removed - The object taken out, a 2D element or a 3D node
 * @category renderer
 * @advanced
 */
export function clearCursorsUnder(removed: Container | Container3D): void {
  if (shown.size === 0) return;
  for (const [clear, source] of shown) {
    for (let node: CursorSource | null = source; node; node = node.parent as CursorSource | null) {
      if (node === removed) {
        clear();
        break;
      }
    }
  }
}

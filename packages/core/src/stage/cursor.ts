import type { Container } from 'pixi.js';

/** The 2D object whose `cursor` each canvas shows, by the function that clears that canvas's cursor */
const shown = new Map<() => void, Container>();

/**
 * Records which 2D object's `cursor` a canvas shows, or that it shows none
 * @param clear - Clears the canvas's cursor; it stands for the canvas
 * @param source - The object, or `null`
 * @internal
 */
export function showCursorOf(clear: () => void, source: Container | null): void {
  if (source) shown.set(clear, source);
  else shown.delete(clear);
}

/**
 * Clears the cursor of every canvas that shows the cursor of a 2D object being taken out of the tree, or
 * of one under it, as pixi's own event system does on its next tick
 * @param removed - The object taken out
 * @category renderer
 * @advanced
 */
export function clearCursorsUnder(removed: Container): void {
  if (shown.size === 0) return;
  for (const [clear, source] of shown) {
    for (let node: Container | null = source; node; node = node.parent) {
      if (node === removed) {
        clear();
        break;
      }
    }
  }
}

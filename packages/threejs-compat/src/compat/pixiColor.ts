import { Color } from 'pixi.js';
import type { ColorSource } from 'pixi.js';

import { toDisplayColor } from '../math/Color';
import type { Color as ThreeColor } from '../math/Color';

let installed = false;

/**
 * Whether a colour is a three `Color`, rather than one of pixi's
 * @param value - The colour
 */
const isThreeColor = (value: unknown): value is ThreeColor =>
  typeof value === 'object' && value !== null && (value as { isColor?: unknown }).isColor === true;

/**
 * Lets pixi's `Color` take a three `Color`, in sRGB, so every 2D colour prop (`tint`, a fill, a
 * filter's colour) takes what a material's `color` takes. Run once, when the first root loads the
 * support.
 * @internal
 */
export function installPixiColor(): void {
  if (installed) return;
  installed = true;
  const value = Object.getOwnPropertyDescriptor(Color.prototype, 'value')!;
  Object.defineProperty(Color.prototype, 'value', {
    configurable: true,
    get(this: Color) {
      return value.get!.call(this) as Color['value'];
    },
    set(this: Color, color: ColorSource | ThreeColor | null) {
      value.set!.call(this, isThreeColor(color) ? toDisplayColor(color) : color);
    },
  });
}

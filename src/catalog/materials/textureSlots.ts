import type { BaseMaterial3D } from '@pixi/3d';
import { Texture } from 'pixi.js';

import { Vector2 } from '../../math/Vector2';

/**
 * A texture slot as three's map field: `null` when the slot holds its default
 * @param material - The material
 * @param slot - pixi-3d's slot name
 * @param empty - What the slot holds when no map is set
 * @internal
 */
export function readSlot(material: BaseMaterial3D, slot: string, empty: Texture = Texture.WHITE): Texture | null {
  const texture = (material.textures as Record<string, Texture | undefined>)[slot];
  return !texture || texture === empty ? null : texture;
}

/**
 * Sets a texture slot from three's map field, putting the default back for `null`
 * @param material - The material
 * @param slot - pixi-3d's slot name
 * @param value - The map, or `null`
 * @param empty - What the slot holds when no map is set
 * @internal
 */
export function writeSlot(
  material: BaseMaterial3D,
  slot: string,
  value: Texture | null | undefined,
  empty: Texture = Texture.WHITE,
): void {
  (material.textures as Record<string, Texture>)[slot] = value ?? empty;
}

/**
 * A three `Vector2` that calls back whenever a component is written, through any of its methods, for
 * fields such as `normalScale` that r3f and three code change in place
 * @param x - Starting x
 * @param y - Starting y
 * @param onChange - Called after each write
 * @internal
 */
export function observedVector2(x: number, y: number, onChange: (vector: Vector2) => void): Vector2 {
  const vector = new Vector2(x, y);
  let vx = x;
  let vy = y;
  Object.defineProperties(vector, {
    x: {
      configurable: true,
      enumerable: true,
      get: () => vx,
      set: (value: number) => {
        vx = value;
        onChange(vector);
      },
    },
    y: {
      configurable: true,
      enumerable: true,
      get: () => vy,
      set: (value: number) => {
        vy = value;
        onChange(vector);
      },
    },
  });
  return vector;
}

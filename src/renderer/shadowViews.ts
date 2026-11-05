import type { View3D } from '@pixi/3d';

const enabled = new WeakSet<View3D>();

/**
 * Records whether a view's renderer has three's `shadowMap.enabled` on
 * @param view - The view
 * @param on - The renderer's `shadowMap.enabled`
 * @internal
 */
export function setShadowsEnabled(view: View3D, on: boolean): void {
  if (on) enabled.add(view);
  else enabled.delete(view);
}

/**
 * Whether the renderer drawing a view has shadows on; three draws no shadows at all until
 * `shadowMap.enabled` is set, whatever each light's `castShadow` says
 * @param view - The view, or `null` for a node outside any view
 * @internal
 */
export function areShadowsEnabled(view: View3D | null): boolean {
  return view !== null && enabled.has(view);
}

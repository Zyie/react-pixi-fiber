import type { View3D } from '@pixi/3d';
import { AlphaFilter } from 'pixi.js';
import type { Filter } from 'pixi.js';

const fades = new WeakMap<View3D, AlphaFilter>();

/**
 * Fades a view by the alpha of the 2D it is in. pixi-3d draws a view's meshes with their own shaders,
 * which leave out the alpha pixi gives a 2D object, so a view whose `alpha` or ancestors' alpha is under
 * 1 is drawn through an `AlphaFilter` of its own, at the target's resolution and antialiasing, and
 * fades as one picture. At 1 the filter comes off, so an opaque view costs no extra pass.
 * @param view - The view, before it draws
 * @internal
 */
export function applyViewAlpha(view: View3D): void {
  const alpha = view.getGlobalAlpha(false);
  let filter = fades.get(view);
  if (alpha >= 1) {
    if (filter?.enabled) {
      filter.enabled = false;
      view.filters = withoutFilter(view.filters, filter);
    }
    return;
  }
  if (!filter) {
    filter = new AlphaFilter({ alpha, resolution: 'inherit', antialias: 'inherit' });
    filter.enabled = false;
    fades.set(view, filter);
  }
  if (!filter.enabled) {
    filter.enabled = true;
    view.filters = [...(view.filters ?? []), filter];
  }
  filter.alpha = alpha;
}

/**
 * Frees the filter {@link applyViewAlpha} made for a view, taking it off the view when the view is alive
 * @param view - The view
 * @internal
 */
export function releaseViewAlpha(view: View3D): void {
  const filter = fades.get(view);
  if (!filter) return;
  fades.delete(view);
  if (!view.destroyed && filter.enabled) view.filters = withoutFilter(view.filters, filter);
  filter.destroy();
}

/** A filter list without one filter, or `null` when nothing is left */
function withoutFilter(filters: readonly Filter[] | undefined, filter: Filter): Filter[] | null {
  const rest = filters?.filter((each) => each !== filter) ?? [];
  return rest.length > 0 ? rest : null;
}

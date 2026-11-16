/**
 * Where a hit is drawn on its screen layer, front to back: 2D drawn over the scene's 3D
 * @internal
 */
export const OVER_3D = 0;
/**
 * Where a hit is drawn on its screen layer, front to back: the scene's 3D
 * @internal
 */
export const IN_3D = 1;
/**
 * Where a hit is drawn on its screen layer, front to back: 2D drawn under the scene's 3D
 * @internal
 */
export const UNDER_3D = 2;

/**
 * A hit's place in what is drawn: pairs of a band (`OVER_3D`, `IN_3D`, `UNDER_3D`) and a place in
 * it (a 2D object's place from the front, a 3D hit's distance), outermost first. A layer drawn inside
 * another (a `<View3D>`, a `<RenderTexture2D>`) starts with the order of what holds it.
 */
export type DrawOrder = readonly number[];

const NO_LAYER: DrawOrder = [];
const orders = new WeakMap<object, DrawOrder>();
const layers = new WeakMap<object, DrawOrder>();

/**
 * The draw order a portal's hits start with: that of the 2D entry or the 3D hit the portal is drawn
 * at, or none for a root and any portal drawn over the whole canvas
 * @param raycaster - The portal's raycaster
 * @internal
 */
export const layerOrderOf = (raycaster: object): DrawOrder => layers.get(raycaster) ?? NO_LAYER;

/**
 * Places a portal's hits inside what it is drawn at: a `<View3D>`'s 2D entry, or the 3D hit a
 * `<RenderTexture2D>`'s texture is on
 * @param raycaster - The portal's raycaster
 * @param order - The draw order of what holds it
 * @internal
 */
export function setLayerOrder(raycaster: object, order: DrawOrder): void {
  layers.set(raycaster, order);
}

/**
 * The draw order of a hit in a layer
 * @param layer - The layer's own order, from {@link layerOrderOf}
 * @param band - `OVER_3D`, `IN_3D` or `UNDER_3D`
 * @param place - Its place in the band: a 2D object's place from the front, a 3D hit's distance
 * @internal
 */
export const drawOrder = (layer: DrawOrder, band: number, place: number): DrawOrder => [...layer, band, place];

/**
 * Records where a hit is drawn, for {@link compareHits}
 * @param hit - The hit
 * @param order - Its draw order
 * @internal
 */
export function setHitOrder(hit: object, order: DrawOrder): void {
  orders.set(hit, order);
}

/**
 * Orders two hits as they are drawn, front first: by band and place, outermost layer first. A hit
 * inside a layer comes before the hit of what holds it, as a child's event comes before its parent's,
 * so a `<View3D>`'s 3D and 2D are hit before the view, and a `<RenderTexture2D>`'s 2D just before
 * the 3D hit its texture is on.
 * @param a - A hit
 * @param b - Another
 * @internal
 */
export function compareHits(a: object, b: object): number {
  const orderA = orders.get(a) ?? NO_LAYER;
  const orderB = orders.get(b) ?? NO_LAYER;
  const shared = Math.min(orderA.length, orderB.length);
  for (let i = 0; i < shared; i++) if (orderA[i] !== orderB[i]) return orderA[i] - orderB[i];
  return orderB.length - orderA.length;
}

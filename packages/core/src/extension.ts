/**
 * `@react-fiber/core/extension`: what the packages that build on core plug in with, not app code
 *
 * The registry (`FiberExtensionType` and the shapes registered under it), the stage a package's
 * objects join (the screen layer, element order, hit testing and draw order), and the renderer parts a
 * 3D package extends. `@react-fiber/2d`, `@react-fiber/3d` and `@react-fiber/threejs-compat` use it;
 * apps import from `@react-fiber/core`.
 */
export { FiberExtensionType, type ObjectHooks, type SupportParts } from './support/registry';
export type { RenderedScene, ViewSettings } from './renderer/PixiRenderer';
export { indexUnderView, updateBackdrop } from './renderer/backdrop';
export { program } from './renderer/programs';
export { markMaterialTexture } from './renderer/materialTextures';
export { cameraProjection, cameraProjectionInverse, cameraWorld, cameraWorldInverse } from './renderer/cameraMatrices';
export {
  THREE_IN_2D,
  addInElementOrder,
  addToScene,
  indexByElementOrder,
  isLayer3D,
  isNode3D,
  removeFromScene,
  warnOnce,
  type Linked,
} from './stage/screen';
export { clearCursorsUnder } from './stage/cursor';
export { hitTestScreen, noteCast } from './stage/hitTest';
export { IN_3D, drawOrder, layerOrderOf, setHitOrder, type DrawOrder } from './events/hitOrder';

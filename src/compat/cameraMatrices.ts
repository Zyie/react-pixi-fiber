import { Matrix4 } from '@pixi/3d';
import type { Camera3D } from '@pixi/3d';

/**
 * three's camera matrices, worked out from a pixi-3d camera's settings and transform
 * @internal
 */
export interface CameraMatrices {
  /** Camera space to clip space, `camera.projectionMatrix` in three */
  readonly projection: Matrix4;
  /** Clip space to camera space, `camera.projectionMatrixInverse` in three */
  readonly projectionInverse: Matrix4;
  /** Camera space to world space, `camera.matrixWorld` in three */
  readonly world: Matrix4;
  /** World space to camera space, `camera.matrixWorldInverse` in three */
  readonly worldInverse: Matrix4;
}

const cache = new WeakMap<Camera3D, CameraMatrices>();

/**
 * The aspect a camera projects with: three's `aspect` field when r3f keeps one on the camera, else
 * the size of the view drawing it, else square
 * @param camera - The camera to read
 * @internal
 */
export function cameraAspect(camera: Camera3D): number {
  const own = (camera as Camera3D & { aspect?: number }).aspect;
  if (typeof own === 'number' && own > 0 && Number.isFinite(own)) return own;
  const view = camera.view3d;
  return view && view.height > 0 ? view.width / view.height : 1;
}

/**
 * Builds a camera's projection and world matrices now, from its settings and transform
 *
 * pixi-3d fills `camera.projection` and `camera.view` while it draws, so outside a render they are a
 * frame old, and identity before the first one. r3f reads the matrices between frames (frustum
 * checks, picking, `unproject`), so they are worked out here from `computeProjection` and the
 * camera's global transform instead. The matrices are reused per camera and overwritten on every call.
 * @param camera - The camera to read
 * @internal
 */
export function updateCameraMatrices(camera: Camera3D): CameraMatrices {
  let matrices = cache.get(camera);
  if (!matrices) {
    matrices = {
      projection: new Matrix4(),
      projectionInverse: new Matrix4(),
      world: new Matrix4(),
      worldInverse: new Matrix4(),
    };
    cache.set(camera, matrices);
  }
  camera.computeProjection(cameraAspect(camera), matrices.projection);
  matrices.projectionInverse.getInverse(matrices.projection);
  camera.getGlobalTransform(matrices.world);
  matrices.worldInverse.getInverse(matrices.world);
  return matrices;
}

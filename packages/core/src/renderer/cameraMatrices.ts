import { Matrix4 } from '@pixi/3d';
import type { Camera3D } from '@pixi/3d';

/**
 * three's camera matrices for one camera, reused and overwritten on every read
 *
 * pixi-3d fills `camera.projection` and `camera.view` while it draws, so outside a render they are a
 * frame old, and identity before the first one. r3f reads the matrices between frames (frustum
 * checks, picking, `unproject`), so each function below works its matrix out when called, from
 * `computeProjection` and the camera's global transform.
 */
interface CameraMatrices {
  readonly projection: Matrix4;
  readonly projectionInverse: Matrix4;
  readonly world: Matrix4;
  readonly worldInverse: Matrix4;
}

const cache = new WeakMap<Camera3D, CameraMatrices>();

const matricesOf = (camera: Camera3D): CameraMatrices => {
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
  return matrices;
};

/**
 * The aspect a camera projects with: three's `aspect` field when r3f keeps one on the camera, else
 * the size of the view drawing it, else square
 * @param camera - The camera to read
 * @category renderer
 * @advanced
 */
export function cameraAspect(camera: Camera3D): number {
  const own = (camera as Camera3D & { aspect?: number }).aspect;
  if (typeof own === 'number' && own > 0 && Number.isFinite(own)) return own;
  const view = camera.view3d;
  return view && view.height > 0 ? view.width / view.height : 1;
}

/**
 * Camera space to clip space, three's `camera.projectionMatrix`, worked out now
 * @param camera - The camera to read
 * @category renderer
 * @advanced
 */
export function cameraProjection(camera: Camera3D): Matrix4 {
  return camera.computeProjection(cameraAspect(camera), matricesOf(camera).projection);
}

/**
 * Clip space to camera space, three's `camera.projectionMatrixInverse`, worked out now
 * @param camera - The camera to read
 * @category renderer
 * @advanced
 */
export function cameraProjectionInverse(camera: Camera3D): Matrix4 {
  return matricesOf(camera).projectionInverse.getInverse(cameraProjection(camera));
}

/**
 * Camera space to world space, three's `camera.matrixWorld`, worked out now
 * @param camera - The camera to read
 * @category renderer
 * @advanced
 */
export function cameraWorld(camera: Camera3D): Matrix4 {
  return camera.getGlobalTransform(matricesOf(camera).world);
}

/**
 * World space to camera space, three's `camera.matrixWorldInverse`, worked out now
 * @param camera - The camera to read
 * @category renderer
 * @advanced
 */
export function cameraWorldInverse(camera: Camera3D): Matrix4 {
  return matricesOf(camera).worldInverse.getInverse(cameraWorld(camera));
}

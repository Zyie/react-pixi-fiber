import type { Matrix4 } from '@pixi/3d';

/**
 * three's camera `view`: the part of a larger image a camera draws, set with `setViewOffset`
 * @internal
 */
export interface CameraView {
  /** Whether the offset applies */
  enabled: boolean;
  /** Width of the whole image */
  fullWidth: number;
  /** Height of the whole image */
  fullHeight: number;
  /** Left edge of this camera's part */
  offsetX: number;
  /** Top edge of this camera's part */
  offsetY: number;
  /** Width of this camera's part */
  width: number;
  /** Height of this camera's part */
  height: number;
}

/**
 * Sets a camera's view offset, as three's `setViewOffset`
 * @param view - The camera's view, or `null` before its first offset
 * @param fullWidth - Width of the whole image
 * @param fullHeight - Height of the whole image
 * @param x - Left edge of the part
 * @param y - Top edge of the part
 * @param width - Width of the part
 * @param height - Height of the part
 * @returns The view, made when there was none
 * @internal
 */
export function setViewOffset(
  view: CameraView | null,
  fullWidth: number,
  fullHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
): CameraView {
  const next = view ?? { enabled: true, fullWidth: 1, fullHeight: 1, offsetX: 0, offsetY: 0, width: 1, height: 1 };
  next.enabled = true;
  next.fullWidth = fullWidth;
  next.fullHeight = fullHeight;
  next.offsetX = x;
  next.offsetY = y;
  next.width = width;
  next.height = height;
  return next;
}

/**
 * Writes an off-centre perspective projection, three's `makePerspective(left, right, top, bottom,
 * near, far)` in WebGL's depth range, which pixi-3d's projections use
 * @param out - Receives the projection
 * @param left - Left edge of the near plane
 * @param right - Right edge of the near plane
 * @param top - Top edge of the near plane
 * @param bottom - Bottom edge of the near plane
 * @param near - Near clipping distance
 * @param far - Far clipping distance
 * @returns `out`
 * @internal
 */
export function writeFrustum(
  out: Matrix4,
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number,
): Matrix4 {
  const te = out.elements;
  te[0] = (2 * near) / (right - left);
  te[1] = 0;
  te[2] = 0;
  te[3] = 0;
  te[4] = 0;
  te[5] = (2 * near) / (top - bottom);
  te[6] = 0;
  te[7] = 0;
  te[8] = (right + left) / (right - left);
  te[9] = (top + bottom) / (top - bottom);
  te[10] = -(far + near) / (far - near);
  te[11] = -1;
  te[12] = 0;
  te[13] = 0;
  te[14] = (-2 * far * near) / (far - near);
  te[15] = 0;
  return out;
}

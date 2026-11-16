import { Matrix4, Vector3 } from '@pixi/3d';
import type { Container3D, Light as PixiLight, LightShadow as PixiLightShadow, PointData3D } from '@pixi/3d';

import type { LightShadow } from './LightShadow';
import { LightTarget } from './LightTarget';

const lightPosition = new Vector3();
const targetPosition = new Vector3();
const lightWorld = new Matrix4();

/**
 * What the renderer calls on a catalog light around each draw of its view
 * @internal
 */
export interface RenderedLight {
  /** Gets the light ready for pixi-3d: aimed at its target, with pixi-3d's shadow settings in place */
  _prepareRender(): void;
  /** Puts back what `_prepareRender` swapped in */
  _finishRender(): void;
}

/**
 * Whether a light takes the renderer's hooks
 * @param light - A light in a view
 * @internal
 */
export const isRenderedLight = (light: PixiLight): light is PixiLight & RenderedLight =>
  typeof (light as Partial<RenderedLight>)._prepareRender === 'function';

/**
 * Turns a light that shines along its local -Z toward its target, as three aims directional and spot
 * lights: at the target's world position while it is in a view, and otherwise where three's stale
 * `matrixWorld` would put it, which is the origin until the target's `updateMatrixWorld()` is called
 * @param light - The light
 * @param target - What it shines at
 * @internal
 */
export function aimAtTarget(
  light: Pick<Container3D, 'getGlobalPosition'> & { lookAt(target: PointData3D): void },
  target: Container3D,
): void {
  light.getGlobalPosition(lightPosition);
  if (target.view3d) target.getGlobalPosition(targetPosition);
  else if (target instanceof LightTarget) targetPosition.copyFrom(target.lastWorldPosition);
  else targetPosition.set(0, 0, 0);
  if (lightPosition.distanceToSquared(targetPosition) === 0) return;
  light.lookAt(targetPosition);
}

/**
 * Hands pixi-3d the shadow settings it reads while it draws, built from a light's three shadow
 * @param light - The light, already aimed
 * @param shadow - Its three shadow
 * @internal
 */
export function swapInPixiShadow(
  light: Pick<Container3D, 'getGlobalTransform'> & { shadow: PixiLightShadow },
  shadow: LightShadow,
): void {
  light.shadow = shadow._toPixi(light.getGlobalTransform(lightWorld));
}

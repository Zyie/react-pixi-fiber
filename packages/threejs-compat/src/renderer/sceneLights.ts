import type { Container3D, Hemisphere, ShadowQuality, View3D } from '@pixi/3d';

import { HemisphereLight } from '../catalog/lights/HemisphereLight';
import type { LightShadow } from '../catalog/lights/LightShadow';
import { isRenderedLight } from '../catalog/lights/renderHooks';

const QUALITY_BY_SIZE: readonly (readonly [number, ShadowQuality])[] = [
  [512, 'low'],
  [1024, 'medium'],
  [2048, 'high'],
];

/** The hemisphere each view's environment holds because of a hemisphere light */
const lightEnvironments = new WeakMap<View3D, Hemisphere>();

/**
 * The smallest pixi-3d shadow quality whose map is at least `size` texels across
 * @param size - The largest `shadow.mapSize` a light in the view asks for
 */
const qualityFor = (size: number): ShadowQuality => {
  for (const [texels, quality] of QUALITY_BY_SIZE) if (size <= texels) return quality;
  return 'ultra';
};

/**
 * Gets a view's lights ready for a frame: aims directional and spot lights at their targets and
 * hands pixi-3d their shadow settings, sizes the view's shadow maps to the largest `shadow.mapSize`
 * a casting light asks for, and makes the first visible hemisphere light the view's environment
 * unless the scene has an `environment` of its own
 * @param view - The view about to draw
 * @param scene - Its scene
 * @internal
 */
export function prepareLights(view: View3D, scene: Container3D): void {
  let hemisphere: Hemisphere | null = null;
  let mapSize = 0;

  for (const light of view.lights) {
    if (isRenderedLight(light)) light._prepareRender();
    if (light.canCastShadow) {
      const size = (light.shadow as Partial<LightShadow>).mapSize;
      if (size) mapSize = Math.max(mapSize, size.x, size.y);
    } else if (!hemisphere && light instanceof HemisphereLight && light.worldVisible) {
      hemisphere = light._toHemisphere();
    }
  }

  if (mapSize > 0) view.shadowQuality = qualityFor(mapSize);

  const sceneEnvironment = (scene as Container3D & { environment?: unknown }).environment;
  if (sceneEnvironment !== undefined && sceneEnvironment !== null) return;
  if (hemisphere) {
    lightEnvironments.set(view, hemisphere);
    view.environment = hemisphere;
  } else if (view.environment !== null && view.environment === lightEnvironments.get(view)) {
    lightEnvironments.delete(view);
    view.environment = null;
  }
}

/**
 * Puts back what `prepareLights` swapped in for pixi-3d once the view has drawn
 * @param view - The view that drew
 * @internal
 */
export function finishLights(view: View3D): void {
  for (const light of view.lights) if (isRenderedLight(light)) light._finishRender();
}

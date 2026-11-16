import { Vector2 } from '@pixi/3d';

import { RootFrustum } from './RootFrustum';
import { RootOrthographicCamera } from './RootOrthographicCamera';
import { RootPerspectiveCamera } from './RootPerspectiveCamera';
import { RootRaycaster } from './RootRaycaster';
import { RootScene } from './RootScene';
import { RootVector3 } from './RootVector3';

/**
 * The classes core builds its own objects from while no package registers its own, by the names r3f's
 * core reads them under: pixi-3d's, with the members r3f's core calls
 * @internal
 */
export const rootClasses = {
  Scene: RootScene,
  PerspectiveCamera: RootPerspectiveCamera,
  OrthographicCamera: RootOrthographicCamera,
  Raycaster: RootRaycaster,
  Vector2,
  Vector3: RootVector3,
  Frustum: RootFrustum,
};

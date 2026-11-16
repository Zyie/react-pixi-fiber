/**
 * `@react-fiber/threejs-compat`: three.js's names and API over @pixi/3d, for 1-1 swaps of r3f scenes
 *
 * An r3f app swaps `@react-three/fiber` for this entry, `three` for `@react-fiber/threejs-compat/three`
 * and `three/addons` for `@react-fiber/threejs-compat/addons`. This entry is r3f's API, core's, with what
 * r3f's own entry adds over three (`<Environment>`, `useEnvironment`, `useTextures`). Importing any of
 * the three entries installs the package: three's JSX names (`<mesh>`, `<boxGeometry>`,
 * `<meshStandardMaterial>`) on top of @pixi/3d's own, three's `Object3D` surface on @pixi/3d's classes,
 * three's classes for each root's default scene, camera and raycaster, and three's renderer settings
 * (`ThreeRenderer`). It also types core with three's classes (`Register`), so `useThree().camera` is a
 * three `PerspectiveCamera`.
 */
import type { ThreeElementsOf } from '@react-fiber/core';

import './install';
import type { PixiCatalog as CompatCatalog } from './catalog/catalog';
import type { OrthographicCamera as ThreeOrthographicCamera } from './catalog/scene/OrthographicCamera';
import type { PerspectiveCamera as ThreePerspectiveCamera } from './catalog/scene/PerspectiveCamera';
import type { Scene as ThreeScene } from './catalog/scene/Scene';
import type { Texture as ThreeTexture } from './catalog/textures/Texture';
import type { Intersection as ThreeIntersection, Raycaster as ThreeRaycaster } from './compat/Raycaster';
import type { RenderTargetOptions as ThreeRenderTargetOptions } from './environment/RenderTarget';
import type { WebGLRenderTarget as ThreeRenderTarget } from './environment/WebGLRenderTarget';
import type { Color as ThreeColor, ColorRepresentation as ThreeColorRepresentation } from './math/Color';
import type { Euler as ThreeEuler, EulerOrder as ThreeEulerOrder } from './math/Euler';
import type { Frustum as ThreeFrustum } from './math/Frustum';
import type { Vector2 as ThreeVector2 } from './math/Vector2';
import type { Vector3 as ThreeVector3 } from './math/Vector3';
import type { ThreeRenderer as CompatRenderer } from './renderer/ThreeRenderer';

export * from '@react-fiber/core';
export { aliases, catalog, type AliasCatalog, type PixiCatalog } from './catalog/catalog';
export type { CameraMembers, Object3DMembers } from './compat/installObject3DSurface';
export type { MaterialMembers } from './compat/materialSurface';
export type { ThreeMatrix4Members, ThreeQuaternionMembers, ThreeVector3Members } from './compat/threeMembers';
export {
  Environment,
  EnvironmentCube,
  EnvironmentMap,
  EnvironmentPortal,
  type EnvironmentProps,
} from './environment/components/Environment';
export {
  useEnvironment,
  type EnvironmentLoader,
  type EnvironmentLoaderProps,
  type UseEnvironment,
} from './environment/hooks/useEnvironment';
export type { RenderTargetOptions } from './environment/RenderTarget';
export {
  useTextures,
  type DisposeOptions,
  type TextureInput,
  type TextureResult,
  type UseTexturesReturn,
} from './loaders/useTextures';
export { ThreeRenderer } from './renderer/ThreeRenderer';

declare module '@react-fiber/core' {
  interface Register {
    Scene: typeof ThreeScene;
    PerspectiveCamera: typeof ThreePerspectiveCamera;
    OrthographicCamera: typeof ThreeOrthographicCamera;
    Camera: ThreePerspectiveCamera | ThreeOrthographicCamera;
    Raycaster: typeof ThreeRaycaster;
    Intersection: ThreeIntersection;
    Vector2: typeof ThreeVector2;
    Vector3: typeof ThreeVector3;
    Frustum: typeof ThreeFrustum;
    Texture: typeof ThreeTexture;
    Renderer: typeof CompatRenderer;
    RenderTarget: typeof ThreeRenderTarget;
    RenderTargetOptions: ThreeRenderTargetOptions;
    ColorRepresentation: ThreeColorRepresentation;
    Color: typeof ThreeColor;
    Euler: typeof ThreeEuler;
    EulerOrder: ThreeEulerOrder;
    Catalog: CompatCatalog;
    Classes: CompatCatalog;
  }

  interface ThreeElements extends ThreeElementsOf<CompatCatalog> {}
}

import * as PIXI3D from '@pixi/3d';

import { Frustum } from '../compat/Frustum';
import { Raycaster } from '../compat/Raycaster';
import { Vector2 } from '../compat/Vector2';
import { Vector3 } from '../compat/Vector3';
import { AmbientLight } from './AmbientLight';
import { BoxGeometry } from './BoxGeometry';
import * as constants from './constants';
import { DirectionalLight } from './DirectionalLight';
import { Group } from './Group';
import { Mesh } from './Mesh';
import { MeshBasicMaterial } from './MeshBasicMaterial';
import { MeshStandardMaterial } from './MeshStandardMaterial';
import { Object3D } from './Object3D';
import { OrthographicCamera } from './OrthographicCamera';
import { PerspectiveCamera } from './PerspectiveCamera';
import { PlaneGeometry } from './PlaneGeometry';
import { PointLight } from './PointLight';
import { Scene } from './Scene';
import { SphereGeometry } from './SphereGeometry';
import { TextureLoader } from './TextureLoader';

/**
 * Classes under three's names: the JSX aliases (`<mesh>`, `<boxGeometry>`, ...) and the math classes
 * r3f's core builds by name (`Vector3`, `Raycaster`, `Frustum`, ...)
 * @category catalog
 * @advanced
 */
export interface AliasCatalog {
  /** three's `Scene` */
  Scene: typeof Scene;
  /** three's `Object3D` */
  Object3D: typeof Object3D;
  /** three's `Group` */
  Group: typeof Group;
  /** three's `Mesh` */
  Mesh: typeof Mesh;
  /** three's `PerspectiveCamera` */
  PerspectiveCamera: typeof PerspectiveCamera;
  /** three's `OrthographicCamera` */
  OrthographicCamera: typeof OrthographicCamera;
  /** three's `BoxGeometry` */
  BoxGeometry: typeof BoxGeometry;
  /** three's `SphereGeometry` */
  SphereGeometry: typeof SphereGeometry;
  /** three's `PlaneGeometry` */
  PlaneGeometry: typeof PlaneGeometry;
  /** three's `MeshStandardMaterial` */
  MeshStandardMaterial: typeof MeshStandardMaterial;
  /** three's `MeshBasicMaterial` */
  MeshBasicMaterial: typeof MeshBasicMaterial;
  /** three's `AmbientLight` */
  AmbientLight: typeof AmbientLight;
  /** three's `DirectionalLight` */
  DirectionalLight: typeof DirectionalLight;
  /** three's `PointLight` */
  PointLight: typeof PointLight;
  /** three's `TextureLoader` */
  TextureLoader: typeof TextureLoader;
  /** three's `Vector2` */
  Vector2: typeof Vector2;
  /** three's `Vector3` */
  Vector3: typeof Vector3;
  /** three's `Frustum` */
  Frustum: typeof Frustum;
  /** three's `Raycaster` */
  Raycaster: typeof Raycaster;
}

/**
 * Everything a root on this renderer resolves JSX names and core classes from: pixi-3d's exports
 * (`<mesh3D>`, `<cubeGeometry>`, `<material3D>`), with the three-named classes and constants on top
 * @category catalog
 * @advanced
 */
export type PixiCatalog = Omit<typeof PIXI3D, keyof AliasCatalog | keyof typeof constants> &
  AliasCatalog &
  typeof constants;

/**
 * The three-named classes; they win over pixi-3d's own classes of the same name (`SphereGeometry`,
 * `AmbientLight`, ...), whose options-object constructors would ignore three's positional `args`
 * @category catalog
 * @advanced
 */
export const aliases: AliasCatalog = {
  Scene,
  Object3D,
  Group,
  Mesh,
  PerspectiveCamera,
  OrthographicCamera,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
  TextureLoader,
  Vector2,
  Vector3,
  Frustum,
  Raycaster,
};

/**
 * The namespace r3f's core reads as `getThree()` and resolves JSX element names in
 * @category catalog
 * @advanced
 */
export const catalog: PixiCatalog = { ...PIXI3D, ...aliases, ...constants };

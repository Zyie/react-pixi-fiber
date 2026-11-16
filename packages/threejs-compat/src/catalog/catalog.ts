import * as animation from '../animation';
import * as environment from '../environment';
import * as events from '../events';
import * as loaders from '../loaders';
import * as math from '../math';
import * as constants from './constants';
import * as drawables from './drawables';
import * as geometries from './geometries';
import * as instancing from './instancing';
import * as lights from './lights';
import * as materials from './materials';
import * as objects from './objects';
import * as scene from './scene';
import * as textures from './textures';

/**
 * Classes under three's names: the JSX aliases (`<mesh>`, `<boxGeometry>`, ...) and the math classes
 * r3f's core builds by name (`Vector3`, `Raycaster`, `Frustum`, ...). Each feature area's module
 * (`src/catalog/<area>`, `src/math`, `src/events`, `src/loaders`, ...) adds to it by exporting a class.
 * @category catalog
 * @advanced
 */
export type AliasCatalog = typeof math &
  typeof objects &
  typeof scene &
  typeof lights &
  typeof geometries &
  typeof materials &
  typeof drawables &
  typeof instancing &
  typeof textures &
  typeof loaders &
  typeof animation &
  typeof events &
  typeof environment;

/**
 * What this package registers with core, as the classes JSX names resolve to and as the classes core
 * builds a root's default scene, camera and raycaster from: the three-named classes and three's
 * constants. @pixi/3d's own elements (`<mesh3D>`, `<cubeGeometry3D>`) are `@react-fiber/3d`'s, which
 * this package installs too.
 * @category catalog
 * @advanced
 */
export type PixiCatalog = AliasCatalog & typeof constants;

/**
 * The three-named classes, with three's constructors and defaults over the @pixi/3d classes they
 * extend
 * @category catalog
 * @advanced
 */
export const aliases: AliasCatalog = {
  ...math,
  ...objects,
  ...scene,
  ...lights,
  ...geometries,
  ...materials,
  ...drawables,
  ...instancing,
  ...textures,
  ...loaders,
  ...animation,
  ...events,
  ...environment,
};

/**
 * The namespace r3f's core reads as `getThree()` and resolves three's JSX element names in
 * @category catalog
 * @advanced
 */
export const catalog: PixiCatalog = { ...aliases, ...constants };

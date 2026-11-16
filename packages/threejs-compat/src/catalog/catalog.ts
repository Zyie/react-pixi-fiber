import * as PIXI3D from '@pixi/3d';

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
 * `AmbientLight`, `Vector3`, ...), whose options-object constructors would ignore three's positional
 * `args`
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
 * The namespace r3f's core reads as `getThree()` and resolves JSX element names in
 * @category catalog
 * @advanced
 */
export const catalog: PixiCatalog = { ...PIXI3D, ...aliases, ...constants };

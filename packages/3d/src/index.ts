/**
 * `@react-fiber/3d`: @pixi/3d's classes as elements of a @react-fiber/core tree
 *
 * Importing it registers, through pixi.js's `extensions`, @pixi/3d's elements (`<mesh3D>`,
 * `<container3D>`, `<sphereGeometry3D>`, `<phongMaterial3D>`, `<pointLight3D>`, ...: each class name in
 * camelCase with a `3D` suffix, once) and the hooks core calls on @pixi/3d's objects. Props and `args`
 * are @pixi/3d's own: options objects, its vectors and rotations, pixi colour sources. The classes are
 * `@pixi/3d`'s own: a ref gets the @pixi/3d object, and an app imports the classes from `@pixi/3d`.
 */
import { FiberExtensionType } from '@react-fiber/core/extension';
import { extensions } from 'pixi.js';

import * as catalog3D from './catalog';
import type { Elements3D } from './elements';
import { objects3D } from './objects3D';

export type { Element3D, Elements3D, OptionProps3D } from './elements';

extensions.add(
  { type: FiberExtensionType.Catalog, name: '3d', ref: catalog3D },
  { type: FiberExtensionType.Objects, name: '3d', ref: objects3D },
);

declare module '@react-fiber/core' {
  interface ThreeElements extends Elements3D<typeof catalog3D> {}
}

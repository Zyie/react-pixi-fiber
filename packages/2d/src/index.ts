import { registerRootExtension } from '@react-fiber/core';
import type { ThreeElementsOf } from '@react-fiber/core';
import { FiberExtensionType } from '@react-fiber/core/extension';
/**
 * `@react-fiber/2d`: pixi.js's 2D classes as elements of a @react-fiber/core tree
 *
 * Importing it registers, through pixi.js's `extensions`, the 2D elements (`<sprite2D>`,
 * `<graphics2D>`, `<blurFilter2D attach="filters-0">`, ...: each class name in camelCase with a `2D`
 * suffix), the hooks core calls on 2D objects, and, when the first root loads, what pixi.js's classes
 * need to be r3f elements. The classes are pixi.js's own: a ref gets the pixi object, and an app imports
 * the classes from `pixi.js`.
 */
import { extensions } from 'pixi.js';

import * as catalog2D from './catalog';
import { frameExtension } from './frame';
import { objects2D } from './objects2D';
import { install2DSurface } from './surface';

export { AssetsLoader } from './AssetsLoader';
export { useAsset } from './useAsset';

extensions.add(
  { type: FiberExtensionType.Catalog, name: '2d', ref: catalog2D },
  { type: FiberExtensionType.Objects, name: '2d', ref: objects2D },
  {
    type: FiberExtensionType.Support,
    name: '2d',
    ref: {
      install() {
        install2DSurface();
        registerRootExtension(frameExtension);
      },
    },
  },
);

declare module '@react-fiber/core' {
  interface ThreeElements extends ThreeElementsOf<typeof catalog2D> {}
}

import { registerRootExtension } from '@react-fiber/r3f/src/core/extensions';
import { extensions } from 'pixi.js';

import { Anchor2D } from '../bridges/Anchor2D';
import { rootClasses } from '../defaults';
import { RootRenderTarget } from '../defaults/RootRenderTarget';
import { PixiRenderer } from '../renderer/PixiRenderer';
import { ensureScreen, releaseScreen } from '../stage/screen';
import type { Registered } from '../types/register';
import type { RootState, RootStore } from '../types/state';
import { pixiHooks } from './hooks';
import type { PixiHooks } from './hooks';
import { FiberExtensionType, catalog, classes, installParts, supportPart } from './registry';

extensions.add(
  { type: FiberExtensionType.Catalog, name: 'core', priority: -1, ref: { Anchor2D } },
  { type: FiberExtensionType.Classes, name: 'core', priority: -1, ref: rootClasses },
  { type: FiberExtensionType.Support, name: 'core', priority: -1, ref: { RenderTarget: RootRenderTarget } },
);

/**
 * pixi.js as an r3f renderer support: what r3f's core loads when a root is configured
 *
 * The same contract as r3f's `support/webgpu.ts`: the classes core builds its own objects from
 * (`three`, core's pixi-3d classes unless a package registers its own), the namespace JSX names
 * resolve in (`catalog`), the renderer class, the render target classes `useRenderTarget` and
 * `<Environment>` make, and the hooks core calls where it reaches into the objects it draws (adding a
 * child, hit testing, ordering hits, freeing). The packages on core fill it through pixi.js's
 * `extensions` (`FiberExtensionType`): their classes, their object hooks, and the renderer and targets
 * they give. `kind` is `'pixi'`. Core's only branch on it tests for `'webgl'`, so a pixi root takes
 * the path that awaits the renderer's async `init()`, and the WebGL-only occlusion gate stays off.
 * pixi.js can't share a renderer between canvases, so there is no canvas target.
 * @category renderer
 * @advanced
 */
export interface PixiSupport extends PixiHooks {
  /** Always `'pixi'` */
  kind: 'pixi';
  /** The classes core builds the default raycaster, scene and camera from, which are not elements */
  three: Registered<'Classes'>;
  /** The namespace JSX names resolve in: every registered package's classes */
  catalog: Registered<'Catalog'>;
  /** The renderer r3f constructs */
  Renderer: Registered<'Renderer'>;
  /** The target `useRenderTarget` makes */
  RenderTarget: Registered<'RenderTarget'> | undefined;
  /** The cube target `<Environment>` makes for its children */
  CubeRenderTarget: (new (size: number, options?: object) => object) | undefined;
  /** Not available: pixi.js can't share a renderer between canvases */
  CanvasTarget: undefined;
  /** Not available: pixi-3d has no occlusion queries */
  occlusion: undefined;
}

/**
 * Gives each root's scene its screen layer, as `state.screen`, and frees it when the root unmounts
 */
const screenExtension = {
  name: 'react-fiber:screen',
  setup: (store: RootStore): Partial<RootState> => ({ screen: ensureScreen(store.getState().scene) }),
  dispose: (store: RootStore): void => releaseScreen(store.getState().scene),
};

/**
 * The renderer support every root loads, from the packages registered so far
 * @returns The support
 */
function createSupport(): PixiSupport {
  return {
    ...pixiHooks,
    kind: 'pixi',
    three: classes as Registered<'Classes'>,
    catalog: catalog as Registered<'Catalog'>,
    Renderer: (supportPart('Renderer') ?? PixiRenderer) as unknown as Registered<'Renderer'>,
    RenderTarget: supportPart('RenderTarget'),
    CubeRenderTarget: supportPart('CubeRenderTarget'),
    CanvasTarget: undefined,
    occlusion: undefined,
  };
}

/**
 * Loads the support for a root: runs what each registered package installs, once, gives every root a
 * screen layer for its 2D, then hands the support over. r3f's core calls it during a root's first
 * `configure()`, before any element is created, so importing a package changes nothing until a root
 * exists.
 * @internal
 */
export function loadPixiSupport(): PixiSupport {
  installParts();
  (registerRootExtension as unknown as (extension: typeof screenExtension) => void)(screenExtension);
  return createSupport();
}

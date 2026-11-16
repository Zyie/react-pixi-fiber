/**
 * The JSON the site imports from `static/`, which the generators in `docs/scripts/generators` write
 * before a build, so a type check of a fresh checkout has no files to read; these give the imports
 * their types either way.
 */

/** The live runtime's files, from `live.mts` */
declare module '@site/static/runtime/manifest.json' {
  import type { RuntimeManifest } from '@site/src/components/Live/types';

  const manifest: RuntimeManifest;
  export default manifest;
}

/** Every example by id and title, from `examples.mts` */
declare module '@site/static/example-sources/index.json' {
  import type { ExampleCatalogue } from '@site/src/components/Live/catalogue';

  const catalogue: ExampleCatalogue;
  export default catalogue;
}

/**
 * The library, which the live runtime bundles from the repo's `src`. The frame reads only its `Canvas`;
 * the docs don't type-check `src` itself.
 */
declare module 'react-pixi-fiber' {
  import type { ComponentType, ReactNode } from 'react';

  export const Canvas: ComponentType<{ renderer?: object; camera?: unknown; children?: ReactNode }>;
}

/**
 * The library's three entry, which the live runtime bundles from the repo's `src`. The frame reads only
 * its `DefaultLoadingManager`, to serve the runtime's assets to three's loaders.
 */
declare module 'react-pixi-fiber/three' {
  export const DefaultLoadingManager: {
    setURLModifier(transform?: (url: string) => string): unknown;
  };
}

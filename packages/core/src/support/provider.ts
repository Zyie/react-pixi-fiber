import type { RendererProvider } from '#types';

import { loadPixiSupport } from './pixiSupport';

/**
 * The renderer provider every root on this package is created with
 *
 * It offers the pixi support under `webgpu`, the provider slot whose path in r3f's core awaits an
 * async renderer `init()`.
 * @internal
 */
export const pixiProvider: RendererProvider = {
  webgpu: loadPixiSupport,
};

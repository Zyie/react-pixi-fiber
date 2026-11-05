import type { RendererProvider, WebGPUSupport } from '#types';

import { loadPixiSupport } from './pixiSupport';

/**
 * The renderer provider every root on this package is created with
 *
 * It offers the pixi support under `webgpu`, the provider slot whose path in r3f's core awaits an
 * async renderer `init()`. r3f's provider type names three's support types, so the support is cast.
 * @internal
 */
export const pixiProvider: RendererProvider = {
  webgpu: loadPixiSupport as unknown as () => WebGPUSupport,
};

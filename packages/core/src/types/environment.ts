import type { presetsObj } from '@react-fiber/r3f/src/core/components/Environment/environment-assets';

import type { RegisteredInstance } from './register';

/**
 * What `useRenderTarget` returns, r3f's `R3FRenderTarget`: the render target class the root's support
 * gives, three's `WebGLRenderTarget` with `@react-fiber/threejs-compat`
 * @category types
 * @advanced
 */
export type R3FRenderTarget = RegisteredInstance<'RenderTarget'>;

/**
 * The environments `useEnvironment` and `<Environment preset>` name: r3f's ten Poly Haven `.hdr`
 * files, fetched from pmndrs' asset host
 * @category hooks
 * @advanced
 */
export type PresetsType = keyof typeof presetsObj;

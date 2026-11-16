/**
 * @fileoverview WebGL renderer support
 *
 * The one module in fiber that imports `three`. It is reached in two ways:
 * - statically, by `@react-three/fiber/legacy`
 * - as a dynamic import, by `@react-three/fiber`, when a root asks for WebGL (no `renderer` prop)
 *
 * So an app on the root entry that renders `<Canvas renderer>` never downloads this module, nor
 * three's WebGL renderer with it.
 */

import * as THREE from 'three'
import type { WebGLSupport } from '#types'
import { threeHooks } from './threeHooks'

export const webglSupport: WebGLSupport = {
  ...threeHooks,
  kind: 'webgl',
  three: THREE,
  catalog: THREE,
  Renderer: THREE.WebGLRenderer,
  RenderTarget: THREE.WebGLRenderTarget,
  CubeRenderTarget: THREE.WebGLCubeRenderTarget,
}

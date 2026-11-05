/** The spike's entry: r3f's vendored core with the pixi-3d support as its only renderer provider. */
import type { RendererProvider, ReconcilerRoot, CanvasProps, ThreeElementsOf } from './r3f/types';
import { createRoot as createRootImpl } from './r3f/src/core/root';
import { Canvas as CanvasImpl } from './r3f/src/web/Canvas';
import { pixi3dSupport, type catalog } from './support/pixi3d';

export * from './r3f/src/core';
export { createPointerEvents as events } from './r3f/src/core/events';

const provider: RendererProvider = { webgpu: () => pixi3dSupport };

export function createRoot<TCanvas extends HTMLCanvasElement | OffscreenCanvas>(
  canvas: TCanvas,
): ReconcilerRoot<TCanvas> {
  return createRootImpl(canvas, provider);
}

export function Canvas(props: CanvasProps) {
  return <CanvasImpl {...props} provider={provider} />;
}

//* Element types: r3f's own mapped type over the pixi-3d catalog ==============================
export interface PixiThreeElements extends ThreeElementsOf<typeof catalog> {}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends PixiThreeElements {}
  }
}

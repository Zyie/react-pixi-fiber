import type { ReactNode } from 'react';

import type { ReconcilerRoot as CoreRoot, RenderProps as CoreRenderProps } from '#types';

import { createRoot as createCoreRoot } from '../r3f/src/core/root';
import { pixiProvider } from '../support/provider';
import type { ReconcilerRoot, RenderProps } from '../types/canvas';
import type { RootStore } from '../types/state';

/**
 * Maps a configuration to what r3f's core accepts on this renderer: `gl` is read as `renderer`,
 * so code written for `@react-three/fiber/legacy` runs unchanged, and renderer sharing is turned off
 * because pixi.js can't draw one renderer into several canvases
 * @param props - The configuration as given
 */
function toCoreProps<TCanvas extends HTMLCanvasElement | OffscreenCanvas>(
  props: RenderProps<TCanvas> = {},
): CoreRenderProps<TCanvas> {
  const { gl, renderer = gl, primary: _primary, share: _share, ...rest } = props;
  return { ...rest, renderer, share: false } as unknown as CoreRenderProps<TCanvas>;
}

/**
 * Creates a root on a canvas that renders with pixi-3d, r3f's `createRoot`
 *
 * Configure it, then render a React tree into it. Each canvas gets one root; a second call on the
 * same canvas returns a handle to the same root.
 * @example
 * ```tsx
 * import { createRoot, events } from 'react-pixi-fiber';
 *
 * const root = createRoot(document.querySelector('canvas')!);
 * await root.configure({ events, camera: { position: [0, 0, 5] } });
 * root.render(
 *   <mesh>
 *     <boxGeometry />
 *     <meshStandardMaterial color="orange" />
 *   </mesh>,
 * );
 * ```
 * @param canvas - The canvas to draw into
 * @returns The root
 * @category core
 * @standard
 */
export function createRoot<TCanvas extends HTMLCanvasElement | OffscreenCanvas>(
  canvas: TCanvas,
): ReconcilerRoot<TCanvas> {
  const core: CoreRoot<TCanvas> = createCoreRoot(canvas, pixiProvider);
  const root = {
    get ready() {
      return core.ready;
    },
    configure(config?: RenderProps<TCanvas>) {
      return core.configure.call(root, toCoreProps(config));
    },
    render(element: ReactNode) {
      return core.render.call(root, element);
    },
    unmount() {
      core.unmount();
    },
  };
  return root as unknown as ReconcilerRoot<TCanvas> & { render(element: ReactNode): RootStore };
}

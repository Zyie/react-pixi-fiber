/*!
 * Adapted from react-three-fiber's packages/fiber/src/core/hooks/useRenderTarget.tsx
 * MIT License, Copyright (c) 2019-2025 Poimandres
 */
import { useEffect, useMemo, useState } from 'react';

import { useThree as coreUseThree } from '../../r3f/src/core/hooks/useStore';
import type { RootState } from '../../types/state';
import type { RenderTargetOptions } from '../RenderTarget';
import type { WebGLRenderTarget } from '../WebGLRenderTarget';

const useThree = coreUseThree as unknown as <T>(selector: (state: RootState) => T) => T;

/**
 * The type of {@link useRenderTarget}
 * @category hooks
 * @advanced
 */
export interface UseRenderTarget {
  /** A target the size of the canvas, which follows it */
  (options?: RenderTargetOptions): WebGLRenderTarget;
  /** A square target */
  (size: number, options?: RenderTargetOptions): WebGLRenderTarget;
  /** A target of a given size */
  (width: number, height: number, options?: RenderTargetOptions): WebGLRenderTarget;
}

/**
 * Makes a render target for the root's renderer, r3f's `useRenderTarget`, and disposes it on unmount
 *
 * The same arguments as r3f's. With no size, the target is the canvas's size in CSS pixels and is
 * resized with it, keeping its texture. r3f's makes a new target on every resize and never disposes
 * one; this one is disposed when the component unmounts or its options change. Under StrictMode's
 * second mount, a target the first unmount disposed is replaced with a new one.
 * @example
 * ```tsx
 * const fbo = useRenderTarget(512, 512);
 *
 * useFrame(({ renderer, camera }) => {
 *   renderer.setRenderTarget(fbo);
 *   renderer.render(virtualScene, camera);
 *   renderer.setRenderTarget(null);
 * });
 *
 * return <meshBasicMaterial map={fbo.texture} />;
 * ```
 * @category hooks
 * @standard
 */
export const useRenderTarget: UseRenderTarget = (
  widthOrOptions?: number | RenderTargetOptions,
  heightOrOptions?: number | RenderTargetOptions,
  options?: RenderTargetOptions,
): WebGLRenderTarget => {
  const support = useThree((state) => state.internal.support);
  const size = useThree((state) => state.size);
  const [generation, setGeneration] = useState(0);

  let width: number | undefined;
  let height: number | undefined;
  let opts: RenderTargetOptions | undefined;
  if (typeof widthOrOptions === 'object') {
    opts = widthOrOptions;
  } else if (typeof widthOrOptions === 'number') {
    width = widthOrOptions;
    if (typeof heightOrOptions === 'object') {
      height = widthOrOptions;
      opts = heightOrOptions;
    } else {
      height = typeof heightOrOptions === 'number' ? heightOrOptions : widthOrOptions;
      opts = options;
    }
  }

  const w = width ?? size.width;
  const h = height ?? size.height;
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the size is set on the target below, so a resize keeps its texture; `generation` makes a new one after a dispose
  const target = useMemo(() => new support.RenderTarget(w, h, opts), [support, opts, generation]);
  target.setSize(w, h);

  useEffect(() => {
    if (target.disposed) setGeneration((count) => count + 1);
    return () => target.dispose();
  }, [target]);

  return target;
};

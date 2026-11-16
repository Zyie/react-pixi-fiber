import { useStorageSlot } from '@docusaurus/theme-common';
import { useState } from 'react';

import { isRenderer } from './types';
import type { Renderer } from './types';
import { useBrowserValue } from './useBrowserValue';

/** Whether the browser has WebGPU at all; pixi falls back to WebGL where it can't get an adapter */
export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/** `hasWebGPU` for a render; true on the server and while hydrating, so the choice starts enabled */
export function useHasWebGPU(): boolean {
  return useBrowserValue(hasWebGPU, true);
}

/**
 * The renderer every live example uses, and what chooses it for all of them. The choice is stored, so
 * it holds across pages and visits; where storage is off, it holds for the component that made it.
 * WebGL until the reader chooses: the reference pictures are WebGL's.
 */
export function useRenderer(): [Renderer, (renderer: Renderer) => void] {
  const [stored, slot] = useStorageSlot('pixi-layout-live-renderer');
  const [unstored, setUnstored] = useState<Renderer>('webgl');
  const chosen = isRenderer(stored) ? stored : unstored;
  const choose = (renderer: Renderer): void => {
    setUnstored(renderer);
    slot.set(renderer);
  };

  return [chosen === 'webgpu' && !hasWebGPU() ? 'webgl' : chosen, choose];
}

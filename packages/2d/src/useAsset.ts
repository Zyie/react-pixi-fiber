import { useLoader } from '../r3f/src/core/hooks/useLoader';
import { AssetsLoader } from './AssetsLoader';

/**
 * Loads assets with pixi's `Assets` and suspends until they are ready, `useLoader` with
 * {@link AssetsLoader}: a texture, a spritesheet, a bitmap font, anything `Assets.load` takes. Wrap
 * the caller in `<Suspense>`.
 * @example
 * ```tsx
 * import { useAsset } from 'react-pixi-fiber';
 * import type { Spritesheet } from 'pixi.js';
 *
 * function Walker() {
 *   const sheet = useAsset<Spritesheet>('/sprites/walk.json');
 *   return <animatedSprite2D args={[sheet.animations.walk]} animationSpeed={0.2} />;
 * }
 * ```
 * @param input - One URL or `Assets` alias, or a list
 * @returns The asset, or the assets in the order of the URLs
 * @category hooks
 * @standard
 */
export function useAsset<T = unknown>(input: string): T;
export function useAsset<T = unknown>(input: readonly string[]): T[];
export function useAsset<T = unknown>(input: string | readonly string[]): T | T[] {
  return useLoader(AssetsLoader, input as string | string[]) as T | T[];
}

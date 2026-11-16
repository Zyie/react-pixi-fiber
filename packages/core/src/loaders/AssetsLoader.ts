import { Assets } from 'pixi.js';

/**
 * pixi's `Assets` as a loader `useLoader` takes: whatever `Assets.load` loads, a texture, a
 * spritesheet, a bitmap font, JSON, a glTF model (`@pixi/3d`'s `Scene3DSource`), through r3f's
 * Suspense and cache
 *
 * `useLoader` keeps what it loads by URL, and `Assets` keeps it too; `useLoader.clear` forgets it in
 * React only, so call `Assets.unload` to free it. {@link useAsset} is the same with the result typed.
 * @example
 * ```tsx
 * import { useLoader } from '@react-fiber/core';
 * import { AssetsLoader } from '@react-fiber/core';
 * import type { Spritesheet } from 'pixi.js';
 *
 * const sheet = useLoader(AssetsLoader, '/sprites/sheet.json') as Spritesheet;
 * ```
 * @category hooks
 * @standard
 */
export class AssetsLoader {
  /**
   * Loads a URL with `Assets.load`, three's loader signature
   * @param url - What to load
   * @param onLoad - Gets the asset
   * @param _onProgress - Unused: `Assets` reports progress as a number, not a `ProgressEvent`
   * @param onError - Gets the error
   */
  public load(
    url: string,
    onLoad?: (asset: unknown) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    void Assets.load(url).then(onLoad, onError);
  }

  /**
   * Loads a URL with `Assets.load`
   * @param url - What to load
   * @returns The asset
   */
  public loadAsync(url: string): Promise<unknown> {
    return Assets.load(url);
  }
}

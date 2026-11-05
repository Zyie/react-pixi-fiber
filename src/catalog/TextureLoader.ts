import { Assets } from 'pixi.js';
import type { Texture } from 'pixi.js';

/**
 * three's `TextureLoader` over pixi's `Assets`, so `useLoader(TextureLoader, url)` and `useTexture`
 * load pixi textures
 * @example
 * ```tsx
 * import { TextureLoader, useLoader } from 'react-pixi-fiber';
 *
 * const texture = useLoader(TextureLoader, '/crate.png');
 * ```
 * @category catalog
 * @standard
 */
export class TextureLoader {
  /**
   * Loads a texture
   * @param url - Where the image is
   * @returns The loaded texture
   */
  public loadAsync(url: string): Promise<Texture> {
    return Assets.load<Texture>(url);
  }

  /**
   * Loads a texture with three's callback signature
   * @param url - Where the image is
   * @param onLoad - Called with the texture
   * @param _onProgress - Not called: pixi's `Assets` reports no progress per file
   * @param onError - Called when the load fails
   */
  public load(
    url: string,
    onLoad?: (texture: Texture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    void this.loadAsync(url).then(onLoad, onError);
  }
}

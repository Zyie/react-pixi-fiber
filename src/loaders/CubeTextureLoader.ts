import { CubeReflectionMapping, SRGBColorSpace } from '../catalog/constants';
import { CubeTexture } from '../catalog/textures/CubeTexture';
import { ImageLoader } from './ImageLoader';
import { Loader } from './Loader';
import { toBitmap } from './TextureLoader';

/**
 * three's `CubeTextureLoader`: loads six images into a {@link CubeTexture}, in sRGB as three's does
 *
 * The URLs go in three's order: +x, -x, +y, -y, +z, -z. three's `load` returns the texture at once and
 * fills it later; this one calls `onLoad` with it once all six images have loaded and returns
 * nothing, since pixi builds a cube texture from its faces. `loadAsync` and `useLoader` work as in
 * three: `useLoader(CubeTextureLoader, [urls])`.
 * @example
 * ```ts
 * const sky = await new CubeTextureLoader()
 *   .setPath('/sky/')
 *   .loadAsync(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
 * ```
 * @category catalog
 * @standard
 */
export class CubeTextureLoader extends Loader<CubeTexture, readonly string[]> {
  /**
   * Loads six images into a cube texture
   * @param urls - +x, -x, +y, -y, +z, -z, after `path`
   * @param onLoad - Called with the texture once every image has loaded
   * @param _onProgress - Not called, as in three
   * @param onError - Called when an image fails to load
   */
  public override load(
    urls: readonly string[],
    onLoad?: (texture: CubeTexture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    const loader = new ImageLoader(this.manager).setCrossOrigin(this.crossOrigin).setPath(this.path);

    void Promise.all(urls.map((url) => loader.loadAsync(url).then(toBitmap))).then(
      (images) => onLoad?.(new CubeTexture(images, CubeReflectionMapping, SRGBColorSpace)),
      onError,
    );
  }
}

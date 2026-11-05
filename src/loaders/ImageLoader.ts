import { Cache } from './Cache';
import { Loader } from './Loader';

/**
 * three's `ImageLoader`: loads an image as an `HTMLImageElement`
 *
 * `TextureLoader` and `CubeTextureLoader` load through it. It reports no progress, as three's doesn't.
 * @example
 * ```ts
 * const image = await new ImageLoader().loadAsync('/textures/crate.png');
 * ```
 * @category catalog
 * @advanced
 */
export class ImageLoader extends Loader<HTMLImageElement> {
  /**
   * Loads an image
   * @param url - The image, after `path`
   * @param onLoad - Called with the image once it has loaded
   * @param _onProgress - Not called, as in three
   * @param onError - Called with the error event when it fails
   * @returns The image, still loading
   */
  public override load(
    url: string,
    onLoad?: (image: HTMLImageElement) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): HTMLImageElement {
    const resolved = this.manager.resolveURL(this.path + url);
    const cached = Cache.get(`image:${resolved}`) as HTMLImageElement | undefined;
    const manager = this.manager;

    manager.itemStart(resolved);

    if (cached?.complete) {
      queueMicrotask(() => {
        onLoad?.(cached);
        manager.itemEnd(resolved);
      });

      return cached;
    }

    const image = document.createElement('img');
    const done = (): void => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
    };
    const loaded = (): void => {
      done();
      onLoad?.(image);
      manager.itemEnd(resolved);
    };
    const failed = (event: Event): void => {
      done();
      Cache.remove(`image:${resolved}`);
      onError?.(event);
      manager.itemError(resolved);
      manager.itemEnd(resolved);
    };

    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    if (!resolved.startsWith('data:')) image.crossOrigin = this.crossOrigin;
    Cache.add(`image:${resolved}`, image);
    image.src = resolved;

    return image;
  }
}

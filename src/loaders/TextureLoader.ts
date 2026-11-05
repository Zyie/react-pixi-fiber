import { Texture } from '../catalog/textures/Texture';
import { ImageLoader } from './ImageLoader';
import { Loader } from './Loader';

/**
 * The image as a bitmap, which pixi uploads on WebGPU as it is, where it would copy an image element
 * into a canvas first; the image itself when the browser can't make one
 * @param image - A loaded image
 * @internal
 */
export function toBitmap(image: HTMLImageElement): Promise<ImageBitmap | HTMLImageElement> {
  return createImageBitmap(image).catch(() => image);
}

/**
 * three's `TextureLoader`: loads an image as a three {@link Texture}, which any pixi-3d material slot
 * takes
 *
 * As in three, `load` returns the texture at once and fills it when the image arrives; `loadAsync`
 * and r3f's `useLoader` wait for it. `image` is the loaded `HTMLImageElement`, and pixi uploads a
 * bitmap of it. Each load makes its own texture with its own GPU copy, so
 * setting `wrapS` or `repeat` on one leaves another load of the same image alone.
 * @example
 * ```tsx
 * import { useLoader } from 'react-pixi-fiber';
 * import { TextureLoader } from 'react-pixi-fiber/three';
 *
 * const texture = useLoader(TextureLoader, '/crate.png');
 * ```
 * @category catalog
 * @standard
 */
export class TextureLoader extends Loader<Texture> {
  /**
   * Loads an image into a texture
   * @param url - The image, after `path`
   * @param onLoad - Called with the texture once its image has loaded
   * @param onProgress - Not called, as in three
   * @param onError - Called when the image fails to load
   * @returns The texture, empty until the image loads
   */
  public override load(
    url: string,
    onLoad?: (texture: Texture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): Texture {
    const texture = new Texture();

    new ImageLoader(this.manager)
      .setCrossOrigin(this.crossOrigin)
      .setPath(this.path)
      .load(
        url,
        (image) => {
          texture.image = image;
          void toBitmap(image).then((bitmap) => {
            texture.source.resource = bitmap;
            texture.needsUpdate = true;
            onLoad?.(texture);
          });
        },
        onProgress,
        onError,
      );

    return texture;
  }
}

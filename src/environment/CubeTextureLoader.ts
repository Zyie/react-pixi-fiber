import { Assets, CubeTexture } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { CubeReflectionMapping } from '../catalog/constants';
import type { EnvironmentTexture } from './environmentTexture';

/**
 * three's `CubeTextureLoader`: loads six images, in three's order +X, -X, +Y, -Y, +Z, -Z, into a pixi
 * `CubeTexture`
 *
 * The texture's `colorSpace` is `'srgb'` and its `mapping` `CubeReflectionMapping`, as r3f's
 * `useEnvironment` sets them. Scenes sample it mirrored in x, as three samples cube textures loaded
 * from images, so the same six files face the same way in both. The images load through pixi's `Assets`.
 * @example
 * ```tsx
 * import { useLoader } from 'react-pixi-fiber';
 * import { CubeTextureLoader } from 'react-pixi-fiber/three';
 *
 * const [sky] = useLoader(CubeTextureLoader, [['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']]);
 * ```
 * @category catalog
 * @standard
 */
export class CubeTextureLoader {
  /** Prefixed to every URL @default '' */
  public path = '';

  /**
   * Sets the prefix of every URL
   * @param path - The prefix
   * @returns This loader
   */
  public setPath(path: string): this {
    this.path = path;
    return this;
  }

  /**
   * Loads the six faces into a cube texture
   * @param urls - The faces' URLs, after `path`: +X, -X, +Y, -Y, +Z, -Z
   * @returns The cube texture
   */
  public async loadAsync(urls: readonly string[]): Promise<CubeTexture & EnvironmentTexture> {
    const [right, left, top, bottom, front, back] = await Promise.all(
      urls.map((url) => Assets.load<Texture>(this.path + url)),
    );
    const cube: CubeTexture & EnvironmentTexture = CubeTexture.from(
      { faces: { right, left, top, bottom, front, back }, label: urls[0] },
      true,
    );
    cube.colorSpace = 'srgb';
    cube.mapping = CubeReflectionMapping;
    return cube;
  }

  /**
   * Loads the six faces with three's callback signature
   * @param urls - The faces' URLs, after `path`: +X, -X, +Y, -Y, +Z, -Z
   * @param onLoad - Called with the cube texture
   * @param _onProgress - Not called: pixi's `Assets` reports no progress per file
   * @param onError - Called when a face fails to load
   */
  public load(
    urls: readonly string[],
    onLoad?: (texture: CubeTexture & EnvironmentTexture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    void this.loadAsync(urls).then(onLoad, onError);
  }
}

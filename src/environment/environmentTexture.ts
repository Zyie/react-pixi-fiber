import type { CubeTexture, Texture } from 'pixi.js';

/**
 * A texture `scene.environment` and `scene.background` take: a pixi `CubeTexture`, or a 2D pixi
 * `Texture` holding an equirectangular map, with three's `colorSpace` and `mapping` when known
 *
 * A `colorSpace` of `'srgb-linear'` marks linear radiance, as an `.hdr` holds; `'srgb'` marks an
 * image; without one, a float texture reads as linear and any other as sRGB. Cube textures loaded from
 * images are mirrored as three mirrors them; cube textures a renderer drew into are not.
 * @category catalog
 * @advanced
 */
export type EnvironmentTexture = (Texture | CubeTexture) & {
  /** three's colour space of the texels: `'srgb'` or `'srgb-linear'` */
  colorSpace?: string;
  /** three's mapping constant: `CubeReflectionMapping` or `EquirectangularReflectionMapping` */
  mapping?: number;
};

import type { TextureSource } from 'pixi.js';

const sampledSources = new WeakSet<TextureSource>();

/**
 * Records that a material holds a texture's source in one of its slots, which the 3D package that
 * tracks its materials' textures calls. On WebGPU a render target whose texture a material has held
 * is drawn into a twin, since pixi-3d binds every material's textures into the pass.
 * @param source - The texture's source
 * @category renderer
 * @advanced
 */
export function markMaterialTexture(source: TextureSource): void {
  sampledSources.add(source);
}

/**
 * Whether a material has ever held the source in one of its texture slots
 * @param source - A texture's source
 * @internal
 */
export const isMaterialTexture = (source: TextureSource): boolean => sampledSources.has(source);

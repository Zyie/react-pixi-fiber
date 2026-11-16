import { BaseMaterial3D } from '@pixi/3d';
import { Matrix } from 'pixi.js';
import type { Texture as PixiTexture, TextureSource } from 'pixi.js';

import type { Texture } from './Texture';

/** What a three `Texture` gives the materials that hold it */
interface UvSource {
  readonly _isThreeTexture: true;
  readonly _users: Set<BaseMaterial3D>;
  _writeUvTransform(out: Matrix): boolean;
}

/** The private parts of a pixi-3d material this module reads */
interface MaterialSlots {
  _textures: PixiTexture[];
  _slotByName: Record<string, number | undefined>;
}

/** Materials whose `uvTransform` a three texture set, so it is handed back when no such texture is left */
const driven = new WeakSet<BaseMaterial3D>();
const sampledSources = new WeakSet<TextureSource>();
const scratch = new Matrix();

let installed = false;

const isThreeTexture = (texture: PixiTexture | undefined): texture is PixiTexture & UvSource =>
  (texture as Partial<UvSource> | undefined)?._isThreeTexture === true;

const slotsOf = (material: BaseMaterial3D): MaterialSlots => material as unknown as MaterialSlots;

/**
 * The three texture that sets a material's UV transform: the one in its `baseColor` slot (three's
 * `map`), else the first of its slots that holds one
 */
function driverOf(material: BaseMaterial3D): (PixiTexture & UvSource) | undefined {
  const { _textures: textures, _slotByName: slots } = slotsOf(material);
  const base = slots.baseColor === undefined ? undefined : textures[slots.baseColor];

  if (isThreeTexture(base)) return base;

  return textures.find(isThreeTexture);
}

/**
 * Puts the transform of a material's three texture (`offset`, `repeat`, `rotation`, `center`,
 * `flipY`) on the material's `uvTransform`, pixi-3d's one transform for every slot, or hands the
 * transform back when it is the identity or no three texture is left
 * @param material - The material to update
 * @internal
 */
export function syncUvTransform(material: BaseMaterial3D): void {
  if (material.destroyed) return;

  const driver = driverOf(material);
  const identity = !driver || driver._writeUvTransform(scratch);

  if (identity) {
    if (driven.delete(material)) material.uvTransform = undefined;

    return;
  }

  driven.add(material);
  material.uvTransform = scratch;
}

function track(material: BaseMaterial3D): boolean {
  let found = false;

  for (const texture of slotsOf(material)._textures) {
    if (isThreeTexture(texture)) {
      texture._users.add(material);
      found = true;
    }
  }

  return found;
}

/**
 * Has every pixi-3d material tell the three textures it holds, so a change to a texture's transform
 * reaches the material's UV transform
 *
 * It wraps three of `BaseMaterial3D`'s members: `_deriveLayoutFromBits`, which fills the slots a
 * constructor is given, `_setTextureSlot`, which every later slot write goes through, and `destroy`,
 * which lets the textures forget the material. The root's renderer support calls it once, with the
 * rest of the compat patches.
 * @internal
 */
export function installTextureTracking(): void {
  if (installed) return;
  installed = true;

  type DeriveLayout = (this: BaseMaterial3D, ...args: unknown[]) => void;

  const prototype = BaseMaterial3D.prototype as unknown as {
    _deriveLayoutFromBits: DeriveLayout;
    _setTextureSlot: (this: BaseMaterial3D, index: number, value: PixiTexture) => void;
    destroy: (this: BaseMaterial3D, ...args: unknown[]) => void;
  };
  const deriveLayout = prototype._deriveLayoutFromBits;
  const setTextureSlot = prototype._setTextureSlot;
  const destroy = prototype.destroy;

  prototype._deriveLayoutFromBits = function deriveLayoutFromBits(...args) {
    deriveLayout.apply(this, args);
    if (track(this)) syncUvTransform(this);
  };

  prototype._setTextureSlot = function trackTextureSlot(index, value) {
    const textures = slotsOf(this)._textures;
    const previous = textures[index];

    setTextureSlot.call(this, index, value);

    if (value) sampledSources.add(value.source);
    if (previous === value) return;
    if (isThreeTexture(previous) && !textures.includes(previous)) previous._users.delete(this);
    if (isThreeTexture(value)) value._users.add(this);
    if (isThreeTexture(previous) || isThreeTexture(value)) syncUvTransform(this);
  };

  prototype.destroy = function untrackTextures(...args) {
    if (!this.destroyed) {
      for (const texture of slotsOf(this)._textures) {
        if (isThreeTexture(texture)) texture._users.delete(this);
      }
    }
    destroy.apply(this, args);
  };
}

/**
 * Whether a material has ever held the source in one of its texture slots
 * @param source - A texture's source
 * @internal
 */
export const isMaterialTexture = (source: TextureSource): boolean => sampledSources.has(source);

/**
 * Updates the UV transform of every material that holds a texture
 * @param texture - The texture whose transform changed
 * @internal
 */
export function textureTransformChanged(texture: Texture): void {
  for (const material of texture._users) syncUvTransform(material);
}

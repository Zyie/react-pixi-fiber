import { Sprite, Texture } from 'pixi.js';
import type { Container } from 'pixi.js';

const backdrops = new WeakMap<Container, Sprite>();

/**
 * Draws a 2D texture background behind a scene's view, stretched over the canvas, as three draws a
 * `Texture` background: a sprite at the bottom of the view's stage. An sRGB texture shows as it is,
 * as in three. `intensity` dims it in display space, so 0 to 1 only.
 * @param stage - The view's stage
 * @param background - The scene's background; anything but a texture hides the backdrop
 * @param width - The canvas width in CSS pixels
 * @param height - The canvas height in CSS pixels
 * @param intensity - three's `backgroundIntensity`
 * @returns Whether a texture is drawn
 * @internal
 */
export function updateBackdrop(
  stage: Container,
  background: unknown,
  width: number,
  height: number,
  intensity: number,
): boolean {
  let sprite = backdrops.get(stage);
  if (!(background instanceof Texture)) {
    if (sprite) sprite.visible = false;
    return false;
  }
  if (!sprite) {
    sprite = new Sprite();
    backdrops.set(stage, sprite);
    stage.addChildAt(sprite, 0);
  }
  sprite.visible = true;
  sprite.texture = background;
  sprite.setSize(width, height);
  const level = Math.round(255 * Math.min(Math.max(intensity, 0), 1) ** (1 / 2.2));
  sprite.tint = (level << 16) | (level << 8) | level;
  return true;
}

/**
 * Frees a stage's backdrop sprite, leaving its texture to its owner
 * @param stage - The view's stage
 * @internal
 */
export function releaseBackdrop(stage: Container): void {
  const sprite = backdrops.get(stage);
  if (!sprite) return;
  backdrops.delete(stage);
  sprite.destroy({ texture: false });
}

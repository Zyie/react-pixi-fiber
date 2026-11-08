import type { View3D } from '@pixi/3d';
import { Sprite, Texture } from 'pixi.js';
import type { Container } from 'pixi.js';

const backdrops = new WeakMap<Container, Sprite>();

/**
 * Where in a view's stage what draws under the view goes: the view's own index, or that of the screen
 * layer holding the view when the scene has 2D
 * @param stage - The view's stage
 * @param view - The view
 * @internal
 */
export function indexUnderView(stage: Container, view: View3D): number {
  let slot: Container = view;
  while (slot.parent && slot.parent !== stage) slot = slot.parent;
  return stage.getChildIndex(slot);
}

/**
 * Draws a 2D texture background behind a scene's view, stretched over the view's rect, as three draws
 * a `Texture` background: a sprite just under the view in its stage. An sRGB texture shows as it is,
 * as in three. `intensity` dims it in display space, so 0 to 1 only.
 * @param stage - The view's stage
 * @param view - The view, placed and sized for this draw
 * @param background - The scene's background; anything but a texture hides the backdrop
 * @param intensity - three's `backgroundIntensity`
 * @returns Whether a texture is drawn
 * @internal
 */
export function updateBackdrop(stage: Container, view: View3D, background: unknown, intensity: number): boolean {
  let sprite = backdrops.get(stage);
  if (!(background instanceof Texture)) {
    if (sprite) sprite.visible = false;
    return false;
  }
  if (!sprite) {
    sprite = new Sprite();
    backdrops.set(stage, sprite);
    stage.addChildAt(sprite, indexUnderView(stage, view));
  }
  sprite.visible = true;
  sprite.texture = background;
  sprite.position.copyFrom(view.position);
  sprite.setSize(view.width, view.height);
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

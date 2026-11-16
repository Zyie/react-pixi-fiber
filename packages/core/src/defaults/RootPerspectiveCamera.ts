import { RootCamera } from './RootCamera';

/**
 * The perspective camera core makes for a root, a `<View3D>` and a portal while no package registers
 * its own: a pixi-3d `Camera3D` in perspective mode, made with the arguments r3f's core passes
 * @category core
 * @advanced
 */
export class RootPerspectiveCamera extends RootCamera {
  /**
   * @param fov - Vertical field of view, in degrees
   * @param aspect - Width over height; 0 for the size of the view drawing it
   * @param near - Nearest distance drawn
   * @param far - Farthest distance drawn
   */
  constructor(fov = 50, aspect = 0, near = 0.1, far = 2000) {
    super({ mode: 'perspective', fov, near, far });
    this.aspect = aspect;
  }
}

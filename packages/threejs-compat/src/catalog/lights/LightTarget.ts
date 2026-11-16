import { Container3D, Vector3 } from '@pixi/3d';

/**
 * The node a directional or spot light aims at until it is given another, at the origin
 *
 * three aims a light at its target's `matrixWorld`, which only a scene's update or an explicit
 * `updateMatrixWorld()` call refreshes. So while the target is outside the scene, three aims at the
 * origin whatever its `position` says, until `updateMatrixWorld()` is called. This node keeps the
 * world position that call last saw, and the light aims there while the target is in no view.
 * @internal
 */
export class LightTarget extends Container3D {
  /** Where three's light would see this target while it is outside the scene */
  public readonly lastWorldPosition: Vector3 = new Vector3();

  /** Records where the target is now, as three's `matrixWorld` would; three's lights aim there while it is outside the scene */
  public override updateMatrixWorld(): void {
    this.getGlobalPosition(this.lastWorldPosition);
  }
}

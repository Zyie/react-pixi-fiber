import { Container3D, DirectionalLight as PixiDirectionalLight, Vector3 } from '@pixi/3d';
import type { PointData3D } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import type { Euler } from '../../math/Euler';
import { areShadowsEnabled } from '../../renderer/shadowViews';

const lightPosition = new Vector3();
const targetPosition = new Vector3();

/**
 * three's `DirectionalLight` over pixi-3d's, with three's positional constructor
 *
 * In three the light shines from its position toward `target`, which starts at the origin, and the
 * light starts one unit up. pixi-3d's light shines along its local -Z, so the renderer turns it
 * toward the target before each frame. It casts shadows only while the renderer's
 * `shadowMap.enabled` is on (`<Canvas renderer={{ shadows: true }}>`), as in three.
 * @example
 * ```tsx
 * <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
 * ```
 * @category catalog
 * @standard
 */
export class DirectionalLight extends PixiDirectionalLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;
  /** What the light points at; a node outside the scene at the origin until you move or replace it */
  public target: Container3D = new Container3D();

  /**
   * @param color - Light colour
   * @param intensity - Brightness
   */
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
    this.position.set(0, 1, 0);
  }

  /** Casts shadows only while `castShadow` is on and the renderer has shadows enabled */
  public override get canCastShadow(): boolean {
    return super.canCastShadow && areShadowsEnabled(this.view3d);
  }

  /**
   * Turns the light toward `target`; the renderer calls it before each frame
   * @internal
   */
  public aimAtTarget(): void {
    this.getGlobalPosition(lightPosition);
    this.target.getGlobalPosition(targetPosition);
    if (lightPosition.distanceToSquared(targetPosition) === 0) return;
    this.lookAt(targetPosition);
  }

  /** Local rotation in radians, three's `Euler`: its `order` sets how the angles combine, and it stays in step with `quaternion` */
  public override get rotation(): Euler {
    return super.rotation as Euler;
  }

  public override set rotation(value: PointData3D) {
    super.rotation = value;
  }

  /**
   * Turns this node to face a point in world space, given as a vector or as three numbers; the light still shines at its `target`
   * @param x - The point, or its x
   * @param y - The point's y
   * @param z - The point's z
   */
  public override lookAt(x: number | PointData3D, y?: number | PointData3D, z?: number): void {
    lookAtPoint(this, x, y, z);
  }
}

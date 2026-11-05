import { DirectionalLight as PixiDirectionalLight } from '@pixi/3d';
import type { Destroy3DOptions, PointData3D, Container3D } from '@pixi/3d';

import { DEFAULT_UP, lookAtPoint } from '../../compat/installObject3DSurface';
import type { Color, ColorRepresentation } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { areShadowsEnabled } from '../../renderer/shadowViews';
import { OrthographicCamera } from '../scene/OrthographicCamera';
import { LightColor } from './lightColors';
import { DirectionalLightShadow } from './LightShadow';
import { LightTarget } from './LightTarget';
import { aimAtTarget, swapInPixiShadow } from './renderHooks';
import type { RenderedLight } from './renderHooks';

/**
 * three's `DirectionalLight` over pixi-3d's, with three's positional constructor
 *
 * In three the light shines from its position toward `target`, which starts at the origin, and the
 * light starts one unit up. pixi-3d's light shines along its local -Z, so the renderer turns it
 * toward the target before each frame. `color` is a three `Color`, so `light.color.set('orange')` and
 * `color-g={0.5}` work. It casts shadows only while the renderer's `shadowMap.enabled` is on
 * (`<Canvas renderer={{ shadows: true }}>`), as in three, over the box its `shadow.camera` covers.
 * @example
 * ```tsx
 * <directionalLight position={[5, 5, 5]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
 * ```
 * @category catalog
 * @standard
 */
export class DirectionalLight extends PixiDirectionalLight implements RenderedLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;
  /** Always `true`, as on three's directional lights */
  public readonly isDirectionalLight = true;
  /**
   * What the light points at, as in three: a node at the origin, which takes effect from its
   * `position` once it is added to the scene or its `updateMatrixWorld()` is called, or any node in the scene
   */
  public target: Container3D = new LightTarget();
  /** The shadow's settings, three's `DirectionalLightShadow`, with pixi-3d's shadow options beside them */
  declare public shadow: DirectionalLightShadow;
  private readonly _threeColor: LightColor;
  private _ownShadow: DirectionalLightShadow | null = null;

  /**
   * @param color - Light colour
   * @param intensity - Brightness
   */
  constructor(color: ColorRepresentation = 0xffffff, intensity = 1) {
    super({ intensity });
    this._threeColor = new LightColor(color);
    this.shadow = new DirectionalLightShadow(new OrthographicCamera(-5, 5, 5, -5, 0.5, 500));
    this.position.copyFrom(DEFAULT_UP);
  }

  /** The light's colour, a three `Color` in the working colour space */
  // @ts-expect-error -- three's `color` is a three Color where pixi-3d's light has a pixi Color; pixi-3d reads it through LightColor's display channels
  public override get color(): Color {
    return this._threeColor;
  }

  // @ts-expect-error -- takes what three's colour props take, where pixi-3d's takes a ColorSource
  public override set color(value: ColorRepresentation) {
    this._threeColor.set(value);
  }

  /** Casts shadows only while `castShadow` is on and the renderer has shadows enabled */
  public override get canCastShadow(): boolean {
    return super.canCastShadow && areShadowsEnabled(this.view3d);
  }

  /**
   * Turns the light toward `target` and hands pixi-3d its shadow settings; the renderer calls it before each frame
   * @internal
   */
  public _prepareRender(): void {
    aimAtTarget(this, this.target);
    if (!this.castShadow) return;
    this._ownShadow = this.shadow;
    swapInPixiShadow(this, this.shadow);
  }

  /**
   * Puts the three shadow back after the frame
   * @internal
   */
  public _finishRender(): void {
    if (this._ownShadow) this.shadow = this._ownShadow;
    this._ownShadow = null;
  }

  /**
   * Frees the light, its shadow camera and its pixi-3d shadow state
   * @param options - pixi-3d's destroy options
   */
  public override destroy(options?: Destroy3DOptions): void {
    if (this.destroyed) return;
    this._finishRender();
    this.shadow.dispose();
    super.destroy(options);
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

import { SpotLight as PixiSpotLight } from '@pixi/3d';
import type { Destroy3DOptions, PointData3D, Container3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { DEFAULT_UP, lookAtPoint } from '../../compat/installObject3DSurface';
import type { Color, ColorRepresentation } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { areShadowsEnabled } from '../../renderer/shadowViews';
import { PerspectiveCamera } from '../scene/PerspectiveCamera';
import { LightColor } from './lightColors';
import { SpotLightShadow } from './LightShadow';
import { LightTarget } from './LightTarget';
import { aimAtTarget, swapInPixiShadow } from './renderHooks';
import type { RenderedLight } from './renderHooks';

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Where pixi-3d's squared ramp starts and ends, in shares of three's penumbra band, so it follows
 * three's smoothstep across the band to within a few grey levels on screen, where the same band would
 * be up to a fifth of the screen's range off
 */
const RAMP_START = -0.05;
const RAMP_END = 0.76;

/**
 * three's `SpotLight` over pixi-3d's, with three's positional constructor
 *
 * The light starts one unit up and shines a cone at `target`, as in three; the renderer turns it
 * toward the target before each frame, since pixi-3d's spot shines along its local -Z. `angle` is
 * the cone's half-angle in radians, pixi-3d's `coneAngle` in degrees, and `distance` is pixi-3d's
 * `range`. pixi-3d softens the edge with a squared ramp where three uses a smoothstep, so the
 * renderer moves pixi-3d's ramp a little while it draws, which keeps a soft edge within a few grey
 * levels of three's. pixi-3d's falloff is
 * always inverse square, three's default `decay` of 2, so `decay` is kept for three's shape and
 * changes nothing; so is `map`, since pixi-3d's spots project no texture. It casts shadows while the
 * renderer's `shadowMap.enabled` is on and its `angle` is under 90 degrees.
 * @example
 * ```tsx
 * <spotLight position={[2, 4, 2]} angle={0.4} penumbra={0.3} intensity={30} castShadow target-position={[0, 0, 0]} />
 * ```
 * @category catalog
 * @standard
 */
export class SpotLight extends PixiSpotLight implements RenderedLight {
  /** Always `true`, as on three's lights */
  public readonly isLight = true;
  /** Always `true`, as on three's spot lights */
  public readonly isSpotLight = true;
  /**
   * What the light points at, as in three: a node at the origin, which takes effect from its
   * `position` once it is added to the scene or its `updateMatrixWorld()` is called, or any node in the scene
   */
  public target: Container3D = new LightTarget();
  /** Kept for three's shape: pixi-3d's spots fall off with the square of the distance, three's default @default 2 */
  public decay: number = 2;
  /** Kept for three's shape: pixi-3d's spots project no texture */
  public map: Texture | null = null;
  /** The shadow's settings, three's `SpotLightShadow` */
  declare public shadow: SpotLightShadow;
  private readonly _threeColor: LightColor;
  private _ownShadow: SpotLightShadow | null = null;
  private _ownConeAngle = 0;
  private _ownPenumbra = 0;

  /**
   * @param color - Light colour
   * @param intensity - Brightness, in candela as in three
   * @param distance - How far the light reaches, or 0 for no limit
   * @param angle - The cone's half-angle in radians, up to π / 2
   * @param penumbra - The share of the cone its edge fades over, 0 to 1
   * @param decay - three's falloff exponent, kept; pixi-3d's is always 2
   */
  constructor(
    color: ColorRepresentation = 0xffffff,
    intensity = 1,
    distance = 0,
    angle = Math.PI / 3,
    penumbra = 0,
    decay = 2,
  ) {
    super({ intensity, range: distance, coneAngle: angle * RAD_TO_DEG, penumbra });
    this._threeColor = new LightColor(color);
    this.decay = decay;
    this.shadow = new SpotLightShadow(new PerspectiveCamera(50, 1, 0.5, 500));
    this.position.copyFrom(DEFAULT_UP);
  }

  // @ts-expect-error -- three's `color` is a three Color where pixi-3d's light has a pixi Color; pixi-3d reads it through LightColor's display channels
  public override get color(): Color {
    return this._threeColor;
  }

  // @ts-expect-error -- takes what three's colour props take, where pixi-3d's takes a ColorSource
  public override set color(value: ColorRepresentation) {
    this._threeColor.set(value);
  }

  /**
   * The cone's half-angle in radians; three's name for pixi-3d's `coneAngle`, which is in degrees
   * @default Math.PI / 3
   */
  // @ts-expect-error -- three's spot `angle` is the cone's, where pixi-3d's nodes have a degree view of their rotation
  public override get angle(): number {
    return this.coneAngle / RAD_TO_DEG;
  }

  // @ts-expect-error -- three's spot `angle` is the cone's, where pixi-3d's nodes have a degree view of their rotation
  public override set angle(value: number) {
    this.coneAngle = value * RAD_TO_DEG;
  }

  /**
   * How far the light reaches, or 0 for no limit; three's name for `range`
   * @default 0
   */
  public get distance(): number {
    return this.range;
  }

  public set distance(value: number) {
    this.range = value;
  }

  /** The light's power in lumens, `intensity` times π, as in three */
  public get power(): number {
    return this.intensity * Math.PI;
  }

  public set power(value: number) {
    this.intensity = value / Math.PI;
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
    this._ownConeAngle = this.coneAngle;
    this._ownPenumbra = this.penumbra;
    if (this.penumbra > 0) this._matchSmoothstep();
    if (!this.castShadow) return;
    this._ownShadow = this.shadow;
    swapInPixiShadow(this, this.shadow);
  }

  /**
   * Puts the three shadow and cone back after the frame
   * @internal
   */
  public _finishRender(): void {
    this.coneAngle = this._ownConeAngle;
    this.penumbra = this._ownPenumbra;
    if (this._ownShadow) this.shadow = this._ownShadow;
    this._ownShadow = null;
  }

  /**
   * Moves pixi-3d's cone edges so its squared ramp across the penumbra follows three's smoothstep:
   * both fade linearly in the cosine of the angle off the axis, between the cone's edge and where the
   * penumbra starts
   */
  private _matchSmoothstep(): void {
    const outer = this.coneAngle / RAD_TO_DEG;
    const outerCos = Math.cos(outer);
    const band = Math.cos(outer * (1 - Math.min(this.penumbra, 1))) - outerCos;
    const rampOuter = Math.acos(Math.min(Math.max(outerCos + RAMP_START * band, -1), 1));
    const rampInner = Math.acos(Math.min(outerCos + RAMP_END * band, 1));
    this.coneAngle = rampOuter * RAD_TO_DEG;
    this.penumbra = 1 - rampInner / rampOuter;
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
    lookAtPoint(this as unknown as Container3D, x, y, z);
  }
}

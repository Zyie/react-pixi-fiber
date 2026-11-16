import type { Box, LightShadow as PixiLightShadow, Matrix4 as PixiMatrix4 } from '@pixi/3d';

import { Matrix4 } from '../../math/Matrix4';
import { Vector2 } from '../../math/Vector2';
import type { OrthographicCamera } from '../scene/OrthographicCamera';
import type { PerspectiveCamera } from '../scene/PerspectiveCamera';
import { ShadowCameraBox } from './ShadowCameraBox';

/** pixi-3d's own depth bias, which keeps its shadow maps as clean as three's are with a bias of 0 */
const PIXI_SHADOW_BIAS = 0.001;

/**
 * three's `LightShadow`: a light's shadow settings, with pixi-3d's shadow options beside them
 *
 * `bias` and `normalBias` are three's. pixi-3d's depth bias pushes the other way, so the renderer
 * hands pixi-3d the bias it needs to look as three does at the same value, and pixi-3d's own normal
 * offset when `normalBias` is 0. `mapSize` sets the view's shadow resolution: pixi-3d keeps one per
 * view, from 512 to 4096, and takes the largest any light asks for. `radius`, `blurSamples` and
 * `intensity` are kept for three's shape; pixi-3d's softness comes from the renderer's
 * `shadowMap.type`, and its shadows are always at full strength.
 *
 * `cascades`, `update`, `maxDistance` and `lambda` are pixi-3d's: cascaded shadow maps that follow
 * the camera, and how often each is redrawn.
 * @example
 * ```tsx
 * <directionalLight castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-bias={-0.0005} />
 * ```
 * @category catalog
 * @advanced
 */
export class LightShadow<
  TCamera extends OrthographicCamera | PerspectiveCamera = OrthographicCamera | PerspectiveCamera,
> {
  /** Always `true`, as on three's shadows */
  public readonly isLightShadow = true;
  /** The camera the shadow map is drawn from, in the light's space */
  public camera: TCamera;
  /** Kept for three's shape: pixi-3d's shadows are always at full strength @default 1 */
  public intensity: number = 1;
  /** Depth offset that keeps a surface from shadowing itself, three's sign: negative moves it toward the light @default 0 */
  public bias: number = 0;
  /** World offset along the surface normal that keeps a surface from shadowing itself; 0 leaves it to pixi-3d @default 0 */
  public normalBias: number = 0;
  /** Kept for three's shape: softness comes from the renderer's `shadowMap.type` @default 1 */
  public radius: number = 1;
  /** Kept for three's shape: softness comes from the renderer's `shadowMap.type` @default 8 */
  public blurSamples: number = 8;
  /** The shadow map's size in texels; the view draws every shadow at the largest size its lights ask for, 512 to 4096 */
  public readonly mapSize: Vector2 = new Vector2(512, 512);
  /** Kept for three's shape: pixi-3d keeps its shadow maps itself */
  public map: null = null;
  /** Kept for three's shape: pixi-3d works the shadow matrix out as it draws */
  public readonly matrix: Matrix4 = new Matrix4();
  /** Kept for three's shape: pixi-3d draws shadows every frame unless `update` says otherwise @default true */
  public autoUpdate: boolean = true;
  /** Kept for three's shape; pixi-3d's `update` and the light's `refreshShadows()` control redraws @default false */
  public needsUpdate: boolean = false;
  /** pixi-3d's cascaded shadow maps for a directional light, 1 to 4, which follow the camera in place of `camera` */
  public cascades: 1 | 2 | 3 | 4 | undefined = undefined;
  /** pixi-3d's redraw rate: 1 draws the shadow every frame, N every Nth, `'manual'` only on `refreshShadows()` @default 1 */
  public update: number | number[] | 'manual' = 1;
  /** pixi-3d's reach of the cascades, in world units; the camera's far plane when omitted */
  public maxDistance: number | undefined = undefined;
  /** pixi-3d's blend of the cascade splits, 0 for even and 1 for logarithmic @default 0.5 */
  public lambda: number = 0.5;
  /** pixi-3d's fixed world box for a directional light's shadow, used in place of `camera` when set */
  public bounds: Box | undefined = undefined;

  private readonly _frameExtents = new Vector2(1, 1);
  /** What pixi-3d reads while it draws, rebuilt from these settings each frame */
  private readonly _pixi: PixiLightShadow = {
    bounds: undefined,
    cascades: undefined,
    update: 1,
    maxDistance: undefined,
    lambda: 0.5,
    bias: undefined,
    normalBias: undefined,
  };

  /** @param camera - The camera the shadow map is drawn from */
  constructor(camera: TCamera) {
    this.camera = camera;
  }

  /** How many maps the shadow takes; 1, as for three's directional and spot shadows */
  public getViewportCount(): number {
    return 1;
  }

  /** The map's size in viewports, `(1, 1)` */
  public getFrameExtents(): Vector2 {
    return this._frameExtents;
  }

  /**
   * Copies another shadow's settings
   * @param source - The shadow to copy
   * @returns This shadow
   */
  public copy(source: LightShadow<TCamera>): this {
    this.intensity = source.intensity;
    this.bias = source.bias;
    this.normalBias = source.normalBias;
    this.radius = source.radius;
    this.blurSamples = source.blurSamples;
    this.mapSize.copyFrom(source.mapSize);
    this.cascades = source.cascades;
    this.update = source.update;
    this.maxDistance = source.maxDistance;
    this.lambda = source.lambda;
    this.bounds = source.bounds;
    return this;
  }

  /** Frees the shadow camera */
  public dispose(): void {
    this.camera.destroy();
  }

  /**
   * The settings pixi-3d reads while it draws: three's bias turned into pixi-3d's, and the box the
   * shadow covers
   * @param lightWorld - The light's world transform, which a directional shadow camera follows
   * @internal
   */
  public _toPixi(lightWorld: PixiMatrix4): PixiLightShadow {
    const pixi = this._pixi;
    pixi.cascades = this.cascades;
    pixi.update = this.update;
    pixi.maxDistance = this.maxDistance;
    pixi.lambda = this.lambda;
    pixi.bias = this.bias === 0 ? undefined : PIXI_SHADOW_BIAS - this.bias;
    pixi.normalBias = this.normalBias === 0 ? undefined : this.normalBias;
    pixi.bounds = this.cascades === undefined ? (this.bounds ?? this._cameraBounds(lightWorld)) : undefined;
    return pixi;
  }

  /**
   * The world box the shadow camera covers, or `undefined` to leave the box to pixi-3d
   * @param _lightWorld - The light's world transform
   */
  protected _cameraBounds(_lightWorld: PixiMatrix4): Box | undefined {
    return undefined;
  }
}

/**
 * three's `DirectionalLightShadow`: an orthographic shadow camera, 10 units across and 0.5 to 500 deep
 *
 * pixi-3d draws the shadow over the camera's frustum, widened by 5% so a caster on its edge still
 * lands inside.
 * @category catalog
 * @advanced
 */
export class DirectionalLightShadow extends LightShadow<OrthographicCamera> {
  /** Always `true`, as on three's directional shadows */
  public readonly isDirectionalLightShadow = true;
  private readonly _box = new ShadowCameraBox();

  /** @param camera - The orthographic camera the shadow is drawn from */
  constructor(camera: OrthographicCamera) {
    super(camera);
  }

  protected override _cameraBounds(lightWorld: PixiMatrix4): Box {
    return this._box.fit(this.camera, lightWorld);
  }
}

/**
 * three's `SpotLightShadow`: a perspective shadow camera along the cone
 *
 * pixi-3d draws a spot shadow over the light's whole cone, from 1 unit in front of the light to its
 * `distance` (1000 when it has none), so the camera's `fov`, `near` and `far` and `focus` are kept
 * for three's shape. A caster nearer the light than 1 unit casts no shadow.
 * @category catalog
 * @advanced
 */
export class SpotLightShadow extends LightShadow<PerspectiveCamera> {
  /** Always `true`, as on three's spot shadows */
  public readonly isSpotLightShadow = true;
  /** Kept for three's shape: the share of the cone the shadow camera covers @default 1 */
  public focus: number = 1;
}

/**
 * three's `PointLightShadow`, kept for three's shape: pixi-3d's point lights cast no shadows
 * @category catalog
 * @advanced
 */
export class PointLightShadow extends LightShadow<PerspectiveCamera> {
  /** Always `true`, as on three's point shadows */
  public readonly isPointLightShadow = true;
}

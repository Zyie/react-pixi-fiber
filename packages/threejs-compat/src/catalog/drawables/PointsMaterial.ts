import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { readSlot, writeSlot } from '../materials/textureSlots';
import { initThreeMaterial, threeDescriptor } from '../materials/threeMaterial';
import type { MaterialParameters } from '../materials/threeMaterial';

/**
 * three's `PointsMaterial` parameters
 * @category catalog
 * @standard
 */
export interface PointsMaterialParameters extends MaterialParameters {
  /** Colour */
  color?: ColorRepresentation;
  /** Texture each point shows, multiplied by `color` */
  map?: Texture | null;
  /** Opacity in the green channel, multiplying `opacity` */
  alphaMap?: Texture | null;
  /** Size of a point in pixels, or in world units scaled as three scales them with `sizeAttenuation` */
  size?: number;
  /** Whether points farther from a perspective camera are drawn smaller */
  sizeAttenuation?: boolean;
}

/**
 * Spreads each point's four vertices into a camera-facing square, the way three sizes `gl_PointSize`
 *
 * With `sizeAttenuation` and a perspective camera a point spans `size * height / 2 / depth` pixels,
 * which is `size / 2` in clip space vertically, whatever the canvas; otherwise it spans `size` pixels.
 * The viewport's size in pixels is read from the light-tile transform, which pixi-3d sets to 16 tiles
 * across the view and 9 down. Alpha is multiplied by the alpha map's green channel.
 */
const pointsBit: ShaderBit = {
  name: 'threePoints',
  textures: ['alphaMap'],
  bindings: { material: { pointsParams: 'vec2<f32>' } },
  gpu: {
    vertex: {
      afterTransform: /* wgsl */ `
  let pointCorner = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let pointProjection = camera.uProjectionMatrix;
  if (material.pointsParams.y > 0.5 && pointProjection[3][3] == 0.0) {
    let pointAspect = pointProjection[1][1] / pointProjection[0][0];
    clipPosition = vec4<f32>(clipPosition.xy + pointCorner * vec2<f32>(0.5 / pointAspect, 0.5) * material.pointsParams.x, clipPosition.zw);
  } else {
    let pointViewport = vec2<f32>(16.0 / camera.uLightTileTransform.x, 9.0 / abs(camera.uLightTileTransform.y));
    clipPosition = vec4<f32>(clipPosition.xy + pointCorner * material.pointsParams.x / pointViewport * clipPosition.w, clipPosition.zw);
  }
`,
    },
    fragment: {
      material: /* wgsl */ `
  alpha *= sampleAlphaMap(input.vUV).g;
`,
    },
  },
  gl: {
    vertex: {
      afterTransform: /* glsl */ `
  vec2 pointCorner = vec2(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  if (material.pointsParams.y > 0.5 && uProjectionMatrix[3][3] == 0.0) {
    float pointAspect = uProjectionMatrix[1][1] / uProjectionMatrix[0][0];
    gl_Position.xy += pointCorner * vec2(0.5 / pointAspect, 0.5) * material.pointsParams.x;
  } else {
    vec2 pointViewport = vec2(16.0 / uLightTileTransform.x, 9.0 / abs(uLightTileTransform.y));
    gl_Position.xy += pointCorner * material.pointsParams.x / pointViewport * gl_Position.w;
  }
`,
    },
    fragment: {
      material: /* glsl */ `
  alpha *= sampleAlphaMap(vUV).g;
`,
    },
  },
};

/**
 * three's `PointsMaterial`, unlit squares of `size` for a `<points>`, over pixi-3d's `FlatMaterial`
 *
 * pixi-3d draws no sized points, so each point is drawn as a camera-facing square of two triangles,
 * sized as three sizes them. Without `sizeAttenuation`, `size` is in the canvas's pixels, which three
 * multiplies by the pixel ratio.
 * @example
 * ```tsx
 * <points>
 *   <bufferGeometry>
 *     <bufferAttribute attach="attributes-position" args={[positions, 3]} />
 *   </bufferGeometry>
 *   <pointsMaterial size={0.1} color="hotpink" />
 * </points>
 * ```
 * @category catalog
 * @standard
 */
export class PointsMaterial extends FlatMaterial {
  /** Always `true`, as on three's `PointsMaterial` */
  public readonly isPointsMaterial = true;
  /** three's class name */
  public type = 'PointsMaterial';
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: PointsMaterialParameters = {}) {
    super({ extraBits: [pointsBit] });
    this.state.culling = false;
    this.size = 1;
    this.sizeAttenuation = true;
    this._color = new Color(0xffffff)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
    });
    this._color._onChangeCallback();
    initThreeMaterial(this, parameters);
  }

  /** Colour, in the working colour space; pixi-3d's `baseColor` follows it */
  public get color(): Color {
    return this._color;
  }

  public set color(value: ColorRepresentation) {
    this._color.set(value);
  }

  /** Size of a point @default 1 */
  public get size(): number {
    return this._params[0];
  }

  public set size(value: number) {
    this._params[0] = value;
    this.update();
  }

  /** Whether points farther from a perspective camera are drawn smaller @default true */
  public get sizeAttenuation(): boolean {
    return this._params[1] > 0.5;
  }

  public set sizeAttenuation(value: boolean) {
    this._params[1] = value ? 1 : 0;
    this.update();
  }

  /** Texture each point shows, multiplied by `color`, or `null` */
  public get map(): Texture | null {
    return readSlot(this, 'baseColor');
  }

  public set map(value: Texture | null) {
    writeSlot(this, 'baseColor', value);
  }

  /** Opacity in the green channel, multiplying `opacity`, or `null` */
  public get alphaMap(): Texture | null {
    return readSlot(this, 'alphaMap');
  }

  public set alphaMap(value: Texture | null) {
    writeSlot(this, 'alphaMap', value);
  }

  private get _params(): Float32Array {
    return (this.data as unknown as { pointsParams: Float32Array }).pointsParams;
  }

  /**
   * pixi-3d's flat shader, with three's back-side handling
   * @param view - The view about to draw the material
   * @advanced
   */
  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view));
  }
}

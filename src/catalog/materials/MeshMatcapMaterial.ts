import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { readSlot, writeSlot } from './textureSlots';
import { initThreeMaterial, threeDescriptor } from './threeMaterial';
import type { MaterialParameters } from './threeMaterial';

/**
 * three's `MeshMatcapMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshMatcapMaterialParameters extends MaterialParameters {
  /** Colour, multiplying the matcap */
  color?: ColorRepresentation;
  /** The matcap: a lit sphere, looked up by the way the surface faces the camera */
  matcap?: Texture | null;
  /** Colour texture, multiplied by `color` */
  map?: Texture | null;
  /** Whether each triangle is shaded with its face normal */
  flatShading?: boolean;
}

/**
 * three's matcap lookup: the camera-space normal, projected on a basis facing the eye, picks a point
 * of the matcap; without one, a grey ramp from 0.2 to 0.8 bottom to top. The image's top is three's
 * `v = 1`, pixi's `v = 0`.
 */
const matcapBit: ShaderBit = {
  name: 'threeMatcap',
  textures: ['matcap'],
  bindings: { material: { matcapSet: 'f32' } },
  gpu: {
    fragment: {
      material: /* wgsl */ `
  let matcapEye = normalize(-(camera.uViewMatrix * vec4<f32>(input.vPosition, 1.0)).xyz);
  let matcapNormal = normalize((camera.uViewMatrix * vec4<f32>(normal, 0.0)).xyz);
  let matcapX = normalize(vec3<f32>(matcapEye.z, 0.0, -matcapEye.x));
  let matcapY = cross(matcapEye, matcapX);
  let matcapUv = vec2<f32>(dot(matcapX, matcapNormal), dot(matcapY, matcapNormal)) * 0.495 + 0.5;
  var matcapColor = vec3<f32>(mix(0.2, 0.8, matcapUv.y));
  let matcapTex = sampleMatcap(vec2<f32>(matcapUv.x, 1.0 - matcapUv.y)).rgb;
  if (material.matcapSet > 0.5) {
    matcapColor = pow(matcapTex, vec3<f32>(2.2));
  }
  albedo *= matcapColor;
`,
    },
  },
  gl: {
    fragment: {
      material: /* glsl */ `
  vec3 matcapEye = normalize(-(uViewMatrix * vec4(vPosition, 1.0)).xyz);
  vec3 matcapNormal = normalize((uViewMatrix * vec4(normal, 0.0)).xyz);
  vec3 matcapX = normalize(vec3(matcapEye.z, 0.0, -matcapEye.x));
  vec3 matcapY = cross(matcapEye, matcapX);
  vec2 matcapUv = vec2(dot(matcapX, matcapNormal), dot(matcapY, matcapNormal)) * 0.495 + 0.5;
  vec3 matcapColor = vec3(mix(0.2, 0.8, matcapUv.y));
  vec3 matcapTex = sampleMatcap(vec2(matcapUv.x, 1.0 - matcapUv.y)).rgb;
  if (material.matcapSet > 0.5) {
    matcapColor = pow(matcapTex, vec3(2.2));
  }
  albedo *= matcapColor;
`,
    },
  },
};

/**
 * three's `MeshMatcapMaterial`, lit by a matcap image instead of lights, over pixi-3d's `FlatMaterial`
 *
 * `color` is a three `Color`. Lights don't reach it, as in three; tone mapping does. Its `normalMap`,
 * `bumpMap` and `displacementMap` aren't taken.
 * @example
 * ```tsx
 * <meshMatcapMaterial matcap={matcapTexture} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshMatcapMaterial extends FlatMaterial {
  /** Always `true`, as on three's `MeshMatcapMaterial` */
  public readonly isMeshMatcapMaterial = true;
  /** three's class name */
  public type = 'MeshMatcapMaterial';
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshMatcapMaterialParameters = {}) {
    super({ extraBits: [matcapBit] });
    this._color = new Color(0xffffff)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
    });
    this._color._onChangeCallback();
    initThreeMaterial(this, parameters);
  }

  /** Colour, multiplying the matcap; pixi-3d's `baseColor` follows it */
  public get color(): Color {
    return this._color;
  }

  public set color(value: ColorRepresentation) {
    this._color.set(value);
  }

  /** The matcap, or `null` for a grey ramp */
  public get matcap(): Texture | null {
    return readSlot(this, 'matcap');
  }

  public set matcap(value: Texture | null) {
    writeSlot(this, 'matcap', value);
    (this.data as unknown as { matcapSet: number }).matcapSet = value ? 1 : 0;
    this.update();
  }

  /** Colour texture, multiplied by `color`, or `null` for none */
  public get map(): Texture | null {
    return readSlot(this, 'baseColor');
  }

  public set map(value: Texture | null) {
    writeSlot(this, 'baseColor', value);
  }

  /**
   * pixi-3d's flat shader with three's matcap lookup
   * @param view - The view about to draw the material
   * @advanced
   */
  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view));
  }
}

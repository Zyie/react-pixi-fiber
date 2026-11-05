import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { readSlot, writeSlot } from './textureSlots';
import { initThreeMaterial, threeDescriptor } from './threeMaterial';
import type { MaterialParameters } from './threeMaterial';

/**
 * three's `MeshBasicMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshBasicMaterialParameters extends MaterialParameters {
  /** Colour */
  color?: ColorRepresentation;
  /** Colour texture, multiplied by `color` */
  map?: Texture | null;
  /** Opacity in the green channel, multiplying `opacity` */
  alphaMap?: Texture | null;
}

/**
 * Decodes the base colour texture from sRGB to linear with pixi-3d's 2.2 gamma, as its lit materials
 * do, so a textured basic material goes through tone mapping as three's does, and multiplies alpha by
 * the alpha map's green channel. `FlatMaterial`'s own bit shows the texture as authored; this follows
 * it and scales `albedo` by `decode(t) / t` per channel.
 */
const basicMapsBit: ShaderBit = {
  name: 'meshBasicMaps',
  textures: ['alphaMap'],
  gpu: {
    fragment: {
      material: /* wgsl */ `
  albedo *= pow(baseTex.rgb, vec3<f32>(2.2)) / max(baseTex.rgb, vec3<f32>(1e-4));
  alpha *= sampleAlphaMap(input.vUV).g;
`,
    },
  },
  gl: {
    fragment: {
      material: /* glsl */ `
  albedo *= pow(baseTex.rgb, vec3(2.2)) / max(baseTex.rgb, vec3(1e-4));
  alpha *= sampleAlphaMap(vUV).g;
`,
    },
  },
};

/**
 * three's `MeshBasicMaterial`, an unlit colour, over pixi-3d's `FlatMaterial`
 *
 * `color` is a three `Color`, in the working colour space as in three, so
 * `material.color.set('hotpink')`, `color="hotpink"` and `color-r={1}` all work. Unlike pixi-3d's
 * `FlatMaterial`, it goes through the renderer's tone mapping unless `toneMapped` is off, as three's
 * does. Its `aoMap`, `lightMap`, `specularMap` and `envMap` aren't taken.
 * @example
 * ```tsx
 * <meshBasicMaterial color="red" />
 * ```
 * @category catalog
 * @standard
 */
export class MeshBasicMaterial extends FlatMaterial {
  /** Always `true`, as on three's `MeshBasicMaterial` */
  public readonly isMeshBasicMaterial = true;
  /** three's class name */
  public type = 'MeshBasicMaterial';
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshBasicMaterialParameters = {}) {
    super({ extraBits: [basicMapsBit] });
    this.toneMapped = true;
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

  /** Colour texture, multiplied by `color`, or `null` for none; pixi-3d's `textures.baseColor` */
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

  /**
   * pixi-3d's flat shader, with three's back-side handling
   * @param view - The view about to draw the material
   * @advanced
   */
  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view));
  }
}

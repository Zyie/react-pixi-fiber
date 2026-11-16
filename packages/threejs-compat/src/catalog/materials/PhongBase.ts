import { NORMAL_MAP, PhongMaterial } from '@pixi/3d';
import type { EmissiveProps, ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import type { Vector2 } from '../../math/Vector2';
import { observedVector2, readSlot, writeSlot } from './textureSlots';
import { threeDescriptor } from './threeMaterial';
import type { MaterialParameters } from './threeMaterial';

/**
 * The parameters three's Phong, Lambert and toon materials share
 * @category catalog
 * @advanced
 */
export interface PhongBaseParameters extends MaterialParameters {
  /** Diffuse colour */
  color?: ColorRepresentation;
  /** Colour the surface gives off whatever the lighting */
  emissive?: ColorRepresentation;
  /** Scales `emissive` */
  emissiveIntensity?: number;
  /** Colour texture, multiplied by `color` */
  map?: Texture | null;
  /** Tangent-space normal map */
  normalMap?: Texture | null;
  /** How strongly the normal map bends the normal */
  normalScale?: Vector2 | [number, number];
  /** Glow texture, multiplying `emissive` */
  emissiveMap?: Texture | null;
  /** Opacity in the green channel, multiplying `opacity` */
  alphaMap?: Texture | null;
  /** Whether each triangle is shaded with its face normal */
  flatShading?: boolean;
}

/** Multiplies alpha by the alpha map's green channel */
const alphaMapBit: ShaderBit = {
  name: 'threeAlphaMap',
  textures: ['alphaMap'],
  gpu: { fragment: { material: /* wgsl */ '  alpha *= sampleAlphaMap(input.vUV).g;\n' } },
  gl: { fragment: { material: /* glsl */ '  alpha *= sampleAlphaMap(vUV).g;\n' } },
};

/**
 * What three's `MeshPhongMaterial`, `MeshLambertMaterial` and `MeshToonMaterial` share, over pixi-3d's
 * `PhongMaterial`: colours as three `Color`s, the maps, and three's back-side handling. Built with
 * pixi-3d's emissive and specular-map features on, since pixi-3d can't turn a feature on later.
 * @internal
 */
export class PhongBase extends PhongMaterial {
  /**
   * Colour the surface gives off whatever the lighting, three's `emissive`; black for none
   */
  // @ts-expect-error -- three's `emissive` is a Color where pixi-3d's PhongMaterial has its EmissiveProps; the alias keeps those privately
  declare public readonly emissive: Color;
  private readonly _color: Color;
  private readonly _emissiveProps: EmissiveProps;
  /** Missing while pixi-3d's constructor runs, which sets `normalScale` before the alias makes it */
  private readonly _normalScale?: Vector2;
  private readonly _swaps?: ReadonlyMap<ShaderBit, ShaderBit>;

  /**
   * @param extraBits - Bits the subclass adds, after the alpha map's
   * @param swaps - pixi-3d's bits and the subclass's bits that replace them
   */
  constructor(extraBits: ShaderBit[] = [], swaps?: ReadonlyMap<ShaderBit, ShaderBit>) {
    super({
      emissive: { color: 0x000000, strength: 1 },
      specularTexture: Texture.WHITE,
      extraBits: [alphaMapBit, ...extraBits],
    });
    this._swaps = swaps;
    const props = (this as unknown as { emissive: EmissiveProps }).emissive;
    const glow = new Color(0x000000)._onChange(() => {
      props.color = toPixiColor(glow);
    });

    this._emissiveProps = props;
    this._color = new Color(0xffffff)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
    });
    this._normalScale = observedVector2(1, 1, (scale) => {
      this.data.normalScale = scale.x;
      this.update();
    });
    this._color._onChangeCallback();
    glow._onChangeCallback();
    Object.defineProperty(this, 'emissive', {
      configurable: true,
      enumerable: true,
      get: () => glow,
      set: (value: ColorRepresentation | undefined) => {
        if (value !== undefined) glow.set(value);
      },
    });
  }

  /** Diffuse colour, in the working colour space; pixi-3d's `baseColor` follows it */
  public get color(): Color {
    return this._color;
  }

  public set color(value: ColorRepresentation) {
    this._color.set(value);
  }

  /** Scales `emissive` @default 1 */
  public get emissiveIntensity(): number {
    return this._emissiveProps.strength;
  }

  public set emissiveIntensity(value: number) {
    this._emissiveProps.strength = value;
  }

  /** Colour texture, multiplied by `color`, or `null` for none */
  public get map(): Texture | null {
    return readSlot(this, 'baseColor');
  }

  public set map(value: Texture | null) {
    writeSlot(this, 'baseColor', value);
  }

  /** Tangent-space normal map, or `null` for none */
  public get normalMap(): Texture | null {
    return readSlot(this, 'normal', NORMAL_MAP);
  }

  public set normalMap(value: Texture | null) {
    writeSlot(this, 'normal', value, NORMAL_MAP);
  }

  /** How strongly the normal map bends the normal; pixi-3d takes its `x` for both axes */
  // @ts-expect-error -- three's normalScale is a Vector2 where pixi-3d's is one number; the alias writes pixi-3d's from `x`
  public override get normalScale(): Vector2 {
    return this._normalScale!;
  }

  // @ts-expect-error -- the setter takes three's Vector2 or a pair, and pixi-3d's number
  public override set normalScale(value: Vector2 | [number, number] | number) {
    if (!this._normalScale) return;
    if (typeof value === 'number') this._normalScale.set(value, value);
    else if (Array.isArray(value)) this._normalScale.set(value[0], value[1]);
    else this._normalScale.set(value.x, value.y);
  }

  /** Glow texture, multiplying `emissive`, or `null` */
  public get emissiveMap(): Texture | null {
    return readSlot(this, 'emissive');
  }

  public set emissiveMap(value: Texture | null) {
    writeSlot(this, 'emissive', value);
  }

  /** Opacity in the green channel, multiplying `opacity`, or `null` */
  public get alphaMap(): Texture | null {
    return readSlot(this, 'alphaMap');
  }

  public set alphaMap(value: Texture | null) {
    writeSlot(this, 'alphaMap', value);
  }

  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view), this._swaps);
  }
}

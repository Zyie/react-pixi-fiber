import { Material3D, NORMAL_MAP, pbrLightingBit, pbrMaterialBit } from '@pixi/3d';
import type { EmissiveProps, ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import type { Vector2 } from '../../math/Vector2';
import { observedVector2, readSlot, writeSlot } from './textureSlots';
import { initThreeMaterial, threeDescriptor } from './threeMaterial';
import type { MaterialParameters } from './threeMaterial';
import { threeStandardLightingBit, threeStandardMapsBit, threeStandardMaterialBit } from './threeStandardBits';

/**
 * three's `MeshStandardMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshStandardMaterialParameters extends MaterialParameters {
  /** Base colour */
  color?: ColorRepresentation;
  /** Colour the surface gives off whatever the lighting, black for none */
  emissive?: ColorRepresentation;
  /** Scales `emissive` */
  emissiveIntensity?: number;
  /** 0 for a mirror, 1 for fully rough */
  roughness?: number;
  /** 0 for a dielectric, 1 for a metal */
  metalness?: number;
  /** Colour texture, multiplied by `color` */
  map?: Texture | null;
  /** Tangent-space normal map */
  normalMap?: Texture | null;
  /** How strongly the normal map bends the normal */
  normalScale?: Vector2 | [number, number];
  /** Roughness in the green channel, multiplying `roughness` */
  roughnessMap?: Texture | null;
  /** Metalness in the blue channel, multiplying `metalness` */
  metalnessMap?: Texture | null;
  /** Ambient occlusion in the red channel */
  aoMap?: Texture | null;
  /** How strongly `aoMap` darkens */
  aoMapIntensity?: number;
  /** Glow texture, multiplying `emissive` */
  emissiveMap?: Texture | null;
  /** Opacity in the green channel, multiplying `opacity` */
  alphaMap?: Texture | null;
  /** Kept for three's shape: the environment's strength is the scene's */
  envMapIntensity?: number;
  /** Whether each triangle is shaded with its face normal */
  flatShading?: boolean;
}

const STANDARD_SWAPS: ReadonlyMap<ShaderBit, ShaderBit> = new Map([
  [pbrMaterialBit, threeStandardMaterialBit],
  [pbrLightingBit, threeStandardLightingBit],
]);

/**
 * three's `MeshStandardMaterial` over pixi-3d's PBR `Material3D`, shaded as three shades it
 *
 * Starts as three's does: white, fully rough and not metallic. Its shader is pixi-3d's PBR with
 * three's lighting in place of pixi-3d's: three's multi-scatter energy compensation, its diffuse
 * Fresnel and its energy-conserving ambient light, so metal looks as it does in three. The maps read
 * the channels three's do: roughness green, metalness blue, ambient occlusion red, alpha green.
 *
 * `color` and `emissive` are three `Color`s, so `material.color.set('hotpink')`, `color="hotpink"`
 * and `color-r={1}` all work. It is built with pixi-3d's emissive feature on, black until you set
 * `emissive`, since pixi-3d can't turn a feature on later. `normalScale` bends both axes by its `x`:
 * pixi-3d takes one scale. `envMapIntensity` is kept and does nothing; the environment's strength is
 * the scene's.
 * @example
 * ```tsx
 * <meshStandardMaterial color="hotpink" roughness={0.25} metalness={0.5} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshStandardMaterial extends Material3D {
  /** Always `true`, as on three's `MeshStandardMaterial` */
  public readonly isMeshStandardMaterial: boolean = true;
  /** three's class name */
  public type = 'MeshStandardMaterial';
  /** Kept for three's shape: the environment's strength is the scene's */
  public envMapIntensity: number = 1;
  /**
   * Colour the surface gives off whatever the lighting, three's `emissive`; black for none. pixi-3d's
   * own `emissive` controls are kept inside, and `emissiveIntensity` scales it.
   */
  // @ts-expect-error -- three's `emissive` is a Color where pixi-3d's Material3D has its EmissiveProps; the alias keeps those privately
  declare public readonly emissive: Color;
  private readonly _color: Color;
  /** pixi-3d's emissive controls, which the physical material makes again when it lays out its features */
  protected _emissiveProps: EmissiveProps;
  /** Missing while pixi-3d's constructor runs, which sets `normalScale` before the alias makes it */
  private readonly _normalScale?: Vector2;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshStandardMaterialParameters = {}) {
    super({
      roughness: 1,
      metallic: 0,
      emissive: { color: 0x000000, strength: 1 },
      extraBits: [threeStandardMapsBit],
    });
    this._emissiveProps = (this as unknown as { emissive: EmissiveProps }).emissive;
    const glow = new Color(0x000000)._onChange(() => {
      this._emissiveProps.color = toPixiColor(glow);
    });

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
    initThreeMaterial(this, parameters);
  }

  /** Base colour, in the working colour space; pixi-3d's `baseColor` follows it */
  public get color(): Color {
    return this._color;
  }

  public set color(value: ColorRepresentation) {
    this._color.set(value);
  }

  /** Scales `emissive`; pixi-3d's emissive `strength` @default 1 */
  public get emissiveIntensity(): number {
    return this._emissiveProps.strength;
  }

  public set emissiveIntensity(value: number) {
    this._emissiveProps.strength = value;
  }

  /** 0 for a dielectric, 1 for a metal; pixi-3d's `metallic` */
  public get metalness(): number {
    return this.metallic;
  }

  public set metalness(value: number) {
    this.metallic = value;
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

  /** Roughness in the green channel, multiplying `roughness`, or `null`; pixi-3d's `metallicRoughness` slot */
  public get roughnessMap(): Texture | null {
    return readSlot(this, 'metallicRoughness');
  }

  public set roughnessMap(value: Texture | null) {
    writeSlot(this, 'metallicRoughness', value);
  }

  /** Metalness in the blue channel, multiplying `metalness`, or `null` */
  public get metalnessMap(): Texture | null {
    return readSlot(this, 'metalnessMap');
  }

  public set metalnessMap(value: Texture | null) {
    writeSlot(this, 'metalnessMap', value);
  }

  /** Ambient occlusion in the red channel, or `null`; pixi-3d's `occlusion` slot */
  public get aoMap(): Texture | null {
    return readSlot(this, 'occlusion');
  }

  public set aoMap(value: Texture | null) {
    writeSlot(this, 'occlusion', value);
  }

  /** How strongly `aoMap` darkens, 0 to 1; pixi-3d's `occlusionStrength` @default 1 */
  public get aoMapIntensity(): number {
    return this.occlusionStrength;
  }

  public set aoMapIntensity(value: number) {
    this.occlusionStrength = value;
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

  /**
   * pixi-3d's PBR shader with three's material and lighting bits in its place
   * @param view - The view about to draw the material
   * @advanced
   */
  public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
    return threeDescriptor(this, super.getPrimaryDescriptor(view), STANDARD_SWAPS);
  }
}

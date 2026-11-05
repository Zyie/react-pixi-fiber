import {
  EmissivePropsClass,
  RenderPassBit,
  anisotropyBit,
  clearcoatBit,
  emissiveBit,
  iridescenceBit,
  pbrMaterialBit,
  sheenBit,
  specularBit,
  transmissionBit,
  uvTransformBit,
} from '@pixi/3d';
import type { ShaderBit } from '@pixi/3d';
import { warn } from 'pixi.js';
import type { Texture } from 'pixi.js';

import { invalidateMaterial } from '../../compat/materialSurface';
import { Color } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { MeshStandardMaterial } from './MeshStandardMaterial';
import type { MeshStandardMaterialParameters } from './MeshStandardMaterial';
import { initThreeMaterial } from './threeMaterial';

/**
 * three's `MeshPhysicalMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshPhysicalMaterialParameters extends MeshStandardMaterialParameters {
  /** Strength of a clear lacquer layer over the surface, 0 to 1 */
  clearcoat?: number;
  /** Roughness of the clear coat */
  clearcoatRoughness?: number;
  /** Strength of a velvet-like sheen, 0 to 1 */
  sheen?: number;
  /** Colour of the sheen */
  sheenColor?: ColorRepresentation;
  /** Roughness of the sheen */
  sheenRoughness?: number;
  /** How much light passes through, 0 to 1, as glass */
  transmission?: number;
  /** Thickness of the volume under the surface, for refraction and attenuation */
  thickness?: number;
  /** Colour light turns as it travels `attenuationDistance` through the volume */
  attenuationColor?: ColorRepresentation;
  /** How far light travels through the volume before it turns `attenuationColor` */
  attenuationDistance?: number;
  /** Strength of a thin-film rainbow, 0 to 1, as on a soap bubble */
  iridescence?: number;
  /** Index of refraction of the thin film */
  iridescenceIOR?: number;
  /** Thinnest and thickest film, in nanometres */
  iridescenceThicknessRange?: [number, number];
  /** Index of refraction of the surface, 1 to 2.333 */
  ior?: number;
  /** Strength of the dielectric specular reflection */
  specularIntensity?: number;
  /** Tint of the dielectric specular reflection */
  specularColor?: ColorRepresentation;
  /** Strength of a brushed, stretched highlight, 0 to 1 */
  anisotropy?: number;
  /** Direction of the brushing, in radians */
  anisotropyRotation?: number;
}

/** pixi-3d's feature bits in the order its `Material3D` lists them, which the shader relies on */
const FEATURES = {
  specular: specularBit,
  iridescence: iridescenceBit,
  transmission: transmissionBit,
  clearcoat: clearcoatBit,
  sheen: sheenBit,
  anisotropy: anisotropyBit,
} as const;

type Feature = keyof typeof FEATURES;

/** The data fields a layout change has to carry over to the new `data` */
const KEPT_FIELDS = [
  'pbrParams',
  'normalScale',
  'emissive',
  'emissiveStrength',
  'transmissionVolume',
  'attenuationColorIrid',
] as const;

/** The pixi-3d internals the physical material lays its features out with */
interface Material3DInternals {
  _featureBits: ShaderBit[];
  _uploadQueue: unknown;
  _passBit: number;
  _slotByName: Record<string, number>;
  _textures: Texture[];
  data: Record<string, number | Float32Array | undefined>;
}

let warned = false;

/**
 * three's `MeshPhysicalMaterial` over pixi-3d's PBR `Material3D`, with pixi-3d's own clear coat,
 * sheen, transmission, iridescence, specular and anisotropy
 *
 * pixi-3d builds a feature into the shader only when the material is laid out, so each turns on the
 * first time its strength is set above 0 before the material is first drawn: in the constructor's
 * parameters or as a JSX prop, which r3f sets before the first frame. Setting one for the first time
 * after that warns and does nothing until the material is built again; once on, a feature stays on
 * and follows its value. Transmission draws in pixi-3d's transmission pass, over a copy of the
 * opaque picture. The physical maps (`clearcoatMap`, `sheenColorMap`, `transmissionMap`, ...) and
 * `dispersion` aren't taken, nor, as on {@link MeshStandardMaterial}, are `displacementMap`, `bumpMap`,
 * `lightMap` and `envMap`.
 * @example
 * ```tsx
 * <meshPhysicalMaterial color="crimson" clearcoat={1} clearcoatRoughness={0.1} metalness={0.2} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshPhysicalMaterial extends MeshStandardMaterial {
  /** Always `true`, as on three's `MeshPhysicalMaterial` */
  public readonly isMeshPhysicalMaterial = true;
  /** Kept for three's shape */
  public dispersion: number = 0;
  /** Strength of a clear lacquer layer, 0 to 1 @default 0 */
  // @ts-expect-error -- three's `clearcoat` is a strength where pixi-3d's Material3D keeps its clear coat controls; the alias writes pixi-3d's data itself
  declare public clearcoat: number;
  /** Strength of the sheen, 0 to 1 @default 0 */
  // @ts-expect-error -- three's `sheen` is a strength where pixi-3d's Material3D keeps its sheen controls
  declare public sheen: number;
  /** How much light passes through, 0 to 1 @default 0 */
  // @ts-expect-error -- three's `transmission` is a strength where pixi-3d's Material3D keeps its transmission controls
  declare public transmission: number;
  /** Strength of the thin-film rainbow, 0 to 1 @default 0 */
  // @ts-expect-error -- three's `iridescence` is a strength where pixi-3d's Material3D keeps its iridescence controls
  declare public iridescence: number;
  /** Strength of the brushed highlight, 0 to 1 @default 0 */
  // @ts-expect-error -- three's `anisotropy` is a strength where pixi-3d's Material3D keeps its anisotropy controls
  declare public anisotropy: number;
  private readonly _enabled = new Set<Feature>();
  private readonly _values = {
    clearcoat: 0,
    clearcoatRoughness: 0,
    sheen: 0,
    sheenRoughness: 1,
    transmission: 0,
    thickness: 0,
    attenuationDistance: Infinity,
    iridescence: 0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400] as [number, number],
    specularIntensity: 1,
    anisotropy: 0,
    anisotropyRotation: 0,
  };
  private readonly _sheenColor: Color;
  private readonly _specularColor: Color;
  private readonly _attenuationColor: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshPhysicalMaterialParameters = {}) {
    super();
    this.type = 'MeshPhysicalMaterial';
    this._sheenColor = new Color(0x000000)._onChange(() => this._sync('sheen'));
    this._specularColor = new Color(0xffffff)._onChange(() => this._sync('specular', true));
    this._attenuationColor = new Color(0xffffff)._onChange(() => this._sync('transmission'));
    for (const feature of ['clearcoat', 'sheen', 'transmission', 'iridescence', 'anisotropy'] as const) {
      Object.defineProperty(this, feature, {
        configurable: true,
        enumerable: true,
        get: () => this._values[feature],
        set: (value: number) => {
          this._set(feature, feature, value, value > 0);
        },
      });
    }
    initThreeMaterial(this, parameters);
  }

  /** Roughness of the clear coat @default 0 */
  public get clearcoatRoughness(): number {
    return this._values.clearcoatRoughness;
  }

  public set clearcoatRoughness(value: number) {
    this._set('clearcoatRoughness', 'clearcoat', value);
  }

  /** Colour of the sheen */
  public get sheenColor(): Color {
    return this._sheenColor;
  }

  public set sheenColor(value: ColorRepresentation) {
    this._sheenColor.set(value);
  }

  /** Roughness of the sheen @default 1 */
  public get sheenRoughness(): number {
    return this._values.sheenRoughness;
  }

  public set sheenRoughness(value: number) {
    this._set('sheenRoughness', 'sheen', value);
  }

  /** Thickness of the volume under the surface @default 0 */
  public get thickness(): number {
    return this._values.thickness;
  }

  public set thickness(value: number) {
    this._set('thickness', 'transmission', value);
  }

  /** Colour light turns as it travels `attenuationDistance` through the volume */
  public get attenuationColor(): Color {
    return this._attenuationColor;
  }

  public set attenuationColor(value: ColorRepresentation) {
    this._attenuationColor.set(value);
  }

  /** How far light travels before it turns `attenuationColor` @default Infinity */
  public get attenuationDistance(): number {
    return this._values.attenuationDistance;
  }

  public set attenuationDistance(value: number) {
    this._set('attenuationDistance', 'transmission', value);
  }

  /** Index of refraction of the thin film @default 1.3 */
  public get iridescenceIOR(): number {
    return this._values.iridescenceIOR;
  }

  public set iridescenceIOR(value: number) {
    this._set('iridescenceIOR', 'iridescence', value);
  }

  /** Thinnest and thickest film, in nanometres @default [100, 400] */
  public get iridescenceThicknessRange(): [number, number] {
    return this._values.iridescenceThicknessRange;
  }

  public set iridescenceThicknessRange(value: [number, number]) {
    this._values.iridescenceThicknessRange = [value[0], value[1]];
    this._sync('iridescence');
  }

  /** Strength of the dielectric specular reflection @default 1 */
  public get specularIntensity(): number {
    return this._values.specularIntensity;
  }

  public set specularIntensity(value: number) {
    this._set('specularIntensity', 'specular', value, value !== 1);
  }

  /** Tint of the dielectric specular reflection */
  public get specularColor(): Color {
    return this._specularColor;
  }

  public set specularColor(value: ColorRepresentation) {
    this._specularColor.set(value);
  }

  /** Direction of the brushing, in radians @default 0 */
  public get anisotropyRotation(): number {
    return this._values.anisotropyRotation;
  }

  public set anisotropyRotation(value: number) {
    this._set('anisotropyRotation', 'anisotropy', value);
  }

  /** three's reflectivity, the specular strength `ior` gives a dielectric, 0 to 1 */
  public get reflectivity(): number {
    return Math.min(Math.max((2.5 * (this.ior - 1)) / (this.ior + 1), 0), 1);
  }

  public set reflectivity(value: number) {
    const clamped = Math.min(Math.max(value, 0), 1);
    this.ior = (1 + 0.4 * clamped) / (1 - 0.4 * clamped);
  }

  /**
   * Stores a value and writes its feature's data, turning the feature on first when asked
   * @param key - The value
   * @param feature - The feature it belongs to
   * @param value - Its new value
   * @param turnOn - Whether the value needs the feature on
   */
  private _set<K extends keyof MeshPhysicalMaterial['_values']>(
    key: K,
    feature: Feature,
    value: MeshPhysicalMaterial['_values'][K],
    turnOn = false,
  ): void {
    if (!this._values) return;
    this._values[key] = value;
    this._sync(feature, turnOn);
  }

  /**
   * Writes a feature's values into pixi-3d's data, when the feature is on
   * @param feature - The feature
   * @param turnOn - Whether to turn it on first
   */
  private _sync(feature: Feature, turnOn = false): void {
    if (!this._values || !this._sheenColor || !this._specularColor || !this._attenuationColor) return;
    if (turnOn) this._turnOn(feature);
    const data = (this as unknown as Material3DInternals).data;
    const v = this._values;

    if (feature === 'iridescence' || feature === 'transmission') {
      const volume = data.transmissionVolume as Float32Array;
      const irid = data.attenuationColorIrid as Float32Array;
      volume[0] = v.transmission;
      volume[1] = v.thickness;
      volume[2] = Number.isFinite(v.attenuationDistance) ? v.attenuationDistance : 1e10;
      volume[3] = v.iridescence;
      irid.set([this._attenuationColor.r, this._attenuationColor.g, this._attenuationColor.b, v.iridescenceIOR]);
      if (this._enabled.has('iridescence')) {
        data.iridescenceThicknessMinimum = v.iridescenceThicknessRange[0];
        data.iridescenceThickness = v.iridescenceThicknessRange[1];
      }
    } else if (!this._enabled.has(feature)) {
      return;
    } else if (feature === 'clearcoat') {
      (data.clearcoatParams as Float32Array).set([v.clearcoat, v.clearcoatRoughness, 1], 0);
    } else if (feature === 'sheen') {
      const color = this._sheenColor;
      (data.sheenParams as Float32Array).set([
        color.r * v.sheen,
        color.g * v.sheen,
        color.b * v.sheen,
        v.sheenRoughness,
      ]);
    } else if (feature === 'specular') {
      const color = this._specularColor;
      (data.specularParams as Float32Array).set([color.r, color.g, color.b, v.specularIntensity]);
    } else {
      (data.anisotropyParams as Float32Array).set([v.anisotropy, v.anisotropyRotation], 0);
    }
    this.update();
  }

  /**
   * Builds a feature into the material, laying its data and textures out again, as pixi-3d's
   * constructor would have with the feature asked for. Only before the material is first drawn:
   * after that its layout is in the renderer's store.
   * @param feature - The feature
   */
  private _turnOn(feature: Feature): void {
    if (this._enabled.has(feature)) return;
    const internals = this as unknown as Material3DInternals;
    if (internals._uploadQueue) {
      if (!warned) {
        warned = true;
        warn(
          `MeshPhysicalMaterial: ${feature} can only be turned on before the material is first drawn; set it from the first render.`,
        );
      }
      return;
    }

    this._enabled.add(feature);
    const order = Object.keys(FEATURES) as Feature[];
    const bits = internals._featureBits;
    bits.length = 0;
    bits.push(emissiveBit, ...order.filter((name) => this._enabled.has(name)).map((name) => FEATURES[name]));

    const kept: Record<string, number | Float32Array> = {};
    for (const field of KEPT_FIELDS) {
      const value = internals.data[field];
      if (value !== undefined) kept[field] = typeof value === 'number' ? value : value.slice();
    }
    const textures: Record<string, Texture> = {};
    for (const name in internals._slotByName) textures[name] = internals._textures[internals._slotByName[name]];

    this._deriveLayoutFromBits([pbrMaterialBit, uvTransformBit, ...bits, ...this._extraBits], textures);

    const data = internals.data;
    for (const field in kept) {
      const value = kept[field];
      if (typeof value === 'number') data[field] = value;
      else (data[field] as Float32Array).set(value);
    }
    const strength = this._emissiveProps.strength;
    const glow = this._emissiveProps.color;
    this._emissiveProps = new EmissivePropsClass(this);
    this._emissiveProps.strength = strength;
    this._emissiveProps.color = glow;
    if (feature === 'transmission') {
      const coreMask = RenderPassBit.OPAQUE | RenderPassBit.TRANSPARENT;
      internals._passBit = (internals._passBit & ~coreMask) | RenderPassBit.TRANSMISSION;
    }
    for (const name of this._enabled) if (name !== feature) this._sync(name);
    invalidateMaterial(this);
  }
}

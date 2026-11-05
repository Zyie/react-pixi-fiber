import { Material3D } from '@pixi/3d';
import type { EmissiveProps } from '@pixi/3d';
import { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';

/**
 * three's `MeshStandardMaterial` parameters that map onto pixi-3d's `Material3D`
 * @category catalog
 * @standard
 */
export interface MeshStandardMaterialParameters {
  /** Base colour, pixi-3d's `baseColor` */
  color?: ColorRepresentation;
  /** Colour the surface gives off whatever the lighting, black for none */
  emissive?: ColorRepresentation;
  /** Scales `emissive` */
  emissiveIntensity?: number;
  /** 0 for a mirror, 1 for fully rough */
  roughness?: number;
  /** 0 for a dielectric, 1 for a metal; pixi-3d's `metallic` */
  metalness?: number;
  /** Colour texture, multiplied by `color`; pixi-3d's `baseColorTexture` */
  map?: Texture | null;
  /** 0 for clear, 1 for solid; pixi-3d's `alpha` */
  opacity?: number;
  /** Blend with what is behind, using `opacity`; pixi-3d's `alphaMode: 'blend'` */
  transparent?: boolean;
}

/**
 * three's `MeshStandardMaterial` over pixi-3d's PBR `Material3D`, with three's parameter names
 *
 * Starts as three's does: white, fully rough and not metallic, where pixi-3d's own defaults
 * follow glTF and start metallic. `color` and `emissive` are three `Color`s, in the working colour
 * space as in three, so `material.color.set('hotpink')`, `color="hotpink"` and `color-r={1}` all work.
 * The material is built with pixi-3d's emissive feature on, black until you set `emissive`, since
 * pixi-3d can't turn the feature on after construction.
 * @example
 * ```tsx
 * <meshStandardMaterial color="hotpink" roughness={0.25} metalness={0.5} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshStandardMaterial extends Material3D {
  /** Always `true`, as on three's `MeshStandardMaterial` */
  public readonly isMeshStandardMaterial = true;
  /**
   * Colour the surface gives off whatever the lighting, three's `emissive`; black for none. pixi-3d's
   * own `emissive` controls are kept inside, and `emissiveIntensity` scales it.
   */
  // @ts-expect-error -- three's `emissive` is a Color where pixi-3d's Material3D has its EmissiveProps; the alias keeps those privately
  declare public readonly emissive: Color;
  private readonly _color: Color;
  private readonly _emissiveProps: EmissiveProps;

  /** @param parameters - three's material parameters */
  constructor({
    color = 0xffffff,
    emissive = 0x000000,
    emissiveIntensity = 1,
    map,
    roughness = 1,
    metalness = 0,
    opacity,
    transparent,
  }: MeshStandardMaterialParameters = {}) {
    super({
      baseColorTexture: map ?? undefined,
      roughness,
      metallic: metalness,
      alpha: opacity,
      alphaMode: transparent ? 'blend' : undefined,
      emissive: { color: 0x000000, strength: emissiveIntensity },
    });
    const props = (this as unknown as { emissive: EmissiveProps }).emissive;
    const glow = new Color(emissive)._onChange(() => {
      props.color = toPixiColor(glow);
    });

    this._emissiveProps = props;
    this._color = new Color(color)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
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

  /** Colour texture, multiplied by `color`, or `null` for none; pixi-3d's `textures.baseColor` */
  public get map(): Texture | null {
    const texture = this.textures.baseColor;

    return !texture || texture === Texture.WHITE ? null : texture;
  }

  public set map(value: Texture | null) {
    this.textures.baseColor = value ?? Texture.WHITE;
  }

  /** 0 for a dielectric, 1 for a metal; pixi-3d's `metallic` */
  public get metalness(): number {
    return this.metallic;
  }

  public set metalness(value: number) {
    this.metallic = value;
  }

  /** 0 for clear, 1 for solid; pixi-3d's `alpha` */
  public get opacity(): number {
    return this.alpha;
  }

  public set opacity(value: number) {
    this.alpha = value;
  }

  /** Whether it blends with what is behind; pixi-3d's `alphaMode: 'blend'` */
  public get transparent(): boolean {
    return this.alphaMode === 'blend';
  }

  public set transparent(value: boolean) {
    this.alphaMode = value ? 'blend' : 'opaque';
  }
}

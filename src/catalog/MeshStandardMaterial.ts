import { Material3D } from '@pixi/3d';
import { Texture } from 'pixi.js';
import type { ColorSource } from 'pixi.js';

/**
 * three's `MeshStandardMaterial` parameters that map onto pixi-3d's `Material3D`
 * @category catalog
 * @standard
 */
export interface MeshStandardMaterialParameters {
  /** Base colour, pixi-3d's `baseColor` */
  color?: ColorSource;
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
 * follow glTF and start metallic.
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

  /** @param parameters - three's material parameters */
  constructor({ color, map, roughness = 1, metalness = 0, opacity, transparent }: MeshStandardMaterialParameters = {}) {
    super({
      baseColor: color,
      baseColorTexture: map ?? undefined,
      roughness,
      metallic: metalness,
      alpha: opacity,
      alphaMode: transparent ? 'blend' : undefined,
    });
  }

  /** Base colour; reads back as a number, pixi-3d's `baseColor` */
  public get color(): ColorSource {
    return this.baseColor;
  }

  public set color(value: ColorSource) {
    this.baseColor = value;
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

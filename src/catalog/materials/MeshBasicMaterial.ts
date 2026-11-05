import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit } from '@pixi/3d';
import { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';

/**
 * three's `MeshBasicMaterial` parameters that map onto pixi-3d's `FlatMaterial`
 * @category catalog
 * @standard
 */
export interface MeshBasicMaterialParameters {
  /** Colour, pixi-3d's `baseColor` */
  color?: ColorRepresentation;
  /** Colour texture, multiplied by `color`; pixi-3d's `baseColorTexture` */
  map?: Texture | null;
  /** 0 for clear, 1 for solid; pixi-3d's `alpha` */
  opacity?: number;
  /** Blend with what is behind, using `opacity`; pixi-3d's `alphaMode: 'blend'` */
  transparent?: boolean;
}

/**
 * Decodes the base colour texture from sRGB to linear with pixi-3d's 2.2 gamma, as its lit materials
 * do, so a textured basic material goes through tone mapping as three's does. `FlatMaterial`'s own bit
 * shows the texture as authored; this follows it and scales `albedo` by `decode(t) / t` per channel.
 */
const srgbBaseColorTextureBit: ShaderBit = {
  name: 'meshBasicSrgbTexture',
  gpu: {
    fragment: {
      material: /* wgsl */ `
  albedo *= pow(baseTex.rgb, vec3<f32>(2.2)) / max(baseTex.rgb, vec3<f32>(1e-4));
`,
    },
  },
  gl: {
    fragment: {
      material: /* glsl */ `
  albedo *= pow(baseTex.rgb, vec3(2.2)) / max(baseTex.rgb, vec3(1e-4));
`,
    },
  },
};

/**
 * three's `MeshBasicMaterial`, an unlit colour, over pixi-3d's `FlatMaterial`
 *
 * `color` is a three `Color`, in the working colour space as in three, so
 * `material.color.set('hotpink')`, `color="hotpink"` and `color-r={1}` all work.
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
  /**
   * `true`, as in three: the view's tone mapping, which also encodes the output to sRGB, applies.
   * pixi-3d's `FlatMaterial` turns it off. Read when a mesh builds its shader.
   */
  public override toneMapped = true;
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor({ color = 0xffffff, map, opacity, transparent }: MeshBasicMaterialParameters = {}) {
    super({
      baseColorTexture: map ?? undefined,
      alpha: opacity,
      alphaMode: transparent ? 'blend' : undefined,
      extraBits: [srgbBaseColorTextureBit],
    });
    this._color = new Color(color)._onChange(() => {
      this.baseColor = toPixiColor(this._color);
    });
    this._color._onChangeCallback();
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
    const texture = this.textures.baseColor;

    return !texture || texture === Texture.WHITE ? null : texture;
  }

  public set map(value: Texture | null) {
    this.textures.baseColor = value ?? Texture.WHITE;
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

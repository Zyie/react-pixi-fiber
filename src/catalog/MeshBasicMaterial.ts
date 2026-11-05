import { FlatMaterial } from '@pixi/3d';
import type { ColorSource } from 'pixi.js';

/**
 * three's `MeshBasicMaterial` parameters that map onto pixi-3d's `FlatMaterial`
 * @category catalog
 * @standard
 */
export interface MeshBasicMaterialParameters {
  /** Colour, pixi-3d's `baseColor` */
  color?: ColorSource;
  /** 0 for clear, 1 for solid; pixi-3d's `alpha` */
  opacity?: number;
  /** Blend with what is behind, using `opacity`; pixi-3d's `alphaMode: 'blend'` */
  transparent?: boolean;
}

/**
 * three's `MeshBasicMaterial`, an unlit colour, over pixi-3d's `FlatMaterial`
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

  /** @param parameters - three's material parameters */
  constructor({ color, opacity, transparent }: MeshBasicMaterialParameters = {}) {
    super({ baseColor: color, alpha: opacity, alphaMode: transparent ? 'blend' : undefined });
  }

  /** Colour; reads back as a number, pixi-3d's `baseColor` */
  public get color(): ColorSource {
    return this.baseColor;
  }

  public set color(value: ColorSource) {
    this.baseColor = value;
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

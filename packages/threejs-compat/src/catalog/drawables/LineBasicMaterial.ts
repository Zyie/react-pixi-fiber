import { FlatMaterial } from '@pixi/3d';
import type { ShaderDescriptor, View3D } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { readSlot, writeSlot } from '../materials/textureSlots';
import { initThreeMaterial, threeDescriptor } from '../materials/threeMaterial';
import type { MaterialParameters } from '../materials/threeMaterial';

/**
 * three's `LineBasicMaterial` parameters
 * @category catalog
 * @standard
 */
export interface LineBasicMaterialParameters extends MaterialParameters {
  /** Colour */
  color?: ColorRepresentation;
  /** Kept for three's shape: lines are 1 pixel wide, as on most of three's platforms */
  linewidth?: number;
  /** Colour texture along the line, multiplied by `color` */
  map?: Texture | null;
}

/**
 * three's `LineBasicMaterial`, unlit lines for `<line>`, `<lineSegments>` and `<lineLoop>`, over
 * pixi-3d's `FlatMaterial`
 *
 * Lines are one pixel wide; `linewidth` is kept and does nothing, as on WebGL and WebGPU in three.
 * `color` is a three `Color`, and `vertexColors` colours each vertex from the geometry.
 * @example
 * ```tsx
 * <lineBasicMaterial color="white" />
 * ```
 * @category catalog
 * @standard
 */
export class LineBasicMaterial extends FlatMaterial {
  /** Always `true`, as on three's `LineBasicMaterial` */
  public readonly isLineBasicMaterial = true;
  /** three's class name */
  public type = 'LineBasicMaterial';
  /** Kept for three's shape: lines are 1 pixel wide */
  public linewidth: number = 1;
  /** Kept for three's shape */
  public linecap = 'round';
  /** Kept for three's shape */
  public linejoin = 'round';
  private readonly _color: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: LineBasicMaterialParameters = {}) {
    super();
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

  /** Colour texture along the line, multiplied by `color`, or `null` */
  public get map(): Texture | null {
    return readSlot(this, 'baseColor');
  }

  public set map(value: Texture | null) {
    writeSlot(this, 'baseColor', value);
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

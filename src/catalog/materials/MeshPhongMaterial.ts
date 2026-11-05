import type { Texture } from 'pixi.js';

import { Color, toPixiColor } from '../../math/Color';
import type { ColorRepresentation } from '../../math/Color';
import { PhongBase } from './PhongBase';
import type { PhongBaseParameters } from './PhongBase';
import { readSlot, writeSlot } from './textureSlots';
import { initThreeMaterial } from './threeMaterial';

/**
 * three's `MeshPhongMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshPhongMaterialParameters extends PhongBaseParameters {
  /** Colour of the highlight */
  specular?: ColorRepresentation;
  /** How small and sharp the highlight is */
  shininess?: number;
  /** Highlight strength in the red channel */
  specularMap?: Texture | null;
}

/**
 * three's `MeshPhongMaterial` over pixi-3d's `PhongMaterial`: Lambert diffuse and a Blinn-Phong
 * highlight, normalised as three's are, so it lights as three's does
 *
 * `color`, `emissive` and `specular` are three `Color`s. `normalScale` bends both axes by its `x`.
 * Its `envMap`, `lightMap`, `aoMap`, `bumpMap` and `displacementMap` aren't taken.
 * @example
 * ```tsx
 * <meshPhongMaterial color="royalblue" specular="#555555" shininess={60} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshPhongMaterial extends PhongBase {
  /** Always `true`, as on three's `MeshPhongMaterial` */
  public readonly isMeshPhongMaterial = true;
  /** three's class name */
  public type = 'MeshPhongMaterial';
  private readonly _specular: Color;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshPhongMaterialParameters = {}) {
    super();
    this._specular = new Color(0x111111)._onChange(() => {
      this.specularColor = toPixiColor(this._specular);
    });
    this._specular._onChangeCallback();
    initThreeMaterial(this, parameters);
  }

  /** Colour of the highlight; pixi-3d's `specularColor` follows it */
  public get specular(): Color {
    return this._specular;
  }

  public set specular(value: ColorRepresentation) {
    this._specular.set(value);
  }

  /** Highlight strength in the red channel, or `null`; pixi-3d's `specular` slot */
  public get specularMap(): Texture | null {
    return readSlot(this, 'specular');
  }

  public set specularMap(value: Texture | null) {
    writeSlot(this, 'specular', value);
  }
}

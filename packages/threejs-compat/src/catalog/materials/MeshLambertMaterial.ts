import { PhongBase } from './PhongBase';
import type { PhongBaseParameters } from './PhongBase';
import { initThreeMaterial } from './threeMaterial';

/**
 * three's `MeshLambertMaterial` parameters
 * @category catalog
 * @standard
 */
export type MeshLambertMaterialParameters = PhongBaseParameters;

/**
 * three's `MeshLambertMaterial`, matte Lambert diffuse with no highlight, over pixi-3d's
 * `PhongMaterial` with its highlight turned off
 *
 * `color` and `emissive` are three `Color`s. Its `envMap`, `lightMap`, `aoMap`, `bumpMap` and
 * `displacementMap` aren't taken.
 * @example
 * ```tsx
 * <meshLambertMaterial color="seagreen" />
 * ```
 * @category catalog
 * @standard
 */
export class MeshLambertMaterial extends PhongBase {
  /** Always `true`, as on three's `MeshLambertMaterial` */
  public readonly isMeshLambertMaterial = true;
  /** three's class name */
  public type = 'MeshLambertMaterial';

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshLambertMaterialParameters = {}) {
    super();
    this.specularStrength = 0;
    this.shininess = 1;
    initThreeMaterial(this, parameters);
  }
}

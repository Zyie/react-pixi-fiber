import { FlatMaterial } from '@pixi/3d';
import type { ShaderBit, ShaderDescriptor, View3D } from '@pixi/3d';

import { initThreeMaterial, threeDescriptor } from './threeMaterial';
import type { MaterialParameters } from './threeMaterial';

/**
 * three's `MeshNormalMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshNormalMaterialParameters extends MaterialParameters {
  /** Whether each triangle is shaded with its face normal */
  flatShading?: boolean;
}

/** Colours the surface by its normal in camera space, `normal * 0.5 + 0.5`, as three's does */
const normalColorBit: ShaderBit = {
  name: 'threeNormalColor',
  gpu: {
    fragment: {
      material: /* wgsl */ `
  albedo = normalize((camera.uViewMatrix * vec4<f32>(normal, 0.0)).xyz) * 0.5 + 0.5;
`,
    },
  },
  gl: {
    fragment: {
      material: /* glsl */ `
  albedo = normalize((uViewMatrix * vec4(normal, 0.0)).xyz) * 0.5 + 0.5;
`,
    },
  },
};

/**
 * three's `MeshNormalMaterial`, which colours a surface by the way it faces the camera, over pixi-3d's
 * `FlatMaterial`
 *
 * Unlit and never tone mapped, as in three. Its `normalMap`, `bumpMap` and `displacementMap` aren't
 * taken.
 * @example
 * ```tsx
 * <meshNormalMaterial />
 * ```
 * @category catalog
 * @standard
 */
export class MeshNormalMaterial extends FlatMaterial {
  /** Always `true`, as on three's `MeshNormalMaterial` */
  public readonly isMeshNormalMaterial = true;
  /** three's class name */
  public type = 'MeshNormalMaterial';
  /** Kept for three's shape: the colour is never tone mapped */
  public override toneMapped = true;

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshNormalMaterialParameters = {}) {
    super({ extraBits: [normalColorBit] });
    initThreeMaterial(this, { fog: false, ...parameters });
    this.colorSpace = 'display';
    this._skipsToneCurve = true;
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

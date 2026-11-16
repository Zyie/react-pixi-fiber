import { ShaderDescriptor } from '@pixi/3d';
import type { BaseMaterial3D, ShaderBit } from '@pixi/3d';

import { installMaterialSurface, invalidateMaterial, threeState } from '../../compat/materialSurface';
import { BackSide } from '../constants';

/**
 * Turns the shading normal around, for a material that draws only its back faces
 *
 * pixi culls front faces by calling clockwise triangles the front ones, so the back faces it draws
 * count as front facing, and `doubleSidedNormalBit` would leave them alone. three flips the normal
 * of a `BackSide` material whatever way a face points.
 */
const backSideNormalBit: ShaderBit = {
  name: 'threeBackSideNormal',
  gpu: { fragment: { material: /*wgsl*/ 'normal = -normal;\n' } },
  gl: { fragment: { material: /*glsl*/ 'normal = -normal;\n' } },
};

/** The composed descriptors of each base descriptor, for the front-side and the back-side case */
const composed = new WeakMap<ShaderDescriptor, (ShaderDescriptor | undefined)[]>();

/**
 * A material's descriptor with three's bits in place of pixi-3d's, and the back-side normal flip
 * ahead of the material's bits when it draws only its back faces
 * @param material - The material
 * @param base - The descriptor pixi-3d's material built
 * @param swaps - pixi-3d's bits and the three bits that replace them
 * @internal
 */
export function threeDescriptor(
  material: BaseMaterial3D,
  base: ShaderDescriptor,
  swaps?: ReadonlyMap<ShaderBit, ShaderBit>,
): ShaderDescriptor {
  const backSide = threeState(material).side === BackSide;
  if (!backSide && !swaps) return base;

  let entry = composed.get(base);
  if (!entry) composed.set(base, (entry = []));
  const slot = backSide ? 1 : 0;
  const existing = entry[slot];
  if (existing) return existing;

  const compose = (bits: ShaderBit[]): ShaderBit[] => {
    const out = bits.map((bit) => swaps?.get(bit) ?? bit);
    if (backSide) out.unshift(backSideNormalBit);
    return out;
  };
  const descriptor = new ShaderDescriptor({}).update({
    bitsGpu: compose(base.bitsGpu),
    bitsGl: compose(base.bitsGl),
    template: base.template,
    overrides: base.overrides,
    includeGlobal: base.includeGlobal,
    includeCamera: base.includeCamera,
  });
  entry[slot] = descriptor;
  return descriptor;
}

/** The pixi-3d fields read when a mesh builds its shader, which three lets you change at any time */
const SHADER_FLAGS = ['flatShading', 'vertexColors', 'fog'] as const;

/**
 * Finishes building a catalog material: gives pixi-3d's materials three's `Material` fields if no
 * root has yet, works in linear light as three's materials do (pixi-3d's unlit materials work on
 * colours as authored), makes the shader flags rebuild the meshes' shaders when they change
 * (pixi-3d reads `flatShading`, `vertexColors` and `fog` only when a mesh builds its shader), then
 * applies three's constructor parameters, as three's `setValues` does. Called at the end of each
 * catalog material's constructor.
 * @param material - The material
 * @param parameters - three's constructor parameters
 * @internal
 */
export function initThreeMaterial(material: BaseMaterial3D, parameters?: object): void {
  installMaterialSurface();
  material.colorSpace = 'linear';
  bindShaderFlags(material);
  material.setValues(parameters as Record<string, unknown> | undefined);
}

function bindShaderFlags(material: BaseMaterial3D): void {
  const fields = material as unknown as Record<(typeof SHADER_FLAGS)[number], boolean>;
  for (const key of SHADER_FLAGS) {
    let value = fields[key];
    Object.defineProperty(material, key, {
      configurable: true,
      enumerable: true,
      get: () => value,
      set: (next: boolean) => {
        if (next === value) return;
        value = next;
        invalidateMaterial(material);
      },
    });
  }
}

/**
 * three's `Material` parameters, which every catalog material's constructor takes
 * @category catalog
 * @advanced
 */
export interface MaterialParameters {
  /** Which faces are drawn: `FrontSide`, `BackSide` or `DoubleSide` */
  side?: number;
  /** Whether it blends with what is behind, using `opacity` */
  transparent?: boolean;
  /** 0 for clear, 1 for solid */
  opacity?: number;
  /** Fragments with less alpha than this are discarded */
  alphaTest?: number;
  /** Whether it is hidden behind nearer surfaces */
  depthTest?: boolean;
  /** Whether it hides farther surfaces drawn after it */
  depthWrite?: boolean;
  /** How it blends: `NormalBlending`, `AdditiveBlending`, ... */
  blending?: number;
  /** Whether meshes drawing it are drawn */
  visible?: boolean;
  /** Whether the renderer's tone mapping applies */
  toneMapped?: boolean;
  /** Whether a geometry's `color` attribute tints it */
  vertexColors?: boolean;
  /** Whether the scene's fog reaches it */
  fog?: boolean;
  /** A name of your choosing */
  name?: string;
  /** Pushes its depth back to avoid z-fighting */
  polygonOffset?: boolean;
  /** How far `polygonOffset` pushes */
  polygonOffsetFactor?: number;
  /** Your own data */
  userData?: Record<string, unknown>;
}

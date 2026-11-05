import { createLightingBit, mathConstantsBit, phongLightingBit } from '@pixi/3d';
import type { ShaderBit } from '@pixi/3d';
import type { Texture } from 'pixi.js';

import { PhongBase } from './PhongBase';
import type { PhongBaseParameters } from './PhongBase';
import { readSlot, writeSlot } from './textureSlots';
import { initThreeMaterial } from './threeMaterial';

/**
 * three's `MeshToonMaterial` parameters
 * @category catalog
 * @standard
 */
export interface MeshToonMaterialParameters extends PhongBaseParameters {
  /** The shading ramp, read across its red channel from dark to lit */
  gradientMap?: Texture | null;
}

/** The toon material's ramp texture, and whether one is set */
const toonMapsBit: ShaderBit = {
  name: 'threeToonMaps',
  textures: ['gradientMap'],
  bindings: { material: { gradientMapSet: 'f32' } },
};

/**
 * three's toon lighting: each light's `N·L` picks a level from the gradient map, or with no map
 * three's two tones, 0.7 below `N·L = 0.4` and 1 above, times Lambert diffuse; ambient light is
 * Lambert. No highlight.
 */
const toonLightingBit = createLightingBit({
  name: 'threeToonLighting',
  requires: [mathConstantsBit],
  preLighting: {
    gpu: /* wgsl */ `
  var directLight = vec3<f32>(0.0);
  let albedoOverPI = albedo * INV_PI;
`,
    gl: /* glsl */ `
  vec3 directLight = vec3(0.0);
  vec3 albedoOverPI = albedo * INV_PI;
`,
  },
  perLight: {
    gpu: /* wgsl */ `
    let toonCoord = dot(normal, lightDir) * 0.5 + 0.5;
    var level = mix(0.7, 1.0, smoothstep(0.69, 0.71, toonCoord));
    if (material.gradientMapSet > 0.5) {
      level = sampleGradientMap(vec2<f32>(toonCoord, 0.5)).r;
    }
    directLight += albedoOverPI * light.color * (level * attenuation * shadow);
`,
    gl: /* glsl */ `
    float toonCoord = dot(normal, lightDir) * 0.5 + 0.5;
    float level = mix(0.7, 1.0, smoothstep(0.69, 0.71, toonCoord));
    if (material.gradientMapSet > 0.5) {
      level = sampleGradientMap(vec2(toonCoord, 0.5)).r;
    }
    directLight += albedoOverPI * light.color * (level * attenuation * shadow);
`,
  },
  postLighting: {
    gpu: /* wgsl */ `
  finalColor = global.uGlobalLightParams.xyz * albedoOverPI + directLight + emissive;
`,
    gl: /* glsl */ `
  finalColor = uGlobalLightParams.xyz * albedoOverPI + directLight + emissive;
`,
  },
});

const TOON_SWAPS: ReadonlyMap<ShaderBit, ShaderBit> = new Map([[phongLightingBit, toonLightingBit]]);

/**
 * three's `MeshToonMaterial`, cel shading from a gradient map, over pixi-3d's `PhongMaterial` with
 * three's toon lighting in place of its own
 *
 * Each light picks a level of `gradientMap` by `N·L`, or one of three's two tones without a map.
 * pixi-3d skips a light the surface faces away from, where three still reads the darkest level of
 * the ramp, so faces turned from every light are lit by ambient light alone. pixi-3d's own
 * `ToonMaterial`, with bands, a highlight and a rim, stays reachable as `<toonMaterial>`.
 * @example
 * ```tsx
 * <meshToonMaterial color="orange" gradientMap={threeTone} />
 * ```
 * @category catalog
 * @standard
 */
export class MeshToonMaterial extends PhongBase {
  /** Always `true`, as on three's `MeshToonMaterial` */
  public readonly isMeshToonMaterial = true;
  /** three's class name */
  public type = 'MeshToonMaterial';

  /** @param parameters - three's material parameters */
  constructor(parameters: MeshToonMaterialParameters = {}) {
    super([toonMapsBit], TOON_SWAPS);
    this.specularStrength = 0;
    initThreeMaterial(this, parameters);
  }

  /** The shading ramp, read across its red channel from dark to lit, or `null` for three's two tones */
  public get gradientMap(): Texture | null {
    return readSlot(this, 'gradientMap');
  }

  public set gradientMap(value: Texture | null) {
    writeSlot(this, 'gradientMap', value);
    (this.data as unknown as { gradientMapSet: number }).gradientMapSet = value ? 1 : 0;
    this.update();
  }
}

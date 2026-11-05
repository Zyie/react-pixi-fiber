import { createLightingBit, mathConstantsBit, pbrMaterialBit } from '@pixi/3d';
import type { ShaderBit } from '@pixi/3d';

/**
 * The texture slots three's standard material has and pixi-3d's PBR material doesn't: a metalness
 * map of its own (blue channel) and an alpha map (green channel). The roughness map goes in pixi-3d's
 * `metallicRoughness` slot, where only its green channel is read.
 * @internal
 */
export const threeStandardMapsBit: ShaderBit = {
  name: 'threeStandardMaps',
  textures: ['metalnessMap', 'alphaMap'],
};

/**
 * pixi-3d's `pbrMaterialBit` read the way three's `MeshStandardMaterial` reads its maps: roughness
 * from the roughness map's green channel and metalness from the metalness map's blue channel, each
 * a texture of its own; occlusion as `1 + (ao - 1) * aoMapIntensity`; and the alpha map's green
 * channel multiplying opacity. Same slots and struct as pixi-3d's bit, which keeps the layout pixi-3d
 * derived at construction, and the same names for the bits after it.
 * @internal
 */
export const threeStandardMaterialBit: ShaderBit = {
  name: 'threeStandardMaterial',
  textures: pbrMaterialBit.textures,
  bindings: pbrMaterialBit.bindings,
  gpu: {
    fragment: {
      material: /*wgsl*/ `
  var viewDir: vec3<f32>;
  var metallic: f32 = 0.0;
  var roughness: f32 = 1.0;
  var fresnelF0: vec3<f32>;
  var f90: f32 = 1.0;
  var emissive: vec3<f32> = vec3<f32>(0.0);
  var occlusion: f32 = 1.0;
  var directLight: vec3<f32> = vec3<f32>(0.0);
  var ambient: vec3<f32> = vec3<f32>(0.0);

  var baseColor = material.baseColor;
  metallic = material.pbrParams.x;
  roughness = material.pbrParams.y;

  let ior = material.pbrParams.w;
  let iorRatio = (ior - 1.0) / (ior + 1.0);
  fresnelF0 = vec3<f32>(iorRatio * iorRatio);

  var baseTex = sampleBaseColor(input.vUV);
  let baseTexLinear = baseTex.rgb / max(baseTex.a, 0.001);
  baseTex = vec4<f32>(pow(baseTexLinear, vec3<f32>(2.2)), baseTex.a);
  baseColor *= baseTex;
  baseColor.a *= sampleAlphaMap(input.vUV).g;

  roughness *= sampleMetallicRoughness(input.vUV).g;
  metallic *= sampleMetalnessMap(input.vUV).b;
  occlusion = (sampleOcclusion(input.vUV).r - 1.0) * material.pbrParams.z + 1.0;

  let dNdx = abs(dpdx(normal));
  let dNdy = abs(dpdy(normal));
  let dN = max(dNdx, dNdy);
  let geometricRoughness = max(max(dN.x, dN.y), dN.z);
  roughness = clamp(max(roughness, 0.045) + geometricRoughness, 0.0, 1.0);

  albedo *= baseColor.rgb;
  alpha *= baseColor.a;

  viewDir = normalize(camera.uCameraPosition.xyz - input.vPosition);
  fresnelF0 = mix(fresnelF0, albedo, metallic);

  var specularNormal = normal;
`,
    },
  },
  gl: {
    fragment: {
      material: /*glsl*/ `
  vec3 viewDir;
  float metallic = 0.0;
  float roughness = 1.0;
  vec3 fresnelF0;
  float f90 = 1.0;
  vec3 emissive = vec3(0.0);
  float occlusion = 1.0;
  vec3 directLight = vec3(0.0);
  vec3 ambient = vec3(0.0);

  vec4 baseColor = material.baseColor;
  metallic = material.pbrParams.x;
  roughness = material.pbrParams.y;

  float ior = material.pbrParams.w;
  float iorRatio = (ior - 1.0) / (ior + 1.0);
  fresnelF0 = vec3(iorRatio * iorRatio);

  vec4 baseTex = sampleBaseColor(vUV);
  vec3 baseTexLinear = baseTex.rgb / max(baseTex.a, 0.001);
  baseTex.rgb = pow(baseTexLinear, vec3(2.2));
  baseColor *= baseTex;
  baseColor.a *= sampleAlphaMap(vUV).g;

  roughness *= sampleMetallicRoughness(vUV).g;
  metallic *= sampleMetalnessMap(vUV).b;
  occlusion = (sampleOcclusion(vUV).r - 1.0) * material.pbrParams.z + 1.0;

  vec3 dNdx = abs(dFdx(normal));
  vec3 dNdy = abs(dFdy(normal));
  vec3 dN = max(dNdx, dNdy);
  float geometricRoughness = max(max(dN.x, dN.y), dN.z);
  roughness = clamp(max(roughness, 0.045) + geometricRoughness, 0.0, 1.0);

  albedo *= baseColor.rgb;
  alpha *= baseColor.a;

  viewDir = normalize(uCameraPosition.xyz - vPosition);
  fresnelF0 = mix(fresnelF0, albedo, metallic);

  vec3 specularNormal = normal;
`,
    },
  },
};

/**
 * three r187's direct and ambient lighting for `MeshStandardMaterial`, in place of pixi-3d's
 * `pbrLightingBit`
 *
 * Per light, as three's `RE_Direct_Physical`: GGX distribution, the exact height-correlated Smith
 * visibility, Schlick Fresnel, and three's multi-scatter energy compensation on the specular lobe
 * (Turquin 2019, `1 + F0 * (1 / Ess - 1)`). The diffuse lobe loses the share the dielectric
 * interface reflects, `1 - F(F0 dielectric)`, as three's does, where pixi-3d takes the metal-blended
 * Fresnel. Ambient light is three's `RE_IndirectDiffuse_Physical`: Lambert diffuse less the
 * dielectric specular's single- and multi-scatter energy.
 *
 * three reads `Ess` from a 16 by 16 DFG table; this uses the analytic fit three used before the table
 * (Karis 2014, mobile environment BRDF), within a few percent of it.
 *
 * Declares the names pixi-3d's lobes read from `pbrLightingBit`: `nDotV`, `a`, `a2` before the
 * loop, and `halfVector`, `nDotH` and `specular` in it.
 * @internal
 */
export const threeStandardLightingBit = createLightingBit({
  name: 'threeStandardLighting',
  requires: [mathConstantsBit],
  header: {
    gpu: /*wgsl*/ `
fn threeDfgApprox(dotNV: f32, roughness: f32) -> vec2<f32> {
  let c0 = vec4<f32>(-1.0, -0.0275, -0.572, 0.022);
  let c1 = vec4<f32>(1.0, 0.0425, 1.04, -0.04);
  let r = roughness * c0 + c1;
  let a004 = min(r.x * r.x, exp2(-9.28 * dotNV)) * r.x + r.y;
  return vec2<f32>(-1.04, 1.04) * a004 + r.zw;
}
`,
    gl: /*glsl*/ `
vec2 threeDfgApprox(float dotNV, float roughness) {
  vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = roughness * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * dotNV)) * r.x + r.y;
  return vec2(-1.04, 1.04) * a004 + r.zw;
}
`,
  },
  preLighting: {
    gpu: /*wgsl*/ `
  directLight = vec3<f32>(0.0);

  let nDotV = max(dot(normal, viewDir), 0.0);
  let a = roughness * roughness;
  let a2 = a * a;
  let a2_inv_pi = a2 * INV_PI;
  let albedoOverPI = albedo * INV_PI;
  let dielectricF0 = (fresnelF0 - albedo * metallic) / max(1.0 - metallic, 1e-4);

  let dfg = threeDfgApprox(nDotV, roughness);
  let ess = dfg.x + dfg.y;
  let multiScatter = vec3<f32>(1.0) + fresnelF0 * (1.0 / ess - 1.0);
  let fssEss = dielectricF0 * dfg.x + f90 * dfg.y;
  let ems = 1.0 - ess;
  let fAvg = dielectricF0 + (vec3<f32>(1.0) - dielectricF0) * 0.047619;
  let fms = fssEss * fAvg / (vec3<f32>(1.0) - ems * fAvg);

  ambient += global.uGlobalLightParams.xyz * albedoOverPI * (1.0 - metallic) * (vec3<f32>(1.0) - fssEss - fms * ems);
`,
    gl: /*glsl*/ `
  directLight = vec3(0.0);

  float nDotV = max(dot(normal, viewDir), 0.0);
  float a = roughness * roughness;
  float a2 = a * a;
  float a2_inv_pi = a2 * INV_PI;
  vec3 albedoOverPI = albedo * INV_PI;
  vec3 dielectricF0 = (fresnelF0 - albedo * metallic) / max(1.0 - metallic, 1e-4);

  vec2 dfg = threeDfgApprox(nDotV, roughness);
  float ess = dfg.x + dfg.y;
  vec3 multiScatter = vec3(1.0) + fresnelF0 * (1.0 / ess - 1.0);
  vec3 fssEss = dielectricF0 * dfg.x + f90 * dfg.y;
  float ems = 1.0 - ess;
  vec3 fAvg = dielectricF0 + (vec3(1.0) - dielectricF0) * 0.047619;
  vec3 fms = fssEss * fAvg / (vec3(1.0) - ems * fAvg);

  ambient += uGlobalLightParams.xyz * albedoOverPI * (1.0 - metallic) * (vec3(1.0) - fssEss - fms * ems);
`,
  },
  perLight: {
    gpu: /*wgsl*/ `
    let halfVector = normalize(viewDir + lightDir);
    let hDotV = max(dot(halfVector, viewDir), 0.0);
    let nDotH = max(dot(normal, halfVector), 0.0);

    let dDenom = nDotH * nDotH * (a2 - 1.0) + 1.0;
    let distribution = a2_inv_pi / (dDenom * dDenom);
    let gv = nDotL * sqrt(a2 + (1.0 - a2) * nDotV * nDotV);
    let gl = nDotV * sqrt(a2 + (1.0 - a2) * nDotL * nDotL);
    let vis = 0.5 / max(gv + gl, 1e-6);

    let fc5 = exp2((-5.55473 * hDotV - 6.98316) * hDotV);
    let fresnel = fresnelF0 * (1.0 - fc5) + vec3<f32>(f90 * fc5);
    let specular = distribution * fresnel * vis * multiScatter;
    let dielectricFresnel = dielectricF0 * (1.0 - fc5) + vec3<f32>(f90 * fc5);
    let diffuseWeight = (vec3<f32>(1.0) - dielectricFresnel) * (1.0 - metallic);

    let radiance = light.color * attenuation;
    directLight += (diffuseWeight * albedoOverPI + specular) * radiance * nDotL * shadow;
`,
    gl: /*glsl*/ `
    vec3 halfVector = normalize(viewDir + lightDir);
    float hDotV = max(dot(halfVector, viewDir), 0.0);
    float nDotH = max(dot(normal, halfVector), 0.0);

    float dDenom = nDotH * nDotH * (a2 - 1.0) + 1.0;
    float distribution = a2_inv_pi / (dDenom * dDenom);
    float gv = nDotL * sqrt(a2 + (1.0 - a2) * nDotV * nDotV);
    float gl = nDotV * sqrt(a2 + (1.0 - a2) * nDotL * nDotL);
    float vis = 0.5 / max(gv + gl, 1e-6);

    float fc5 = exp2((-5.55473 * hDotV - 6.98316) * hDotV);
    vec3 fresnel = fresnelF0 * (1.0 - fc5) + vec3(f90 * fc5);
    vec3 specular = distribution * fresnel * vis * multiScatter;
    vec3 dielectricFresnel = dielectricF0 * (1.0 - fc5) + vec3(f90 * fc5);
    vec3 diffuseWeight = (vec3(1.0) - dielectricFresnel) * (1.0 - metallic);

    vec3 radiance = light.color * attenuation;
    directLight += (diffuseWeight * albedoOverPI + specular) * radiance * nDotL * shadow;
`,
  },
  postLighting: {
    gpu: /*wgsl*/ `
  finalColor = (ambient * occlusion) + directLight + emissive;
`,
    gl: /*glsl*/ `
  finalColor = (ambient * occlusion) + directLight + emissive;
`,
  },
});

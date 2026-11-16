import { program } from '@react-fiber/core/extension';
import type { GlProgram, GpuProgram } from 'pixi.js';

/** Colour transfers both shaders use: 0 linear, 1 sRGB, 2 pixi-3d's 2.2 gamma */
const TRANSFER_GL = /* glsl */ `
vec3 decodeTransfer(vec3 c, float transfer) {
  if (transfer > 1.5) return pow(max(c, vec3(0.0)), vec3(2.2));
  if (transfer > 0.5) return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  return c;
}
vec3 encodeTransfer(vec3 c, float transfer) {
  c = max(c, vec3(0.0));
  if (transfer > 1.5) return pow(c, vec3(1.0 / 2.2));
  if (transfer > 0.5) return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  return c;
}
`;

const TRANSFER_GPU = /* wgsl */ `
fn decodeTransfer(c: vec3<f32>, transfer: f32) -> vec3<f32> {
  if (transfer > 1.5) { return pow(max(c, vec3<f32>(0.0)), vec3<f32>(2.2)); }
  if (transfer > 0.5) {
    return select(c / 12.92, pow((c + 0.055) / 1.055, vec3<f32>(2.4)), c >= vec3<f32>(0.04045));
  }
  return c;
}
fn encodeTransfer(color: vec3<f32>, transfer: f32) -> vec3<f32> {
  let c = max(color, vec3<f32>(0.0));
  if (transfer > 1.5) { return pow(c, vec3<f32>(1.0 / 2.2)); }
  if (transfer > 0.5) {
    return select(c * 12.92, 1.055 * pow(c, vec3<f32>(1.0 / 2.4)) - 0.055, c >= vec3<f32>(0.0031308));
  }
  return c;
}
`;

/**
 * The bake: one face of a cube from an environment source. The face's direction for the texel turns by
 * `uRotation`, mirrors in x for a cube loaded from images (`uFlipX` -1), samples the source (a cube, or
 * an equirectangular map with row 0 at the top), decodes it, scales it and encodes it.
 */
const bakeFragment = (cube: boolean): { gl: string; gpu: string } => ({
  gl: /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 finalColor;
uniform ${cube ? 'samplerCube' : 'sampler2D'} uSource;
uniform mat4 uRotation;
uniform float uFace;
uniform float uFlipX;
uniform float uDecode;
uniform float uEncode;
uniform float uIntensity;
${TRANSFER_GL}
vec3 faceDirection(float face, vec2 uv) {
  float u = uv.x * 2.0 - 1.0;
  float v = uv.y * 2.0 - 1.0;
  if (face < 0.5) return vec3(1.0, -v, -u);
  if (face < 1.5) return vec3(-1.0, -v, u);
  if (face < 2.5) return vec3(u, 1.0, v);
  if (face < 3.5) return vec3(u, -1.0, -v);
  if (face < 4.5) return vec3(u, -v, 1.0);
  return vec3(-u, -v, -1.0);
}
void main() {
  vec3 dir = normalize(mat3(uRotation) * faceDirection(uFace, vUV));
  dir.x *= uFlipX;
${
  cube
    ? '  vec3 texel = textureLod(uSource, dir, 0.0).rgb;'
    : `  vec2 uv = vec2(atan(dir.z, dir.x) * 0.15915494 + 0.5, 0.5 - asin(clamp(dir.y, -1.0, 1.0)) * 0.31830989);
  vec3 texel = textureLod(uSource, uv, 0.0).rgb;`
}
  finalColor = vec4(encodeTransfer(decodeTransfer(texel, uDecode) * uIntensity, uEncode), 1.0);
}
`,
  gpu: /* wgsl */ `
struct BakeUniforms {
  uRotation: mat4x4<f32>,
  uFace: f32,
  uFlipX: f32,
  uDecode: f32,
  uEncode: f32,
  uIntensity: f32,
  uRoughness: f32,
  uSourceSize: f32,
}
@group(2) @binding(0) var<uniform> bakeUniforms: BakeUniforms;
@group(2) @binding(1) var uSource: ${cube ? 'texture_cube<f32>' : 'texture_2d<f32>'};
@group(2) @binding(2) var uSourceSampler: sampler;
${TRANSFER_GPU}
fn faceDirection(face: f32, uv: vec2<f32>) -> vec3<f32> {
  let u = uv.x * 2.0 - 1.0;
  let v = uv.y * 2.0 - 1.0;
  if (face < 0.5) { return vec3<f32>(1.0, -v, -u); }
  if (face < 1.5) { return vec3<f32>(-1.0, -v, u); }
  if (face < 2.5) { return vec3<f32>(u, 1.0, v); }
  if (face < 3.5) { return vec3<f32>(u, -1.0, -v); }
  if (face < 4.5) { return vec3<f32>(u, -v, 1.0); }
  return vec3<f32>(-u, -v, -1.0);
}
@fragment
fn mainFragment(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
  let r = bakeUniforms.uRotation;
  var dir = normalize(mat3x3<f32>(r[0].xyz, r[1].xyz, r[2].xyz) * faceDirection(bakeUniforms.uFace, vUV));
  dir.x *= bakeUniforms.uFlipX;
${
  cube
    ? '  let texel = textureSampleLevel(uSource, uSourceSampler, dir, 0.0).rgb;'
    : `  let uv = vec2<f32>(atan2(dir.z, dir.x) * 0.15915494 + 0.5, 0.5 - asin(clamp(dir.y, -1.0, 1.0)) * 0.31830989);
  let texel = textureSampleLevel(uSource, uSourceSampler, uv, 0.0).rgb;`
}
  let linear = decodeTransfer(texel, bakeUniforms.uDecode) * bakeUniforms.uIntensity;
  return vec4<f32>(encodeTransfer(linear, bakeUniforms.uEncode), 1.0);
}
`,
});

/** The number of GGX samples the blur takes per texel */
const BLUR_SAMPLES = 256;

/**
 * The blur: one face of a cube from a linear cube with mips, convolved with a GGX lobe of
 * `uRoughness` (α = roughness²) around each texel's direction, by importance sampling with the view
 * along the normal (Karis 2013). Each sample reads the mip whose texels are about as wide as the
 * sample's share of the lobe, so few samples leave no noise.
 */
const BLUR_FRAGMENT_GL = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 finalColor;
uniform samplerCube uSource;
uniform mat4 uRotation;
uniform float uFace;
uniform float uFlipX;
uniform float uDecode;
uniform float uEncode;
uniform float uIntensity;
uniform float uRoughness;
uniform float uSourceSize;
const float PI = 3.14159265359;
vec3 faceDirection(float face, vec2 uv) {
  float u = uv.x * 2.0 - 1.0;
  float v = uv.y * 2.0 - 1.0;
  if (face < 0.5) return vec3(1.0, -v, -u);
  if (face < 1.5) return vec3(-1.0, -v, u);
  if (face < 2.5) return vec3(u, 1.0, v);
  if (face < 3.5) return vec3(u, -1.0, -v);
  if (face < 4.5) return vec3(u, -v, 1.0);
  return vec3(-u, -v, -1.0);
}
float radicalInverse(uint bits) {
  bits = (bits << 16u) | (bits >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return float(bits) * 2.3283064365386963e-10;
}
void main() {
  vec3 N = normalize(faceDirection(uFace, vUV));
  vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, N));
  vec3 bitangent = cross(N, tangent);
  float a = uRoughness * uRoughness;
  float a2 = a * a;
  float texelAngle = 4.0 * PI / (6.0 * uSourceSize * uSourceSize);
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (uint i = 0u; i < ${BLUR_SAMPLES}u; i++) {
    vec2 xi = vec2(float(i) / ${BLUR_SAMPLES}.0, radicalInverse(i));
    float phi = 2.0 * PI * xi.x;
    float cosTheta = sqrt((1.0 - xi.y) / (1.0 + (a2 - 1.0) * xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    vec3 H = tangent * (cos(phi) * sinTheta) + bitangent * (sin(phi) * sinTheta) + N * cosTheta;
    vec3 L = normalize(2.0 * dot(N, H) * H - N);
    float NdotL = dot(N, L);
    if (NdotL <= 0.0) continue;
    float d = cosTheta * cosTheta * (a2 - 1.0) + 1.0;
    float pdf = a2 / (PI * d * d) / 4.0;
    float lod = 0.5 * log2(1.0 / (${BLUR_SAMPLES}.0 * pdf * texelAngle)) + 1.0;
    sum += textureLod(uSource, L, max(lod, 0.0)).rgb * NdotL;
    weight += NdotL;
  }
  finalColor = vec4(sum / max(weight, 1e-4), 1.0);
}
`;

const BLUR_FRAGMENT_GPU = /* wgsl */ `
struct BakeUniforms {
  uRotation: mat4x4<f32>,
  uFace: f32,
  uFlipX: f32,
  uDecode: f32,
  uEncode: f32,
  uIntensity: f32,
  uRoughness: f32,
  uSourceSize: f32,
}
@group(2) @binding(0) var<uniform> bakeUniforms: BakeUniforms;
@group(2) @binding(1) var uSource: texture_cube<f32>;
@group(2) @binding(2) var uSourceSampler: sampler;
const PI = 3.14159265359;
fn faceDirection(face: f32, uv: vec2<f32>) -> vec3<f32> {
  let u = uv.x * 2.0 - 1.0;
  let v = uv.y * 2.0 - 1.0;
  if (face < 0.5) { return vec3<f32>(1.0, -v, -u); }
  if (face < 1.5) { return vec3<f32>(-1.0, -v, u); }
  if (face < 2.5) { return vec3<f32>(u, 1.0, v); }
  if (face < 3.5) { return vec3<f32>(u, -1.0, -v); }
  if (face < 4.5) { return vec3<f32>(u, -v, 1.0); }
  return vec3<f32>(-u, -v, -1.0);
}
fn radicalInverse(input: u32) -> f32 {
  var bits = input;
  bits = (bits << 16u) | (bits >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return f32(bits) * 2.3283064365386963e-10;
}
@fragment
fn mainFragment(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
  let N = normalize(faceDirection(bakeUniforms.uFace, vUV));
  var up = vec3<f32>(1.0, 0.0, 0.0);
  if (abs(N.z) < 0.999) { up = vec3<f32>(0.0, 0.0, 1.0); }
  let tangent = normalize(cross(up, N));
  let bitangent = cross(N, tangent);
  let a = bakeUniforms.uRoughness * bakeUniforms.uRoughness;
  let a2 = a * a;
  let texelAngle = 4.0 * PI / (6.0 * bakeUniforms.uSourceSize * bakeUniforms.uSourceSize);
  var sum = vec3<f32>(0.0);
  var weight = 0.0;
  for (var i = 0u; i < ${BLUR_SAMPLES}u; i++) {
    let xi = vec2<f32>(f32(i) / ${BLUR_SAMPLES}.0, radicalInverse(i));
    let phi = 2.0 * PI * xi.x;
    let cosTheta = sqrt((1.0 - xi.y) / (1.0 + (a2 - 1.0) * xi.y));
    let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    let H = tangent * (cos(phi) * sinTheta) + bitangent * (sin(phi) * sinTheta) + N * cosTheta;
    let L = normalize(2.0 * dot(N, H) * H - N);
    let NdotL = dot(N, L);
    if (NdotL <= 0.0) { continue; }
    let d = cosTheta * cosTheta * (a2 - 1.0) + 1.0;
    let pdf = a2 / (PI * d * d) / 4.0;
    let lod = 0.5 * log2(1.0 / (${BLUR_SAMPLES}.0 * pdf * texelAngle)) + 1.0;
    sum += textureSampleLevel(uSource, uSourceSampler, L, max(lod, 0.0)).rgb * NdotL;
    weight += NdotL;
  }
  return vec4<f32>(sum / max(weight, 1e-4), 1.0);
}
`;

/** three's tone mapping curves, after its `tonemapping_pars_fragment`; pixi-3d's ACES is the same fit */
const TONE_MAPPING_GL = /* glsl */ `
vec3 toneMap(vec3 color, float mode, float exposure) {
  if (mode < 0.5) return color;
  color *= exposure;
  if (mode < 1.5) return clamp(color, 0.0, 1.0);
  if (mode < 2.5) return clamp(color / (vec3(1.0) + color), 0.0, 1.0);
  if (mode < 3.5) {
    color = max(vec3(0.0), color - 0.004);
    return pow((color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06), vec3(2.2));
  }
  const mat3 inMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 outMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color = inMat * (color / 0.6);
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  return clamp(outMat * (a / b), 0.0, 1.0);
}
`;

const TONE_MAPPING_GPU = /* wgsl */ `
fn toneMap(input: vec3<f32>, mode: f32, exposure: f32) -> vec3<f32> {
  if (mode < 0.5) { return input; }
  var color = input * exposure;
  if (mode < 1.5) { return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0)); }
  if (mode < 2.5) { return clamp(color / (vec3<f32>(1.0) + color), vec3<f32>(0.0), vec3<f32>(1.0)); }
  if (mode < 3.5) {
    color = max(vec3<f32>(0.0), color - 0.004);
    return pow((color * (6.2 * color + 0.5)) / (color * (6.2 * color + 1.7) + 0.06), vec3<f32>(2.2));
  }
  let inMat = mat3x3<f32>(vec3<f32>(0.59719, 0.07600, 0.02840), vec3<f32>(0.35458, 0.90834, 0.13383), vec3<f32>(0.04823, 0.01566, 0.83777));
  let outMat = mat3x3<f32>(vec3<f32>(1.60475, -0.10208, -0.00327), vec3<f32>(-0.53108, 1.10813, -0.07276), vec3<f32>(-0.07367, -0.00605, 1.07602));
  color = inMat * (color / 0.6);
  let a = color * (color + 0.0245786) - 0.000090537;
  let b = color * (0.983729 * color + 0.4329510) + 0.238081;
  return clamp(outMat * (a / b), vec3<f32>(0.0), vec3<f32>(1.0));
}
`;

/**
 * The backdrop: a scene's background cube drawn behind its view, as three draws `scene.background`.
 * `uDirection` takes the texel's (x, y, 1) in normalised device coordinates to a direction in the
 * cube, with the camera's rotation, field of view and the background's rotation in it. The cube holds
 * linear radiance with mips, and `uLod` blurs it. A background three tone maps (one not stored in sRGB)
 * goes through the renderer's curve; then it is encoded for the canvas, or for a target.
 */
const BACKDROP_FRAGMENT_GL = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 finalColor;
uniform samplerCube uCube;
uniform mat4 uDirection;
uniform float uLod;
uniform float uIntensity;
uniform float uToneMapping;
uniform float uExposure;
uniform float uEncode;
${TRANSFER_GL}
${TONE_MAPPING_GL}
void main() {
  vec3 ndc = vec3(vUV.x * 2.0 - 1.0, 1.0 - vUV.y * 2.0, 1.0);
  vec3 dir = mat3(uDirection) * ndc;
  vec3 color = textureLod(uCube, dir, uLod).rgb * uIntensity;
  finalColor = vec4(encodeTransfer(toneMap(color, uToneMapping, uExposure), uEncode), 1.0);
}
`;

const BACKDROP_FRAGMENT_GPU = /* wgsl */ `
struct BackdropUniforms {
  uDirection: mat4x4<f32>,
  uLod: f32,
  uIntensity: f32,
  uToneMapping: f32,
  uExposure: f32,
  uEncode: f32,
}
@group(2) @binding(0) var<uniform> backdropUniforms: BackdropUniforms;
@group(2) @binding(1) var uCube: texture_cube<f32>;
@group(2) @binding(2) var uCubeSampler: sampler;
${TRANSFER_GPU}
${TONE_MAPPING_GPU}
@fragment
fn mainFragment(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
  let ndc = vec3<f32>(vUV.x * 2.0 - 1.0, 1.0 - vUV.y * 2.0, 1.0);
  let d = backdropUniforms.uDirection;
  let dir = mat3x3<f32>(d[0].xyz, d[1].xyz, d[2].xyz) * ndc;
  let color = textureSampleLevel(uCube, uCubeSampler, dir, backdropUniforms.uLod).rgb * backdropUniforms.uIntensity;
  let mapped = toneMap(color, backdropUniforms.uToneMapping, backdropUniforms.uExposure);
  return vec4<f32>(encodeTransfer(mapped, backdropUniforms.uEncode), 1.0);
}
`;

/**
 * The programs of the bake from a cube source or an equirectangular one
 * @param cube - Whether the source is a cube
 * @internal
 */
export const bakePrograms = (cube: boolean): { glProgram: GlProgram; gpuProgram: GpuProgram } =>
  program(cube ? 'environment-bake-cube' : 'environment-bake-equirect', () => bakeFragment(cube));

/**
 * The programs of the GGX blur of a linear cube with mips
 * @internal
 */
export const blurPrograms = (): { glProgram: GlProgram; gpuProgram: GpuProgram } =>
  program('environment-blur', () => ({ gl: BLUR_FRAGMENT_GL, gpu: BLUR_FRAGMENT_GPU }));

/**
 * The programs of the backdrop that draws a scene's background cube
 * @internal
 */
export const backdropPrograms = (): { glProgram: GlProgram; gpuProgram: GpuProgram } =>
  program('environment-backdrop', () => ({ gl: BACKDROP_FRAGMENT_GL, gpu: BACKDROP_FRAGMENT_GPU }));

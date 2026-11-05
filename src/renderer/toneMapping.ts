import type { ShaderBit, View3D } from '@pixi/3d';

/** three's tone mapping curves, by the value of three's constant (`NoToneMapping` is 0, `NeutralToneMapping` 7) */
const CURVES = ['none', 'linear', 'reinhard', 'cineon', 'aces', 'none', 'agx', 'neutral'] as const;

type Curve = (typeof CURVES)[number];

/** The GLSL and WGSL of each curve, as three's `tonemapping_pars_fragment`; pixi-3d has applied the exposure already */
const CURVE_CODE: Record<Exclude<Curve, 'none'>, { gl: string; gpu: string }> = {
  linear: {
    gl: 'vec3 threeToneMap(vec3 color) { return clamp(color, 0.0, 1.0); }',
    gpu: 'fn threeToneMap(color: vec3<f32>) -> vec3<f32> { return clamp(color, vec3<f32>(0.0), vec3<f32>(1.0)); }',
  },
  reinhard: {
    gl: 'vec3 threeToneMap(vec3 color) { return clamp(color / (vec3(1.0) + color), 0.0, 1.0); }',
    gpu: 'fn threeToneMap(color: vec3<f32>) -> vec3<f32> { return clamp(color / (vec3<f32>(1.0) + color), vec3<f32>(0.0), vec3<f32>(1.0)); }',
  },
  cineon: {
    gl: `vec3 threeToneMap(vec3 color) {
  vec3 c = max(vec3(0.0), color - 0.004);
  return pow((c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06), vec3(2.2));
}`,
    gpu: `fn threeToneMap(color: vec3<f32>) -> vec3<f32> {
  let c = max(vec3<f32>(0.0), color - vec3<f32>(0.004));
  return pow((c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06), vec3<f32>(2.2));
}`,
  },
  aces: {
    gl: `vec3 threeToneMap(vec3 color) {
  const mat3 inputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 outputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  vec3 v = inputMat * (color / 0.6);
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(outputMat * (a / b), 0.0, 1.0);
}`,
    gpu: `fn threeToneMap(color: vec3<f32>) -> vec3<f32> {
  let inputMat = mat3x3<f32>(vec3<f32>(0.59719, 0.07600, 0.02840), vec3<f32>(0.35458, 0.90834, 0.13383), vec3<f32>(0.04823, 0.01566, 0.83777));
  let outputMat = mat3x3<f32>(vec3<f32>(1.60475, -0.10208, -0.00327), vec3<f32>(-0.53108, 1.10813, -0.07276), vec3<f32>(-0.07367, -0.00605, 1.07602));
  let v = inputMat * (color / 0.6);
  let a = v * (v + 0.0245786) - 0.000090537;
  let b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(outputMat * (a / b), vec3<f32>(0.0), vec3<f32>(1.0));
}`,
  },
  agx: {
    gl: `vec3 threeToneMap(vec3 color) {
  const mat3 srgbToRec2020 = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
  const mat3 rec2020ToSrgb = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
  const mat3 inset = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
  const mat3 outset = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
  vec3 c = inset * (srgbToRec2020 * color);
  c = clamp((log2(max(c, 1e-10)) + 12.47393) / 16.50000, 0.0, 1.0);
  vec3 c2 = c * c;
  vec3 c4 = c2 * c2;
  c = 15.5 * c4 * c2 - 40.14 * c4 * c + 31.96 * c4 - 6.868 * c2 * c + 0.4298 * c2 + 0.1191 * c - 0.00232;
  c = pow(max(vec3(0.0), outset * c), vec3(2.2));
  return clamp(rec2020ToSrgb * c, 0.0, 1.0);
}`,
    gpu: `fn threeToneMap(color: vec3<f32>) -> vec3<f32> {
  let srgbToRec2020 = mat3x3<f32>(vec3<f32>(0.6274, 0.0691, 0.0164), vec3<f32>(0.3293, 0.9195, 0.0880), vec3<f32>(0.0433, 0.0113, 0.8956));
  let rec2020ToSrgb = mat3x3<f32>(vec3<f32>(1.6605, -0.1246, -0.0182), vec3<f32>(-0.5876, 1.1329, -0.1006), vec3<f32>(-0.0728, -0.0083, 1.1187));
  let inset = mat3x3<f32>(vec3<f32>(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3<f32>(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3<f32>(0.0482516061458583, 0.101439036467562, 0.811302368396859));
  let outset = mat3x3<f32>(vec3<f32>(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3<f32>(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3<f32>(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
  var c = inset * (srgbToRec2020 * color);
  c = clamp((log2(max(c, vec3<f32>(1e-10))) + 12.47393) / 16.50000, vec3<f32>(0.0), vec3<f32>(1.0));
  let c2 = c * c;
  let c4 = c2 * c2;
  c = 15.5 * c4 * c2 - 40.14 * c4 * c + 31.96 * c4 - 6.868 * c2 * c + 0.4298 * c2 + 0.1191 * c - 0.00232;
  c = pow(max(vec3<f32>(0.0), outset * c), vec3<f32>(2.2));
  return clamp(rec2020ToSrgb * c, vec3<f32>(0.0), vec3<f32>(1.0));
}`,
  },
  neutral: {
    gl: `vec3 threeToneMap(vec3 color) {
  float x = min(color.r, min(color.g, color.b));
  vec3 c = color - (x < 0.08 ? x - 6.25 * x * x : 0.04);
  float peak = max(c.r, max(c.g, c.b));
  if (peak < 0.76) return c;
  float newPeak = 1.0 - 0.0576 / (peak - 0.52);
  c *= newPeak / peak;
  return mix(c, vec3(newPeak), 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0));
}`,
    gpu: `fn threeToneMap(color: vec3<f32>) -> vec3<f32> {
  let x = min(color.r, min(color.g, color.b));
  var c = color - select(0.04, x - 6.25 * x * x, x < 0.08);
  let peak = max(c.r, max(c.g, c.b));
  if (peak < 0.76) { return c; }
  let newPeak = 1.0 - 0.0576 / (peak - 0.52);
  c *= newPeak / peak;
  return mix(c, vec3<f32>(newPeak), 1.0 - 1.0 / (0.15 * (peak - newPeak) + 1.0));
}`,
  },
};

const SRGB_OUTPUT = {
  gl: `vec3 threeOutput(vec3 color) {
  vec3 c = max(color, vec3(0.0));
  return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
}`,
  gpu: `fn threeOutput(color: vec3<f32>) -> vec3<f32> {
  let c = max(color, vec3<f32>(0.0));
  return select(pow(c, vec3<f32>(0.41666)) * 1.055 - vec3<f32>(0.055), c * 12.92, c <= vec3<f32>(0.0031308));
}`,
};

const LINEAR_OUTPUT = {
  gl: 'vec3 threeOutput(vec3 color) { return color; }',
  gpu: 'fn threeOutput(color: vec3<f32>) -> vec3<f32> { return color; }',
};

const NO_CURVE = {
  gl: 'vec3 threeToneMap(vec3 color) { return color; }',
  gpu: 'fn threeToneMap(color: vec3<f32>) -> vec3<f32> { return color; }',
};

/**
 * The slot a material's tone mapping bit leaves after its output transform, where fog is mixed in as
 * three mixes it: after the tone curve, in the output colour space. The fog code may call
 * `threeOutput(color)`, which takes a linear colour to the output colour space. WebGPU names a
 * fragment slot with a `fragment` prefix, so its marker is `{{fragmentThreeFog}}`.
 * @internal
 */
export const FOG_SLOT = 'threeFog';

const bits = new Map<string, ShaderBit>();

/**
 * The shader bit that ends a material's shader as three's renderer does: three's tone curve, then
 * the sRGB transfer function, or nothing for a linear output, then the fog slot
 *
 * pixi-3d ends with its own curves and a 2.2 power, which draws tones under about 1% of full
 * brightness up to twice as bright as three's sRGB curve does, and has no AgX or Neutral curve.
 * @param toneMapping - three's tone mapping constant
 * @param outputColorSpace - three's output colour space; `'srgb-linear'` leaves the result linear
 */
function toneMappingBit(toneMapping: number, outputColorSpace: string): ShaderBit {
  const curve: Curve = CURVES[toneMapping] ?? 'aces';
  const encode = outputColorSpace !== 'srgb-linear';
  const name = `threeToneMapping:${curve}:${encode ? 'srgb' : 'linear'}`;
  let bit = bits.get(name);
  if (bit) return bit;

  const code = curve === 'none' ? NO_CURVE : CURVE_CODE[curve];
  const output = encode ? SRGB_OUTPUT : LINEAR_OUTPUT;
  const end = 'finalColor = threeOutput(threeToneMap(finalColor));';
  const gpuSlot = `fragment${FOG_SLOT[0].toUpperCase()}${FOG_SLOT.slice(1)}`;

  bit = {
    name,
    gl: { header: `${code.gl}\n${output.gl}`, fragment: { end: `${end}\n{{${FOG_SLOT}}}` } },
    gpu: { header: `${code.gpu}\n${output.gpu}`, fragment: { end: `${end}\n{{${gpuSlot}}}` } },
  };
  bits.set(name, bit);
  return bit;
}

/**
 * Puts three's tone mapping and output colour space on a view, as the shader bit its materials and
 * background end with, and its exposure, which three leaves out with no tone mapping
 *
 * pixi-3d keeps the bit in `View3D._toneMappingBit` and has no public way to set one. Setting
 * `toneMapping` to another curve first queues every material in the view to look its shader up
 * again, which then finds this bit.
 * @param view - The view about to draw
 * @param toneMapping - three's tone mapping constant
 * @param exposure - three's `toneMappingExposure`
 * @param outputColorSpace - three's output colour space
 * @internal
 */
export function applyToneMapping(view: View3D, toneMapping: number, exposure: number, outputColorSpace: string): void {
  view.exposure = toneMapping === 0 || toneMapping === 5 ? 1 : exposure;
  const bit = toneMappingBit(toneMapping, outputColorSpace);
  if (view._toneMappingBit === bit) return;
  view.toneMapping = view.toneMapping === 'custom' ? 'none' : 'custom';
  view._toneMappingBit = bit;
}

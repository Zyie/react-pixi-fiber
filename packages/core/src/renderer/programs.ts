import { GlProgram, GpuProgram } from 'pixi.js';

/**
 * The vertex stage every full-surface mesh of the renderer shares: a pixi 2D mesh, placed by pixi's own matrices, so it
 * lands where pixi puts any 2D content in the canvas or a texture, with its 0 to 1 UVs passed on
 */
const VERTEX_GL = /* glsl */ `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

const VERTEX_GPU = /* wgsl */ `
struct GlobalUniforms {
  uProjectionMatrix: mat3x3<f32>,
  uWorldTransformMatrix: mat3x3<f32>,
  uWorldColorAlpha: vec4<f32>,
  uResolution: vec2<f32>,
}
struct LocalUniforms {
  uTransformMatrix: mat3x3<f32>,
  uColor: vec4<f32>,
  uRound: f32,
}
@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms: LocalUniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) vUV: vec2<f32>,
}

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>, @location(1) aUV: vec2<f32>) -> VertexOutput {
  let mvp = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;
  var output: VertexOutput;
  output.position = vec4<f32>((mvp * vec3<f32>(aPosition, 1.0)).xy, 0.0, 1.0);
  output.vUV = aUV;
  return output;
}
`;

const programs = new Map<string, { glProgram: GlProgram; gpuProgram: GpuProgram }>();

/**
 * Builds, once per name, the programs of a pixi 2D mesh with its own fragment stage, after the vertex
 * stage every mesh here shares
 * @param name - The programs' name, which keys the cache
 * @param fragment - Makes the GLSL and WGSL fragment stages
 * @category renderer
 * @advanced
 */
export function program(
  name: string,
  fragment: () => { gl: string; gpu: string },
): { glProgram: GlProgram; gpuProgram: GpuProgram } {
  let built = programs.get(name);
  if (!built) {
    const { gl, gpu } = fragment();
    built = {
      glProgram: GlProgram.from({ vertex: VERTEX_GL, fragment: gl, name }),
      gpuProgram: GpuProgram.from({
        vertex: { source: VERTEX_GPU, entryPoint: 'mainVertex' },
        fragment: { source: gpu, entryPoint: 'mainFragment' },
        name,
      }),
    };
    programs.set(name, built);
  }
  return built;
}

import { useAsset } from '@react-fiber/2d';
import { extend, useFrame, useTexture } from '@react-fiber/core';
import type { ThreeElement } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { BevelFilter, DropShadowFilter, GlowFilter, OutlineFilter } from 'pixi-filters';
import { defaultFilterVert, Filter, GlProgram, GpuProgram, UniformGroup } from 'pixi.js';
import type { AnimatedSprite, Spritesheet } from 'pixi.js';
import { useRef } from 'react';

/** The WGSL every filter here starts from: pixi's filter globals and vertex stage */
const WGSL_HEADER = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
  var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
  position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
  return VSOutput(vec4(position, 0.0, 1.0), aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw));
}
`;

const WAVE_WGSL = `${WGSL_HEADER}
struct WaveUniforms { uTime: f32, uAmplitude: f32 };
@group(1) @binding(0) var<uniform> wave: WaveUniforms;

@fragment
fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let offset = sin(uv.y * 40.0 + wave.uTime) * wave.uAmplitude;
  return textureSample(uTexture, uSampler, vec2(uv.x + offset, uv.y));
}`;

const WAVE_GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uAmplitude;

void main() {
  float offset = sin(vTextureCoord.y * 40.0 + uTime) * uAmplitude;
  finalColor = texture(uTexture, vec2(vTextureCoord.x + offset, vTextureCoord.y));
}`;

/** A filter of this app's own that shifts rows of pixels along a sine wave, which `time` moves */
class WaveFilter extends Filter {
  constructor({ amplitude = 0.01 }: { amplitude?: number } = {}) {
    super({
      glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: WAVE_GLSL, name: 'wave-filter' }),
      gpuProgram: GpuProgram.from({
        vertex: { source: WAVE_WGSL, entryPoint: 'mainVertex' },
        fragment: { source: WAVE_WGSL, entryPoint: 'mainFragment' },
      }),
      resources: {
        wave: new UniformGroup({ uTime: { value: 0, type: 'f32' }, uAmplitude: { value: amplitude, type: 'f32' } }),
      },
    });
  }

  public get time(): number {
    return (this.resources.wave as UniformGroup<{ uTime: { value: number; type: 'f32' } }>).uniforms.uTime;
  }

  public set time(value: number) {
    (this.resources.wave as UniformGroup<{ uTime: { value: number; type: 'f32' } }>).uniforms.uTime = value;
  }
}

const INVERT_WGSL = `${WGSL_HEADER}
@fragment
fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let color = textureSample(uTexture, uSampler, uv);
  return vec4(color.a - color.rgb, color.a);
}`;

/** The options of a filter written inline, without a class: it inverts colours */
const INVERT = {
  glProgram: GlProgram.from({
    vertex: defaultFilterVert,
    fragment: `in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() {
  vec4 color = texture(uTexture, vTextureCoord);
  finalColor = vec4(color.a - color.rgb, color.a);
}`,
    name: 'invert-filter',
  }),
  gpuProgram: GpuProgram.from({
    vertex: { source: INVERT_WGSL, entryPoint: 'mainVertex' },
    fragment: { source: INVERT_WGSL, entryPoint: 'mainFragment' },
  }),
  resources: {},
};

/** The glow's options: its shader is built from `distance` and `quality`, so they go in `args` */
const GLOW = { distance: 15, outerStrength: 3, color: 0xff69b4, quality: 1 };

extend({
  BevelFilter2D: BevelFilter,
  DropShadowFilter2D: DropShadowFilter,
  GlowFilter2D: GlowFilter,
  OutlineFilter2D: OutlineFilter,
  WaveFilter2D: WaveFilter,
});

declare module '@react-fiber/core' {
  interface ThreeElements {
    bevelFilter2D: ThreeElement<typeof BevelFilter>;
    dropShadowFilter2D: ThreeElement<typeof DropShadowFilter>;
    glowFilter2D: ThreeElement<typeof GlowFilter>;
    outlineFilter2D: ThreeElement<typeof OutlineFilter>;
    waveFilter2D: ThreeElement<typeof WaveFilter>;
  }
}

function Waving() {
  const texture = useTexture('/textures/quadrants.png?extend-filters');
  const wave = useRef<WaveFilter>(null);

  useFrame((_, delta) => {
    wave.current!.time += delta * 6;
  });

  return (
    <sprite2D texture={texture} x={20} y={165} width={110} height={110}>
      <waveFilter2D ref={wave} attach="filters-0" args={[{ amplitude: 0.03 }]} />
    </sprite2D>
  );
}

function Filtered() {
  const texture = useTexture('/textures/quadrants.png?extend-filters');
  const coins = useAsset<Spritesheet>('/sprites/coin.json');
  const coin = useRef<AnimatedSprite>(null);

  return (
    <>
      <graphics2D x={75} y={75} draw={(graphics) => graphics.star(0, 0, 5, 40, 18).fill(0xffe119)}>
        <glowFilter2D attach="filters-0" args={[GLOW]} />
      </graphics2D>
      <sprite2D texture={texture} x={155} y={20} width={90} height={90}>
        <dropShadowFilter2D attach="filters-0" offsetX={10} offsetY={10} alpha={1} color={0x4363d8} blur={1} />
      </sprite2D>
      <animatedSprite2D ref={coin} args={[coins.animations.spin]} x={280} y={20} scale={2}>
        <outlineFilter2D attach="filters-0" thickness={4} color={0xffffff} />
      </animatedSprite2D>
      <Waving />
      <sprite2D texture={texture} x={145} y={165} width={110} height={110}>
        <bevelFilter2D attach="filters-0" thickness={6} lightAlpha={0.8} shadowAlpha={0.8} />
      </sprite2D>
      <sprite2D texture={texture} x={270} y={165} width={110} height={110}>
        <filter2D attach="filters-0" args={[INVERT]} />
      </sprite2D>
    </>
  );
}

/**
 * Filters from outside pixi.js, made elements with `extend`. Top row, from pixi-filters: a yellow star
 * glowing pink, its glow built from `args` since pixi-filters compiles its shader from `distance` and `quality`; the
 * quadrants texture with a blue drop shadow 10 pixels down and right; and the coin outlined in white.
 * Bottom row: this scene's own `WaveFilter` class, whose rows `useFrame` has moved along a sine wave
 * for twenty frames; pixi-filters' bevel, 6 pixels of light and shadow on the edges; and a
 * `<filter2D>` built from `args` alone, a GLSL and WGSL program that inverts colours.
 */
export const scene: TestScene = {
  frames: 20,
  render: () => <Filtered />,
};

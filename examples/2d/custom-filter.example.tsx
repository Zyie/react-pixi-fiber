// #region result
import { Canvas, extend, useFrame, useTexture } from '@react-fiber/core';
import type { ThreeElement } from '@react-fiber/core';
import { defaultFilterVert, Filter, GlProgram, GpuProgram, UniformGroup } from 'pixi.js';
import { Suspense, useRef } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
// #region shaders
const GLSL = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uAmplitude;

void main() {
  float offset = sin(vTextureCoord.y * 60.0 + uTime) * uAmplitude;
  finalColor = texture(uTexture, vec2(vTextureCoord.x + offset, vTextureCoord.y));
}`;

const WGSL = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};
struct WaveUniforms { uTime: f32, uAmplitude: f32 };

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> wave: WaveUniforms;

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

@fragment
fn mainFragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let offset = sin(uv.y * 60.0 + wave.uTime) * wave.uAmplitude;
  return textureSample(uTexture, uSampler, vec2(uv.x + offset, uv.y));
}`;
// #endregion shaders

// #region class
type WaveUniforms = { uTime: { value: number; type: 'f32' }; uAmplitude: { value: number; type: 'f32' } };

/** Shifts each row of pixels along a sine wave, which moves with `time` */
class WaveFilter extends Filter {
  constructor({ amplitude = 0.02 }: { amplitude?: number } = {}) {
    super({
      glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: GLSL, name: 'wave-filter' }),
      gpuProgram: GpuProgram.from({
        vertex: { source: WGSL, entryPoint: 'mainVertex' },
        fragment: { source: WGSL, entryPoint: 'mainFragment' },
      }),
      resources: {
        wave: new UniformGroup<WaveUniforms>({
          uTime: { value: 0, type: 'f32' },
          uAmplitude: { value: amplitude, type: 'f32' },
        }),
      },
    });
  }

  public get time(): number {
    return (this.resources.wave as UniformGroup<WaveUniforms>).uniforms.uTime;
  }

  public set time(value: number) {
    (this.resources.wave as UniformGroup<WaveUniforms>).uniforms.uTime = value;
  }
}

extend({ WaveFilter2D: WaveFilter });

declare module '@react-fiber/core' {
  interface ThreeElements {
    waveFilter2D: ThreeElement<typeof WaveFilter>;
  }
}
// #endregion class

// #region use
function Wavy() {
  const bricks = useTexture('/textures/bricks.png');
  const wave = useRef<WaveFilter>(null);

  useFrame((_, delta) => {
    wave.current!.time += delta * 4;
  });

  return (
    <container2D>
      <tilingSprite2D texture={bricks} x={40} y={40} width={320} height={160} />
      <text2D
        text="UNDERWATER"
        anchor={0.5}
        x={200}
        y={250}
        style={{ fill: '#a8dadc', fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold' }}
      />
      <waveFilter2D ref={wave} attach="filters-0" args={[{ amplitude: 0.01 }]} />
    </container2D>
  );
}
// #endregion use

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Wavy />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A filter class of the app's own, made an element with extend, waving a brick wall and a title */
export const example: Example = {
  title: 'Your own filter',
  frames: 20,
  render: () => <Wavy />,
};

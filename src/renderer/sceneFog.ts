import type { Container3D, Fog as PixiFog, ShaderBit, View3D } from '@pixi/3d';

import type { Fog } from '../catalog/scene/Fog';
import type { FogExp2 } from '../catalog/scene/FogExp2';
import { LinearToSRGB } from '../math/ColorManagement';
import { FOG_SLOT } from './toneMapping';

type SceneFog = Fog | FogExp2;
type FogType = 'linear' | 'exp2';

interface FogState {
  readonly pixi: PixiFog & { color: [number, number, number] };
  readonly source: SceneFog;
}

const states = new WeakMap<View3D, FogState>();

/** How much fog a fragment takes at its view depth, as three's `fog_fragment` works it out */
const FOG_FACTOR: Record<FogType, { gl: string; gpu: string }> = {
  linear: {
    gl: 'smoothstep(uFogParams.x, uFogParams.y, vFogDepth)',
    gpu: 'smoothstep(global.uFogParams.x, global.uFogParams.y, input.vFogDepth)',
  },
  exp2: {
    gl: '1.0 - exp(-(uFogParams.z * vFogDepth) * (uFogParams.z * vFogDepth))',
    gpu: '1.0 - exp(-(global.uFogParams.z * input.vFogDepth) * (global.uFogParams.z * input.vFogDepth))',
  },
};

/**
 * pixi-3d's fog bit with the mix moved to the tone mapping bit's fog slot, after the tone curve and
 * the output transform, as three mixes fog
 *
 * It keeps pixi-3d's view depth varying and reads the fog uniforms pixi-3d uploads from the view's
 * fog. `uFogColor` arrives decoded to linear and scaled by the exposure, so dividing the exposure out
 * gives three's linear fog colour, which `threeOutput` takes to the output colour space.
 * @param type - The fog's curve
 */
const fogBit = (type: FogType): ShaderBit => ({
  name: `threeFog:${type}`,
  interStage: { vFogDepth: 'f32' },
  gl: {
    vertex: { afterTransform: 'vFogDepth = -(uViewMatrix * worldPosition).z;' },
    fragment: {
      [FOG_SLOT]: `finalColor = mix(finalColor, threeOutput(uFogColor / uExposure), ${FOG_FACTOR[type].gl});`,
    },
  },
  gpu: {
    vertex: { afterTransform: 'output.vFogDepth = -(camera.uViewMatrix * worldPosition).z;' },
    fragment: {
      [FOG_SLOT]: `finalColor = mix(finalColor, threeOutput(global.uFogColor / global.uExposure), ${FOG_FACTOR[type].gpu});`,
    },
  },
});

const FOG_BITS: Record<FogType, ShaderBit> = { linear: fogBit('linear'), exp2: fogBit('exp2') };

const toDisplay = (channel: number): number => Math.min(Math.max(LinearToSRGB(channel), 0), 1);

/**
 * Hands a scene's three fog to its view: `Fog` as linear fog and `FogExp2` as `exp2`, mixed in after
 * the tone curve as three mixes it, so a fully fogged surface shows the fog colour itself
 *
 * pixi-3d mixes its fog in before the tone curve and has no public way to move it. The view keeps
 * the pixi-3d fog object for its uniforms, and its fog bit, `View3D._fogBit`, is swapped for one that
 * mixes in the slot the tone mapping bit leaves. A material whose `toneMapped` is off has no such slot
 * and takes no fog. pixi-3d keeps the fog object it is given, so the settings are copied each frame.
 * @param view - The view about to draw
 * @param scene - Its scene, whose `fog` is read
 * @internal
 */
export function applyFog(view: View3D, scene: Container3D): void {
  const fog = (scene as Container3D & { fog?: SceneFog | null }).fog;
  if (!fog || !('isFog' in fog || 'isFogExp2' in fog)) {
    if (states.has(view)) {
      states.delete(view);
      view.fog = null;
    }
    return;
  }

  const type: FogType = 'isFog' in fog ? 'linear' : 'exp2';
  let state = states.get(view);
  if (state?.source !== fog) {
    state = { pixi: { type, color: [0, 0, 0] }, source: fog };
    states.set(view, state);
    view.fog = state.pixi;
  }
  if (view._fogBit !== FOG_BITS[type]) view._fogBit = FOG_BITS[type];

  const { pixi } = state;
  if ('isFog' in fog) {
    pixi.near = fog.near;
    pixi.far = fog.far;
  } else {
    pixi.density = fog.density;
  }
  pixi.color[0] = toDisplay(fog.color.r);
  pixi.color[1] = toDisplay(fog.color.g);
  pixi.color[2] = toDisplay(fog.color.b);
}

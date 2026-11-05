import { Track } from '@pixi/3d';
import type { InterpolationMode } from '@pixi/3d';

import { InterpolateDiscrete, InterpolateLinear, InterpolateSmooth } from '../catalog/constants';

const PIXI_MODES: Record<number, InterpolationMode> = {
  [InterpolateDiscrete]: 'STEP',
  [InterpolateLinear]: 'LINEAR',
  [InterpolateSmooth]: 'LINEAR',
};

const THREE_MODES: Record<InterpolationMode, number> = {
  STEP: InterpolateDiscrete,
  LINEAR: InterpolateLinear,
  CUBICSPLINE: InterpolateSmooth,
};

/**
 * What a keyframe track's interpolation can be: one of three's constants (`InterpolateDiscrete`,
 * `InterpolateLinear`, `InterpolateSmooth`), or pixi-3d's `'CUBICSPLINE'`, which glTF's cubic tracks use
 * @category catalog
 * @advanced
 */
export type KeyframeInterpolation = number | InterpolationMode;

/**
 * three's `KeyframeTrack` over pixi-3d's `Track`: keyframe times and values for one property, named
 * `'<node>.<property>'` as three names them (`'Hips.quaternion'`, `'.position'`,
 * `'Face.morphTargetInfluences[smile]'`)
 *
 * pixi-3d samples it: `InterpolateLinear` blends, `InterpolateDiscrete` steps, and glTF's cubic
 * spline follows its tangents. three's `InterpolateSmooth` (Catmull-Rom between plain keyframes)
 * samples linearly here.
 * @example
 * ```ts
 * const bob = new VectorKeyframeTrack('.position', [0, 1, 2], [0, 0, 0, 0, 1, 0, 0, 0, 0]);
 * ```
 * @category catalog
 * @advanced
 */
export class KeyframeTrack extends Track {
  /** The interpolation a track starts with, `InterpolateLinear` */
  public static DefaultInterpolation: number = InterpolateLinear;

  /** The kind of value, three's `ValueTypeName`: `'number'`, `'vector'`, `'quaternion'`, `'color'` or `'bool'` */
  public get ValueTypeName(): string {
    return '';
  }

  /**
   * @param name - `'<node>.<property>'`, as three names a track
   * @param times - Keyframe times in seconds, ascending
   * @param values - Keyframe values, the same number for each keyframe
   * @param interpolation - How the time between keyframes is filled
   */
  constructor(
    name: string,
    times: ArrayLike<number>,
    values: ArrayLike<number>,
    interpolation?: KeyframeInterpolation,
  ) {
    const mode =
      typeof interpolation === 'string'
        ? interpolation
        : (PIXI_MODES[interpolation ?? (new.target as typeof KeyframeTrack).DefaultInterpolation] ?? 'LINEAR');
    const perKey = times.length > 0 ? values.length / times.length : values.length;

    super({
      label: name,
      times: Float32Array.from(times),
      values: Float32Array.from(values),
      interpolation: mode,
      valueSize: mode === 'CUBICSPLINE' ? perKey / 3 : perKey,
    });
  }

  /** The property the track drives, `'<node>.<property>'`; pixi-3d's `label` */
  public get name(): string {
    return this.label;
  }

  public set name(value: string) {
    this.label = value;
  }

  /** How the time between keyframes is filled, as three's constant */
  public getInterpolation(): number {
    return THREE_MODES[this.interpolation];
  }

  /**
   * Sets how the time between keyframes is filled
   * @param interpolation - three's constant, or pixi-3d's mode
   * @returns This track
   */
  public setInterpolation(interpolation: KeyframeInterpolation): this {
    this.interpolation = typeof interpolation === 'string' ? interpolation : (PIXI_MODES[interpolation] ?? 'LINEAR');
    return this;
  }

  /** How many numbers each keyframe holds */
  public getValueSize(): number {
    return this.valueSize;
  }

  /**
   * Moves every keyframe by a time
   * @param timeOffset - Seconds to add
   * @returns This track
   */
  public shift(timeOffset: number): this {
    if (timeOffset !== 0) for (let i = 0; i < this.times.length; i++) this.times[i] += timeOffset;
    return this;
  }

  /**
   * Scales every keyframe's time
   * @param timeScale - The factor
   * @returns This track
   */
  public scale(timeScale: number): this {
    if (timeScale !== 1) for (let i = 0; i < this.times.length; i++) this.times[i] *= timeScale;
    return this;
  }

  /**
   * Drops the keyframes outside a span of time, keeping one on each side of it
   * @param startTime - First second to keep
   * @param endTime - Last second to keep
   * @returns This track
   */
  public trim(startTime: number, endTime: number): this {
    const times = this.times;
    const count = times.length;
    let from = 0;
    let to = count - 1;

    while (from !== count && times[from] < startTime) ++from;
    while (to !== -1 && times[to] > endTime) --to;
    ++to;

    if (from !== 0 || to !== count) {
      if (from >= to) {
        to = Math.max(to, 1);
        from = to - 1;
      }

      const stride = this.interpolation === 'CUBICSPLINE' ? this.valueSize * 3 : this.valueSize;

      this.times = times.slice(from, to);
      this.values = this.values.slice(from * stride, to * stride);
    }

    return this;
  }

  /** Whether the times ascend and the values are numbers, as three checks */
  public validate(): boolean {
    const { times, values } = this;
    const stride = this.interpolation === 'CUBICSPLINE' ? this.valueSize * 3 : this.valueSize;

    if (times.length === 0 || values.length !== times.length * stride) return false;

    for (let i = 0; i < times.length; i++) {
      if (Number.isNaN(times[i]) || (i > 0 && times[i] < times[i - 1])) return false;
    }

    return !values.some(Number.isNaN);
  }

  /** Removes keyframes that repeat the one before; kept as is, as pixi-3d samples them the same */
  public optimize(): this {
    return this;
  }

  /** A copy of the track, with its own keyframes */
  public clone(): this {
    const Kind = this.constructor as new (
      name: string,
      times: ArrayLike<number>,
      values: ArrayLike<number>,
      interpolation?: KeyframeInterpolation,
    ) => this;

    return new Kind(this.name, this.times, this.values, this.interpolation);
  }
}

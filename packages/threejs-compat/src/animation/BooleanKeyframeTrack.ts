import { InterpolateDiscrete } from '../catalog/constants';
import { KeyframeTrack } from './KeyframeTrack';

/**
 * three's `BooleanKeyframeTrack`: keyframes for a flag, such as `'.visible'`, which step from one to
 * the next
 * @example
 * ```ts
 * const blink = new BooleanKeyframeTrack('Box.visible', [0, 0.5], [true, false]);
 * ```
 * @category catalog
 * @advanced
 */
export class BooleanKeyframeTrack extends KeyframeTrack {
  /** Always `InterpolateDiscrete`: a flag steps */
  public static override DefaultInterpolation: number = InterpolateDiscrete;

  /** `'bool'` */
  public override get ValueTypeName(): string {
    return 'bool';
  }

  /**
   * @param name - `'<node>.<property>'`
   * @param times - Keyframe times in seconds
   * @param values - The flag at each keyframe
   */
  constructor(name: string, times: ArrayLike<number>, values: ArrayLike<boolean | number>) {
    super(name, times, Array.from(values, Number), InterpolateDiscrete);
  }
}

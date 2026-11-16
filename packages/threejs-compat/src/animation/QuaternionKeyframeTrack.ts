import { QuaternionTrack } from '@pixi/3d';

import { KeyframeTrack } from './KeyframeTrack';

type Interpolate = (
  this: KeyframeTrack,
  index: number,
  nextIndex: number,
  t: number,
  duration: number,
  target: Float32Array | number[],
) => void;

type Blend = (this: KeyframeTrack, values: Float32Array, sample: Float32Array, t: number) => void;

const quaternionTrack = QuaternionTrack.prototype as unknown as { interpolate: Interpolate; blendInto: Blend };

/**
 * three's `QuaternionKeyframeTrack`: keyframes for a rotation, such as `'Hips.quaternion'`, which
 * pixi-3d slerps between, taking the short way round
 * @example
 * ```ts
 * const turn = new QuaternionKeyframeTrack('.quaternion', [0, 1], [0, 0, 0, 1, 0, 1, 0, 0]);
 * ```
 * @category catalog
 * @advanced
 */
export class QuaternionKeyframeTrack extends KeyframeTrack {
  /** `'quaternion'` */
  public override get ValueTypeName(): string {
    return 'quaternion';
  }

  /**
   * Blends a sampled rotation into a running one, on the same side of the sphere
   * @param values - The running rotation, changed in place
   * @param sample - The rotation to blend in
   * @param t - How much of `sample` to take
   */
  public override blendInto(values: Float32Array, sample: Float32Array, t: number): void {
    quaternionTrack.blendInto.call(this, values, sample, t);
  }

  protected override interpolate(
    index: number,
    nextIndex: number,
    t: number,
    duration: number,
    target: Float32Array | number[],
  ): void {
    quaternionTrack.interpolate.call(this, index, nextIndex, t, duration, target);
  }
}

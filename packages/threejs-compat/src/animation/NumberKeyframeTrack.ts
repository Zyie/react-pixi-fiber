import { KeyframeTrack } from './KeyframeTrack';

/**
 * three's `NumberKeyframeTrack`: keyframes for numbers, such as `'.material.opacity'` or every
 * `'.morphTargetInfluences'` at once
 * @example
 * ```ts
 * const fade = new NumberKeyframeTrack('Box.material.opacity', [0, 1], [1, 0]);
 * ```
 * @category catalog
 * @advanced
 */
export class NumberKeyframeTrack extends KeyframeTrack {
  /** `'number'` */
  public override get ValueTypeName(): string {
    return 'number';
  }
}

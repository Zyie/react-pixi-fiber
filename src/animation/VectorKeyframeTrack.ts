import { KeyframeTrack } from './KeyframeTrack';

/**
 * three's `VectorKeyframeTrack`: keyframes for a vector, such as `'.position'` or `'.scale'`
 * @example
 * ```ts
 * const rise = new VectorKeyframeTrack('Box.position', [0, 1], [0, 0, 0, 0, 2, 0]);
 * ```
 * @category catalog
 * @advanced
 */
export class VectorKeyframeTrack extends KeyframeTrack {
  /** `'vector'` */
  public override get ValueTypeName(): string {
    return 'vector';
  }
}

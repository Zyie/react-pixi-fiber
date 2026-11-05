import { KeyframeTrack } from './KeyframeTrack';

/**
 * three's `ColorKeyframeTrack`: keyframes for a colour's red, green and blue, in the working colour
 * space, such as `'.material.color'`
 * @example
 * ```ts
 * const blush = new ColorKeyframeTrack('Box.material.color', [0, 1], [1, 1, 1, 1, 0, 0]);
 * ```
 * @category catalog
 * @advanced
 */
export class ColorKeyframeTrack extends KeyframeTrack {
  /** `'color'` */
  public override get ValueTypeName(): string {
    return 'color';
  }
}

import { Quaternion } from '@pixi/3d';

import type { PropertyBinding } from './PropertyBinding';

/**
 * Blends the values every playing action gives one property, then writes the blend, as three's
 * `PropertyMixer` does: actions accumulate by weight, and while their weights add up to less than 1
 * the property's value from before any action played makes up the rest
 * @internal
 */
export class PropertyMixer {
  public readonly binding: PropertyBinding;
  public readonly valueSize: number;
  /** Where each action's track writes its sample, which `accumulate` reads */
  public readonly incoming: Float32Array;
  /** Actions that hold this binding, playing or not */
  public referenceCount = 0;
  /** Playing actions that drive it */
  public useCount = 0;

  private readonly _buffer: Float64Array;
  private readonly _kind: 'quaternion' | 'select' | 'lerp';
  private _cumulativeWeight = 0;

  /**
   * @param binding - The property
   * @param typeName - The track's `ValueTypeName`
   * @param valueSize - Numbers in a value
   */
  constructor(binding: PropertyBinding, typeName: string, valueSize: number) {
    this.binding = binding;
    this.valueSize = valueSize;
    this.incoming = new Float32Array(valueSize);
    this._buffer = new Float64Array(valueSize * 2);
    this._kind =
      typeName === 'quaternion' ? 'quaternion' : typeName === 'bool' || typeName === 'string' ? 'select' : 'lerp';
  }

  /**
   * Adds the incoming sample to the blend with a weight
   * @param weight - The action's weight
   */
  public accumulate(weight: number): void {
    const size = this.valueSize;
    const buffer = this._buffer;
    const incoming = this.incoming;
    const total = this._cumulativeWeight;

    if (total === 0) {
      for (let i = 0; i < size; i++) buffer[i] = incoming[i];
      this._cumulativeWeight = weight;

      return;
    }

    this._cumulativeWeight = total + weight;
    this._mix(incoming, 0, weight / this._cumulativeWeight);
  }

  /** Writes the blend to the property, made up with the original value where the weights fall short */
  public apply(): void {
    const weight = this._cumulativeWeight;

    this._cumulativeWeight = 0;
    if (weight < 1) this._mix(this._buffer, this.valueSize, 1 - weight);

    this.binding.setValue(this._buffer, 0);
  }

  /** Remembers the property's value before any action drives it */
  public saveOriginalState(): void {
    this.binding.getValue(this._buffer, this.valueSize);
    this._cumulativeWeight = 0;
  }

  /** Puts back the value `saveOriginalState` remembered */
  public restoreOriginalState(): void {
    this.binding.setValue(this._buffer, this.valueSize);
  }

  /** Moves the blend toward a value in `source` at `offset` by `t` */
  private _mix(source: ArrayLike<number>, offset: number, t: number): void {
    const buffer = this._buffer;
    const size = this.valueSize;

    if (this._kind === 'select') {
      if (t >= 0.5) for (let i = 0; i < size; i++) buffer[i] = source[offset + i];
    } else if (this._kind === 'quaternion') {
      Quaternion.slerpFlat(
        buffer as unknown as number[],
        0,
        buffer as unknown as number[],
        0,
        source as unknown as number[],
        offset,
        t,
      );
    } else {
      const s = 1 - t;

      for (let i = 0; i < size; i++) buffer[i] = buffer[i] * s + source[offset + i] * t;
    }
  }
}

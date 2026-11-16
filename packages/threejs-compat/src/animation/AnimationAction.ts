import type { Container3D } from '@pixi/3d';

import { LoopOnce, LoopPingPong, LoopRepeat, NormalAnimationBlendMode } from '../catalog/constants';
import type { AnimationClip } from './AnimationClip';
import type { AnimationMixer } from './AnimationMixer';
import type { PropertyMixer } from './PropertyMixer';

/** A value that moves in a straight line from one time to another and holds outside them: a fade or a warp */
interface Ramp {
  times: [number, number];
  values: [number, number];
}

function sampleRamp({ times, values }: Ramp, time: number): number {
  if (time <= times[0]) return values[0];
  if (time >= times[1]) return values[1];

  return values[0] + ((values[1] - values[0]) * (time - times[0])) / (times[1] - times[0]);
}

/**
 * three's `AnimationAction`: plays one clip on one root for an `AnimationMixer`, with its own time,
 * speed, weight, looping and fades
 *
 * `mixer.clipAction(clip)` makes it. Everything three's has works the same: `play`, `stop`, `reset`,
 * `paused`, `time`, `timeScale`, `weight`, `setLoop` with `LoopOnce`, `LoopRepeat` and `LoopPingPong`,
 * `repetitions`, `clampWhenFinished`, `startAt`, `fadeIn`, `fadeOut`, `crossFadeTo`, `crossFadeFrom`
 * with warping, `warp`, `halt`, `setDuration` and `syncWith`. Weights blend as three's do: while the
 * playing actions' weights add up to less than 1, the pose from before they played makes up the
 * rest. Additive blending plays as normal.
 * @example
 * ```ts
 * const walk = mixer.clipAction('Walk');
 * walk.play();
 * walk.crossFadeTo(mixer.clipAction('Run').play(), 0.5, true);
 * ```
 * @category catalog
 * @standard
 */
export class AnimationAction {
  /** How it blends: `NormalAnimationBlendMode` */
  public blendMode: number;
  /** `LoopRepeat`, `LoopOnce` or `LoopPingPong` @default LoopRepeat */
  public loop: number = LoopRepeat;
  /** The clip's local time, in seconds */
  public time: number = 0;
  /** How fast it plays: 1 for normal speed, negative for backwards, 0 to freeze */
  public timeScale: number = 1;
  /** How much it counts in a blend, 0 to 1 */
  public weight: number = 1;
  /** How many times it plays under `LoopRepeat` and `LoopPingPong` @default Infinity */
  public repetitions: number = Infinity;
  /** Whether its time stands still */
  public paused: boolean = false;
  /** Whether it plays at all; `false` leaves it out of the blend */
  public enabled: boolean = true;
  /** Whether it holds its last frame once finished instead of dropping out of the blend */
  public clampWhenFinished: boolean = false;
  /** three's smooth-interpolation setting; kept, as pixi-3d's tracks don't read it */
  public zeroSlopeAtStart: boolean = true;
  /** three's smooth-interpolation setting; kept, as pixi-3d's tracks don't read it */
  public zeroSlopeAtEnd: boolean = true;

  /**
   * The property mixers this action's tracks write to, one per track
   * @internal
   */
  public _propertyBindings: PropertyMixer[] = [];

  private readonly _mixer: AnimationMixer;
  private readonly _clip: AnimationClip;
  private readonly _localRoot: Container3D | null;
  private readonly _trackIndices: Int32Array;
  private _loopCount = -1;
  private _startTime: number | null = null;
  private _effectiveTimeScale = 1;
  private _effectiveWeight = 1;
  private _weightRamp: Ramp | null = null;
  private _timeScaleRamp: Ramp | null = null;

  /**
   * Made by `mixer.clipAction`, which reuses one action per clip and root
   * @param mixer - The mixer that plays it
   * @param clip - The clip it plays
   * @param localRoot - The root its tracks' names are looked up under; the mixer's when `null`
   * @param blendMode - How it blends
   */
  constructor(
    mixer: AnimationMixer,
    clip: AnimationClip,
    localRoot: Container3D | null = null,
    blendMode: number = clip.blendMode ?? NormalAnimationBlendMode,
  ) {
    this._mixer = mixer;
    this._clip = clip;
    this._localRoot = localRoot;
    this.blendMode = blendMode;
    this._trackIndices = new Int32Array(clip.tracks.length);
  }

  /**
   * Schedules the action to play from the mixer's next update
   * @returns This action
   */
  public play(): this {
    this._mixer._activateAction(this);
    return this;
  }

  /**
   * Stops the action and resets it
   * @returns This action
   */
  public stop(): this {
    this._mixer._deactivateAction(this);
    return this.reset();
  }

  /**
   * Back to the start: unpaused, enabled, time 0, no fade or warp
   * @returns This action
   */
  public reset(): this {
    this.paused = false;
    this.enabled = true;
    this.time = 0;
    this._loopCount = -1;
    this._startTime = null;

    return this.stopFading().stopWarping();
  }

  /** Whether it is playing now: scheduled, enabled, not paused, moving and started */
  public isRunning(): boolean {
    return (
      this.enabled &&
      !this.paused &&
      this.timeScale !== 0 &&
      this._startTime === null &&
      this._mixer._isActiveAction(this)
    );
  }

  /** Whether `play` scheduled it */
  public isScheduled(): boolean {
    return this._mixer._isActiveAction(this);
  }

  /**
   * Starts it once the mixer's time reaches a time
   * @param time - The mixer time, in seconds
   * @returns This action
   */
  public startAt(time: number): this {
    this._startTime = time;
    return this;
  }

  /**
   * Sets how it loops
   * @param mode - `LoopOnce`, `LoopRepeat` or `LoopPingPong`
   * @param repetitions - How many times it plays
   * @returns This action
   */
  public setLoop(mode: number, repetitions: number): this {
    this.loop = mode;
    this.repetitions = repetitions;
    return this;
  }

  /**
   * Sets `weight` and stops any fade
   * @param weight - 0 to 1
   * @returns This action
   */
  public setEffectiveWeight(weight: number): this {
    this.weight = weight;
    this._effectiveWeight = this.enabled ? weight : 0;
    return this.stopFading();
  }

  /** The weight it counts with now, after its fade */
  public getEffectiveWeight(): number {
    return this._effectiveWeight;
  }

  /**
   * Fades its weight from 0 to 1
   * @param duration - Seconds of mixer time
   * @returns This action
   */
  public fadeIn(duration: number): this {
    return this._scheduleFading(duration, 0, 1);
  }

  /**
   * Fades its weight from 1 to 0, then disables it
   * @param duration - Seconds of mixer time
   * @returns This action
   */
  public fadeOut(duration: number): this {
    return this._scheduleFading(duration, 1, 0);
  }

  /**
   * Fades another action out while this one fades in
   * @param fadeOutAction - The action to fade out
   * @param duration - Seconds of mixer time
   * @param warp - Also eases each one's speed toward the other's clip length
   * @returns This action
   */
  public crossFadeFrom(fadeOutAction: AnimationAction, duration: number, warp: boolean = false): this {
    fadeOutAction.fadeOut(duration);
    this.fadeIn(duration);

    if (warp) {
      const fadeInDuration = this._clip.duration;
      const fadeOutDuration = fadeOutAction._clip.duration;

      fadeOutAction.warp(1, fadeOutDuration / fadeInDuration, duration);
      this.warp(fadeInDuration / fadeOutDuration, 1, duration);
    }

    return this;
  }

  /**
   * Fades this action out while another fades in
   * @param fadeInAction - The action to fade in
   * @param duration - Seconds of mixer time
   * @param warp - Also eases each one's speed toward the other's clip length
   * @returns This action
   */
  public crossFadeTo(fadeInAction: AnimationAction, duration: number, warp: boolean = false): this {
    fadeInAction.crossFadeFrom(this, duration, warp);
    return this;
  }

  /**
   * Stops a fade where it is
   * @returns This action
   */
  public stopFading(): this {
    this._weightRamp = null;
    return this;
  }

  /**
   * Sets `timeScale` and stops any warp
   * @param timeScale - The speed
   * @returns This action
   */
  public setEffectiveTimeScale(timeScale: number): this {
    this.timeScale = timeScale;
    this._effectiveTimeScale = this.paused ? 0 : timeScale;
    return this.stopWarping();
  }

  /** The speed it plays at now, after its warp */
  public getEffectiveTimeScale(): number {
    return this._effectiveTimeScale;
  }

  /**
   * Sets `timeScale` so one pass of the clip takes a time
   * @param duration - Seconds
   * @returns This action
   */
  public setDuration(duration: number): this {
    this.timeScale = this._clip.duration / duration;
    return this.stopWarping();
  }

  /**
   * Takes another action's time and speed
   * @param action - The action to match
   * @returns This action
   */
  public syncWith(action: AnimationAction): this {
    this.time = action.time;
    this.timeScale = action.timeScale;
    return this.stopWarping();
  }

  /**
   * Slows it to a stop
   * @param duration - Seconds of mixer time
   * @returns This action
   */
  public halt(duration: number): this {
    return this.warp(this._effectiveTimeScale, 0, duration);
  }

  /**
   * Eases its speed from one time scale to another
   * @param startTimeScale - The speed at the start
   * @param endTimeScale - The speed at the end
   * @param duration - Seconds of mixer time
   * @returns This action
   */
  public warp(startTimeScale: number, endTimeScale: number, duration: number): this {
    const now = this._mixer.time;

    this._timeScaleRamp = {
      times: [now, now + duration],
      values: [startTimeScale / this.timeScale, endTimeScale / this.timeScale],
    };

    return this;
  }

  /**
   * Stops a warp where it is
   * @returns This action
   */
  public stopWarping(): this {
    this._timeScaleRamp = null;
    return this;
  }

  /** The mixer that plays it */
  public getMixer(): AnimationMixer {
    return this._mixer;
  }

  /** The clip it plays */
  public getClip(): AnimationClip {
    return this._clip;
  }

  /** The root its tracks' names are looked up under */
  public getRoot(): Container3D {
    return this._localRoot ?? this._mixer.getRoot();
  }

  /**
   * Advances the action and adds its tracks' samples to their properties' blends; the mixer calls it
   * @param time - The mixer's time
   * @param deltaTime - Seconds since the mixer's last update, after its time scale
   * @param timeDirection - The sign of `deltaTime`
   * @internal
   */
  public _update(time: number, deltaTime: number, timeDirection: number): void {
    if (!this.enabled) {
      this._updateWeight(time);

      return;
    }

    const startTime = this._startTime;

    if (startTime !== null) {
      const timeRunning = (time - startTime) * timeDirection;

      if (timeRunning < 0 || timeDirection === 0) {
        deltaTime = 0;
      } else {
        this._startTime = null;
        deltaTime = timeDirection * timeRunning;
      }
    }

    deltaTime *= this._updateTimeScale(time);

    const clipTime = this._updateTime(deltaTime);
    const weight = this._updateWeight(time);

    if (weight <= 0) return;

    const tracks = this._clip.tracks;
    const mixers = this._propertyBindings;
    const indices = this._trackIndices;

    for (let i = 0; i < tracks.length; i++) {
      const mixer = mixers[i];

      indices[i] = tracks[i].evaluate(clipTime, indices[i], mixer.incoming);
      mixer.accumulate(weight);
    }
  }

  private _updateWeight(time: number): number {
    let weight = 0;

    if (this.enabled) {
      weight = this.weight;

      const ramp = this._weightRamp;

      if (ramp) {
        const value = sampleRamp(ramp, time);

        weight *= value;
        if (time > ramp.times[1]) {
          this.stopFading();
          if (value === 0) this.enabled = false;
        }
      }
    }

    this._effectiveWeight = weight;

    return weight;
  }

  private _updateTimeScale(time: number): number {
    let timeScale = 0;

    if (!this.paused) {
      timeScale = this.timeScale;

      const ramp = this._timeScaleRamp;

      if (ramp) {
        timeScale *= sampleRamp(ramp, time);
        if (time > ramp.times[1]) {
          this.stopWarping();
          if (timeScale === 0) this.paused = true;
          else this.timeScale = timeScale;
        }
      }
    }

    this._effectiveTimeScale = timeScale;

    return timeScale;
  }

  private _updateTime(deltaTime: number): number {
    const duration = this._clip.duration;
    const loop = this.loop;
    const pingPong = loop === LoopPingPong;
    let time = this.time + deltaTime;
    let loopCount = this._loopCount;

    if (deltaTime === 0) {
      if (loopCount === -1) return time;

      return pingPong && (loopCount & 1) === 1 ? duration - time : time;
    }

    if (loop === LoopOnce) {
      if (loopCount === -1) this._loopCount = 0;

      if (time >= duration) time = duration;
      else if (time < 0) time = 0;
      else {
        this.time = time;

        return time;
      }

      if (this.clampWhenFinished) this.paused = true;
      else this.enabled = false;

      this.time = time;
      this._mixer.dispatchEvent({ type: 'finished', action: this, direction: deltaTime < 0 ? -1 : 1 });

      return time;
    }

    if (loopCount === -1 && deltaTime >= 0) loopCount = 0;

    if (time >= duration || time < 0) {
      const loopDelta = Math.floor(time / duration);

      time -= duration * loopDelta;
      loopCount += Math.abs(loopDelta);

      const pending = this.repetitions - loopCount;

      if (pending <= 0) {
        if (this.clampWhenFinished) this.paused = true;
        else this.enabled = false;

        time = deltaTime > 0 ? duration : 0;
        this.time = time;
        this._mixer.dispatchEvent({ type: 'finished', action: this, direction: deltaTime > 0 ? 1 : -1 });
      } else {
        this._loopCount = loopCount;
        this.time = time;
        this._mixer.dispatchEvent({ type: 'loop', action: this, loopDelta });
      }
    } else {
      this._loopCount = loopCount;
      this.time = time;
    }

    if (pingPong && (loopCount & 1) === 1) return duration - time;

    return time;
  }

  private _scheduleFading(duration: number, weightNow: number, weightThen: number): this {
    const now = this._mixer.time;

    this._weightRamp = { times: [now, now + duration], values: [weightNow, weightThen] };

    return this;
  }
}

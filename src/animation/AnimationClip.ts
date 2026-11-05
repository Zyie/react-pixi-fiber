import { NormalAnimationBlendMode } from '../catalog/constants';
import { MathUtils } from '../math/MathUtils';
import type { KeyframeTrack } from './KeyframeTrack';

/**
 * three's `AnimationClip`: a named set of keyframe tracks, played by an `AnimationMixer`
 *
 * `GLTFLoader` gives a file's animations as clips, with tracks named by node as three's loader names
 * them. A clip holds no playback state, so one clip plays on any number of mixers.
 * @example
 * ```ts
 * const clip = new AnimationClip('bob', -1, [new VectorKeyframeTrack('.position', [0, 1, 2], [0, 0, 0, 0, 1, 0, 0, 0, 0])]);
 * mixer.clipAction(clip).play();
 * ```
 * @category catalog
 * @standard
 */
export class AnimationClip {
  /** The clip's name, which `clipAction` and `findByName` look up */
  public name: string;
  /** The tracks it plays */
  public tracks: KeyframeTrack[];
  /** Its length in seconds; worked out from the tracks when made with a negative one */
  public duration: number;
  /** `NormalAnimationBlendMode`; `AdditiveAnimationBlendMode` plays as normal here */
  public blendMode: number;
  /** A unique id, as three's */
  public readonly uuid: string = MathUtils.generateUUID();
  /** Anything you want to keep with the clip */
  public userData: Record<string, unknown> = {};

  /**
   * @param name - The clip's name
   * @param duration - Its length in seconds; -1 to work it out from the tracks
   * @param tracks - The tracks it plays
   * @param blendMode - How it blends with other clips
   */
  constructor(
    name: string = '',
    duration: number = -1,
    tracks: KeyframeTrack[] = [],
    blendMode: number = NormalAnimationBlendMode,
  ) {
    this.name = name;
    this.tracks = tracks;
    this.duration = duration;
    this.blendMode = blendMode;

    if (this.duration < 0) this.resetDuration();
  }

  /**
   * The clip of a name, from a list of clips or an object's `animations`
   * @param objectOrClipArray - The clips, or something with `animations`
   * @param name - The name to find
   */
  public static findByName(
    objectOrClipArray: readonly AnimationClip[] | { animations: readonly AnimationClip[] },
    name: string,
  ): AnimationClip | null {
    const clips = Array.isArray(objectOrClipArray)
      ? (objectOrClipArray as readonly AnimationClip[])
      : (objectOrClipArray as { animations: readonly AnimationClip[] }).animations;

    return clips.find((clip) => clip.name === name) ?? null;
  }

  /**
   * Sets `duration` to the time of the last keyframe of any track
   * @returns This clip
   */
  public resetDuration(): this {
    let duration = 0;

    for (const track of this.tracks) duration = Math.max(duration, track.times[track.times.length - 1] ?? 0);
    this.duration = duration;

    return this;
  }

  /**
   * Drops the keyframes past the clip's duration
   * @returns This clip
   */
  public trim(): this {
    for (const track of this.tracks) track.trim(0, this.duration);

    return this;
  }

  /** Whether every track is valid */
  public validate(): boolean {
    return this.tracks.every((track) => track.validate());
  }

  /**
   * Removes keyframes that repeat the one before, in every track
   * @returns This clip
   */
  public optimize(): this {
    for (const track of this.tracks) track.optimize();

    return this;
  }

  /** A copy of the clip, with copies of its tracks */
  public clone(): AnimationClip {
    return new AnimationClip(
      this.name,
      this.duration,
      this.tracks.map((track) => track.clone()),
      this.blendMode,
    );
  }
}

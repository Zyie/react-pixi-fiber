import { VideoSource } from 'pixi.js';

import { LinearFilter } from '../constants';
import { Texture } from './Texture';

/**
 * three's `VideoTexture`: a texture showing a video, over a pixi `VideoSource`
 *
 * pixi uploads each new frame while the video plays, as three does. It starts with linear filtering
 * and no mipmaps, as in three, and doesn't start the video: call `play()` on it.
 * @example
 * ```ts
 * const video = document.createElement('video');
 * video.src = '/clip.mp4';
 * const texture = new VideoTexture(video);
 * void video.play();
 * ```
 * @category catalog
 * @advanced
 */
export class VideoTexture extends Texture {
  /** Always `true`, as on three's `VideoTexture` */
  public readonly isVideoTexture = true;

  /**
   * @param video - The video to show
   * @param mapping - How the image maps onto a surface
   * @param wrapS - How it wraps across
   * @param wrapT - How it wraps up and down
   * @param magFilter - How it is sampled when magnified
   * @param minFilter - How it is sampled when minified
   * @param format - The pixel format
   * @param type - The type of each channel
   * @param anisotropy - Samples taken along a slanted surface
   */
  constructor(
    video: HTMLVideoElement,
    mapping?: number,
    wrapS?: number,
    wrapT?: number,
    magFilter: number = LinearFilter,
    minFilter: number = LinearFilter,
    format?: number,
    type?: number,
    anisotropy?: number,
  ) {
    super(
      new VideoSource({ resource: video, autoPlay: false }),
      mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format,
      type,
      anisotropy,
    );
    this.generateMipmaps = false;
  }

  /** Uploads the video's current frame, as three's `update` */
  public update(): void {
    this.needsUpdate = true;
  }
}

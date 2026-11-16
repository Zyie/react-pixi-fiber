/**
 * three's `Clock`: elapsed seconds and the time between calls, from `performance.now()`
 *
 * three deprecated it in r183 for `Timer`; it is kept for code that still uses it. Inside a canvas,
 * `useFrame`'s `delta` and `state.elapsed` follow r3f's clock, which `advance` drives.
 * @example
 * ```ts
 * import { Clock } from '@react-fiber/threejs-compat/three';
 *
 * const clock = new Clock();
 * const delta = clock.getDelta();
 * ```
 * @category math
 * @advanced
 */
export class Clock {
  /** Start on the first `getDelta` */
  public autoStart: boolean;
  /** When `start` last ran, in milliseconds */
  public startTime: number = 0;
  /** When the clock was last read, in milliseconds */
  public oldTime: number = 0;
  /** Seconds the clock has run */
  public elapsedTime: number = 0;
  /** Whether the clock is running */
  public running: boolean = false;

  /** @param autoStart - Start on the first `getDelta` */
  constructor(autoStart = true) {
    this.autoStart = autoStart;
  }

  /** Starts the clock from zero */
  public start(): void {
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  /** Stops the clock */
  public stop(): void {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  /** Seconds since the clock started */
  public getElapsedTime(): number {
    this.getDelta();
    return this.elapsedTime;
  }

  /** Seconds since the last read */
  public getDelta(): number {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (!this.running) return 0;
    const newTime = performance.now();
    const diff = (newTime - this.oldTime) / 1000;
    this.oldTime = newTime;
    this.elapsedTime += diff;
    return diff;
  }
}

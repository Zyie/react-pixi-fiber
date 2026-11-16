const LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
let seed = 1234567;

/**
 * The functions of three's `MathUtils`
 * @category math
 * @advanced
 */
export interface MathUtilsApi {
  /** Multiply degrees by it for radians */
  readonly DEG2RAD: number;
  /** Multiply radians by it for degrees */
  readonly RAD2DEG: number;
  /** A random version 4 UUID, lower case */
  generateUUID(): string;
  /**
   * `value` limited to `min` to `max`
   * @param value - The value
   * @param min - The lowest result
   * @param max - The highest result
   */
  clamp(value: number, min: number, max: number): number;
  /**
   * `n` modulo `m`, never negative for a positive `m`
   * @param n - The dividend
   * @param m - The divisor
   */
  euclideanModulo(n: number, m: number): number;
  /**
   * Maps `x` from the range `a1` to `a2` onto `b1` to `b2`
   * @param x - The value
   * @param a1 - Start of the first range
   * @param a2 - End of the first range
   * @param b1 - Start of the second range
   * @param b2 - End of the second range
   */
  mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number;
  /**
   * Where `value` is between `x` and `y`, 0 at `x` and 1 at `y`
   * @param x - The start
   * @param y - The end
   * @param value - The value
   */
  inverseLerp(x: number, y: number, value: number): number;
  /**
   * The value `t` of the way from `x` to `y`
   * @param x - The start
   * @param y - The end
   * @param t - How far along, 0 to 1
   */
  lerp(x: number, y: number, t: number): number;
  /**
   * Moves `x` toward `y` at a rate independent of frame rate
   * @param x - The current value
   * @param y - The target
   * @param lambda - How fast; higher arrives sooner
   * @param dt - Seconds since the last step
   */
  damp(x: number, y: number, lambda: number, dt: number): number;
  /**
   * `x` bounced between 0 and `length`
   * @param x - The value
   * @param length - The bound
   */
  pingpong(x: number, length?: number): number;
  /**
   * 0 at `min` or below, 1 at `max` or above, eased in between
   * @param x - The value
   * @param min - Where the result starts to rise
   * @param max - Where it reaches 1
   */
  smoothstep(x: number, min: number, max: number): number;
  /**
   * {@link MathUtilsApi.smoothstep} with a smoother curve
   * @param x - The value
   * @param min - Where the result starts to rise
   * @param max - Where it reaches 1
   */
  smootherstep(x: number, min: number, max: number): number;
  /**
   * A random integer from `low` to `high`, both included
   * @param low - The lowest result
   * @param high - The highest result
   */
  randInt(low: number, high: number): number;
  /**
   * A random number from `low` to `high`
   * @param low - The lowest result
   * @param high - The highest result
   */
  randFloat(low: number, high: number): number;
  /**
   * A random number from `-range / 2` to `range / 2`
   * @param range - The width of the interval
   */
  randFloatSpread(range: number): number;
  /**
   * A repeatable random number from 0 to 1
   * @param s - A new seed
   */
  seededRandom(s?: number): number;
  /**
   * Degrees in radians
   * @param degrees - The angle
   */
  degToRad(degrees: number): number;
  /**
   * Radians in degrees
   * @param radians - The angle
   */
  radToDeg(radians: number): number;
  /**
   * Whether `value` is a power of two
   * @param value - The value
   */
  isPowerOfTwo(value: number): boolean;
  /**
   * The smallest power of two at least `value`
   * @param value - The value
   */
  ceilPowerOfTwo(value: number): number;
  /**
   * The largest power of two at most `value`
   * @param value - The value
   */
  floorPowerOfTwo(value: number): number;
}

const lerp = (x: number, y: number, t: number): number => (1 - t) * x + t * y;
const euclideanModulo = (n: number, m: number): number => ((n % m) + m) % m;

/**
 * three's `MathUtils`: scalar helpers for angles, interpolation and random numbers
 * @example
 * ```ts
 * import { MathUtils } from '@react-fiber/threejs-compat/three';
 *
 * mesh.rotation.y = MathUtils.degToRad(45);
 * mesh.position.x = MathUtils.damp(mesh.position.x, target, 4, delta);
 * ```
 * @category math
 * @standard
 */
export const MathUtils: MathUtilsApi = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,
  generateUUID() {
    const d0 = (Math.random() * 0xffffffff) | 0;
    const d1 = (Math.random() * 0xffffffff) | 0;
    const d2 = (Math.random() * 0xffffffff) | 0;
    const d3 = (Math.random() * 0xffffffff) | 0;
    return (
      `${LUT[d0 & 0xff]}${LUT[(d0 >> 8) & 0xff]}${LUT[(d0 >> 16) & 0xff]}${LUT[(d0 >> 24) & 0xff]}-` +
      `${LUT[d1 & 0xff]}${LUT[(d1 >> 8) & 0xff]}-${LUT[((d1 >> 16) & 0x0f) | 0x40]}${LUT[(d1 >> 24) & 0xff]}-` +
      `${LUT[(d2 & 0x3f) | 0x80]}${LUT[(d2 >> 8) & 0xff]}-${LUT[(d2 >> 16) & 0xff]}${LUT[(d2 >> 24) & 0xff]}` +
      `${LUT[d3 & 0xff]}${LUT[(d3 >> 8) & 0xff]}${LUT[(d3 >> 16) & 0xff]}${LUT[(d3 >> 24) & 0xff]}`
    );
  },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  euclideanModulo,
  mapLinear: (x, a1, a2, b1, b2) => b1 + ((x - a1) * (b2 - b1)) / (a2 - a1),
  inverseLerp: (x, y, value) => (x !== y ? (value - x) / (y - x) : 0),
  lerp,
  damp: (x, y, lambda, dt) => lerp(x, y, 1 - Math.exp(-lambda * dt)),
  pingpong: (x, length = 1) => length - Math.abs(euclideanModulo(x, length * 2) - length),
  smoothstep(x, min, max) {
    if (x <= min) return 0;
    if (x >= max) return 1;
    const t = (x - min) / (max - min);
    return t * t * (3 - 2 * t);
  },
  smootherstep(x, min, max) {
    if (x <= min) return 0;
    if (x >= max) return 1;
    const t = (x - min) / (max - min);
    return t * t * t * (t * (t * 6 - 15) + 10);
  },
  randInt: (low, high) => low + Math.floor(Math.random() * (high - low + 1)),
  randFloat: (low, high) => low + Math.random() * (high - low),
  randFloatSpread: (range) => range * (0.5 - Math.random()),
  seededRandom(s) {
    if (s !== undefined) seed = s;
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  },
  degToRad: (degrees) => degrees * (Math.PI / 180),
  radToDeg: (radians) => radians * (180 / Math.PI),
  isPowerOfTwo: (value) => value > 0 && Number.isInteger(value) && 2 ** Math.round(Math.log2(value)) === value,
  ceilPowerOfTwo: (value) => Math.pow(2, Math.ceil(Math.log(value) / Math.LN2)),
  floorPowerOfTwo: (value) => Math.pow(2, Math.floor(Math.log(value) / Math.LN2)),
};

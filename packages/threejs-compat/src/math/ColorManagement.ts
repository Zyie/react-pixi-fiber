import { LinearSRGBColorSpace, SRGBColorSpace } from '../catalog/constants';

/**
 * A colour space three's colour management converts between: `'srgb'`, `'srgb-linear'`, or `''` for
 * none, which is never converted
 * @category math
 * @advanced
 */
export type ColorSpace = typeof SRGBColorSpace | typeof LinearSRGBColorSpace | '' | (string & {});

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Decodes an sRGB channel to linear light, as three's `SRGBToLinear`
 * @param c - The sRGB channel, 0 to 1
 * @returns The linear channel
 * @category math
 * @advanced
 */
export function SRGBToLinear(c: number): number {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}

/**
 * Encodes a linear channel to sRGB, as three's `LinearToSRGB`
 * @param c - The linear channel
 * @returns The sRGB channel, 0 to 1 for a channel 0 to 1
 * @category math
 * @advanced
 */
export function LinearToSRGB(c: number): number {
  return c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
}

/**
 * three's colour management: which space colours are worked in, and conversion to and from it
 *
 * As in three, colours are kept in linear sRGB, and a CSS colour, a hex number or `setHex` is read as
 * sRGB and decoded. Only sRGB and linear sRGB are known; three's Display P3 isn't.
 * @category math
 * @advanced
 */
export interface ColorManagementApi {
  /** Whether colours are converted at all; with it off, every value is taken as written @default true */
  enabled: boolean;
  /** The space colours are kept in @default 'srgb-linear' */
  workingColorSpace: ColorSpace;
  /**
   * Converts a colour's channels from one space to another, in place
   * @param color - The colour
   * @param sourceColorSpace - The space its channels are in
   * @param targetColorSpace - The space to convert them to
   */
  convert<T extends RGB>(color: T, sourceColorSpace: ColorSpace, targetColorSpace: ColorSpace): T;
  /**
   * Converts a colour from the working space to another, in place
   * @param color - The colour
   * @param targetColorSpace - The space to convert to
   */
  workingToColorSpace<T extends RGB>(color: T, targetColorSpace: ColorSpace): T;
  /**
   * Converts a colour from another space to the working space, in place
   * @param color - The colour
   * @param sourceColorSpace - The space it is in
   */
  colorSpaceToWorking<T extends RGB>(color: T, sourceColorSpace: ColorSpace): T;
  /**
   * three's older name for {@link ColorManagementApi.workingToColorSpace}
   * @param color - The colour
   * @param targetColorSpace - The space to convert to
   */
  fromWorkingColorSpace<T extends RGB>(color: T, targetColorSpace: ColorSpace): T;
  /**
   * three's older name for {@link ColorManagementApi.colorSpaceToWorking}
   * @param color - The colour
   * @param sourceColorSpace - The space it is in
   */
  toWorkingColorSpace<T extends RGB>(color: T, sourceColorSpace: ColorSpace): T;
}

const isSRGB = (space: ColorSpace): boolean => space === SRGBColorSpace;

/**
 * three's `ColorManagement`, for sRGB and linear sRGB
 * @example
 * ```ts
 * import { Color, ColorManagement } from 'react-pixi-fiber/three';
 *
 * ColorManagement.enabled = false;
 * new Color('#808080').r; // 0.5, as written
 * ```
 * @category math
 * @advanced
 */
export const ColorManagement: ColorManagementApi = {
  enabled: true,
  workingColorSpace: LinearSRGBColorSpace,
  convert(color, sourceColorSpace, targetColorSpace) {
    if (!this.enabled || sourceColorSpace === targetColorSpace || !sourceColorSpace || !targetColorSpace) return color;
    if (isSRGB(sourceColorSpace)) {
      color.r = SRGBToLinear(color.r);
      color.g = SRGBToLinear(color.g);
      color.b = SRGBToLinear(color.b);
    }
    if (isSRGB(targetColorSpace)) {
      color.r = LinearToSRGB(color.r);
      color.g = LinearToSRGB(color.g);
      color.b = LinearToSRGB(color.b);
    }
    return color;
  },
  workingToColorSpace(color, targetColorSpace) {
    return this.convert(color, this.workingColorSpace, targetColorSpace);
  },
  colorSpaceToWorking(color, sourceColorSpace) {
    return this.convert(color, sourceColorSpace, this.workingColorSpace);
  },
  fromWorkingColorSpace(color, targetColorSpace) {
    return this.workingToColorSpace(color, targetColorSpace);
  },
  toWorkingColorSpace(color, sourceColorSpace) {
    return this.colorSpaceToWorking(color, sourceColorSpace);
  },
};

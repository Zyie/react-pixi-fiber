import { linearToSrgb } from '@pixi/3d';

import { SRGBColorSpace } from '../catalog/constants';
import type { ColorSpace } from './ColorManagement';
import { ColorManagement, LinearToSRGB, SRGBToLinear } from './ColorManagement';

/**
 * What three takes for a colour: a {@link Color}, a CSS colour string (`'hotpink'`, `'#ff69b4'`,
 * `'rgb(255,105,180)'`, `'hsl(330,100%,71%)'`) or an sRGB hex number (`0xff69b4`)
 * @category math
 * @standard
 */
export type ColorRepresentation = Color | string | number;

/**
 * Hue, saturation and lightness, each 0 to 1, as `getHSL` writes them
 * @category math
 * @advanced
 */
export interface HSL {
  /** Hue, 0 to 1 */
  h: number;
  /** Saturation, 0 to 1 */
  s: number;
  /** Lightness, 0 to 1 */
  l: number;
}

/**
 * Red, green and blue channels, as `getRGB` writes them
 * @category math
 * @advanced
 */
export interface RGB {
  /** Red */
  r: number;
  /** Green */
  g: number;
  /** Blue */
  b: number;
}

const COLOR_NAMES: Readonly<Record<string, number>> = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32,
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const euclideanModulo = (n: number, m: number): number => ((n % m) + m) % m;
const lerp = (x: number, y: number, t: number): number => (1 - t) * x + t * y;
const hue2rgb = (p: number, q: number, t: number): number => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
  return p;
};

const scratch: RGB = { r: 0, g: 0, b: 0 };
const hslA: HSL = { h: 0, s: 0, l: 0 };
const hslB: HSL = { h: 0, s: 0, l: 0 };
const pixiChannels: [number, number, number] = [1, 1, 1];
const displayChannels: [number, number, number] = [1, 1, 1];

/**
 * three's `Color`: red, green and blue in the working colour space, linear sRGB, as three keeps them
 *
 * A CSS colour, a hex number and `setHex` are read as sRGB and decoded, `r`, `g`, `b` and `setRGB` are
 * linear, and `getHex` and `getStyle` encode back to sRGB, all as in three. A material's `color` and
 * `emissive` and a scene's `background` take one, so `material.color.set('hotpink')`,
 * `color="hotpink"` and `color-r={1}` all work.
 * @example
 * ```ts
 * import { Color } from '@react-fiber/threejs-compat/three';
 *
 * const from = new Color('royalblue');
 * material.color.lerp(from, 0.1);
 * material.color.getHexString(); // sRGB, as in three
 * ```
 * @category math
 * @standard
 */
export class Color {
  /** Every CSS colour name, with its sRGB hex value */
  public static readonly NAMES: Readonly<Record<string, number>> = COLOR_NAMES;
  /** Always `true`; three and r3f duck-type colours by it */
  public readonly isColor = true;
  private _r = 1;
  private _g = 1;
  private _b = 1;

  /**
   * @param r - A colour in any form `set` takes, or red when `g` and `b` follow
   * @param g - Green, linear
   * @param b - Blue, linear
   */
  constructor(r?: ColorRepresentation | null, g?: number, b?: number) {
    this.set(r, g, b);
  }

  /** Red, in the working colour space */
  public get r(): number {
    return this._r;
  }

  public set r(value: number) {
    this._r = value;
    this._onChangeCallback();
  }

  /** Green, in the working colour space */
  public get g(): number {
    return this._g;
  }

  public set g(value: number) {
    this._g = value;
    this._onChangeCallback();
  }

  /** Blue, in the working colour space */
  public get b(): number {
    return this._b;
  }

  public set b(value: number) {
    this._b = value;
    this._onChangeCallback();
  }

  /**
   * Sets the colour from any colour, or from three linear channels
   * @param r - A {@link ColorRepresentation}, or red when `g` and `b` follow
   * @param g - Green, linear
   * @param b - Blue, linear
   * @returns This colour
   */
  public set(r?: ColorRepresentation | null, g?: number, b?: number): this {
    if (g === undefined && b === undefined) {
      if (r instanceof Color || (typeof r === 'object' && r !== null && (r as Color).isColor)) this.copy(r as RGB);
      else if (typeof r === 'number') this.setHex(r);
      else if (typeof r === 'string') this.setStyle(r);
      return this;
    }
    return this.setRGB(r as number, g ?? 0, b ?? 0);
  }

  /**
   * Sets every channel to one value
   * @param scalar - The value
   * @returns This colour
   */
  public setScalar(scalar: number): this {
    return this._write(scalar, scalar, scalar);
  }

  /**
   * Sets the colour from a hex number
   * @param hex - The colour, such as `0xff69b4`
   * @param colorSpace - The space `hex` is in @default 'srgb'
   * @returns This colour
   */
  public setHex(hex: number, colorSpace: ColorSpace = SRGBColorSpace): this {
    const value = Math.floor(hex);
    scratch.r = ((value >> 16) & 255) / 255;
    scratch.g = ((value >> 8) & 255) / 255;
    scratch.b = (value & 255) / 255;
    ColorManagement.colorSpaceToWorking(scratch, colorSpace);
    return this._write(scratch.r, scratch.g, scratch.b);
  }

  /**
   * Sets the three channels
   * @param r - Red
   * @param g - Green
   * @param b - Blue
   * @param colorSpace - The space the channels are in @default the working space, linear sRGB
   * @returns This colour
   */
  public setRGB(r: number, g: number, b: number, colorSpace: ColorSpace = ColorManagement.workingColorSpace): this {
    scratch.r = r;
    scratch.g = g;
    scratch.b = b;
    ColorManagement.colorSpaceToWorking(scratch, colorSpace);
    return this._write(scratch.r, scratch.g, scratch.b);
  }

  /**
   * Sets the colour from hue, saturation and lightness
   * @param h - Hue, 0 to 1
   * @param s - Saturation, 0 to 1
   * @param l - Lightness, 0 to 1
   * @param colorSpace - The space the result is in @default the working space, linear sRGB
   * @returns This colour
   */
  public setHSL(h: number, s: number, l: number, colorSpace: ColorSpace = ColorManagement.workingColorSpace): this {
    const hue = euclideanModulo(h, 1);
    const saturation = clamp(s, 0, 1);
    const lightness = clamp(l, 0, 1);

    if (saturation === 0) {
      scratch.r = scratch.g = scratch.b = lightness;
    } else {
      const p = lightness <= 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
      const q = 2 * lightness - p;
      scratch.r = hue2rgb(q, p, hue + 1 / 3);
      scratch.g = hue2rgb(q, p, hue);
      scratch.b = hue2rgb(q, p, hue - 1 / 3);
    }
    ColorManagement.colorSpaceToWorking(scratch, colorSpace);
    return this._write(scratch.r, scratch.g, scratch.b);
  }

  /**
   * Sets the colour from a CSS string: `rgb()`, `rgba()`, `hsl()`, `hsla()`, `#rgb`, `#rrggbb` or a name;
   * an alpha is ignored, as in three
   * @param style - The CSS colour
   * @param colorSpace - The space it is in @default 'srgb'
   * @returns This colour
   */
  public setStyle(style: string, colorSpace: ColorSpace = SRGBColorSpace): this {
    const functional = /^(\w+)\(([^)]*)\)/.exec(style);

    if (functional) {
      const [, name, components] = functional;
      let match: RegExpExecArray | null;

      if (name === 'rgb' || name === 'rgba') {
        if ((match = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(components))) {
          return this.setRGB(
            Math.min(255, parseInt(match[1], 10)) / 255,
            Math.min(255, parseInt(match[2], 10)) / 255,
            Math.min(255, parseInt(match[3], 10)) / 255,
            colorSpace,
          );
        }
        if (
          (match =
            /^\s*(\d+(?:\.\d+)?|\.\d+)%\s*,\s*(\d+(?:\.\d+)?|\.\d+)%\s*,\s*(\d+(?:\.\d+)?|\.\d+)%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(
              components,
            ))
        ) {
          return this.setRGB(
            Math.min(100, parseFloat(match[1])) / 100,
            Math.min(100, parseFloat(match[2])) / 100,
            Math.min(100, parseFloat(match[3])) / 100,
            colorSpace,
          );
        }
      } else if (name === 'hsl' || name === 'hsla') {
        if (
          (match =
            /^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)%\s*,\s*(\d+(?:\.\d+)?|\.\d+)%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(
              components,
            ))
        ) {
          return this.setHSL(
            parseFloat(match[1]) / 360,
            parseFloat(match[2]) / 100,
            parseFloat(match[3]) / 100,
            colorSpace,
          );
        }
      }
      return this;
    }

    const hex = /^#([A-Fa-f\d]+)$/.exec(style)?.[1];

    if (hex?.length === 3) {
      return this.setRGB(
        parseInt(hex.charAt(0), 16) / 15,
        parseInt(hex.charAt(1), 16) / 15,
        parseInt(hex.charAt(2), 16) / 15,
        colorSpace,
      );
    }
    if (hex?.length === 6) return this.setHex(parseInt(hex, 16), colorSpace);
    if (hex === undefined && style.length > 0) return this.setColorName(style, colorSpace);
    return this;
  }

  /**
   * Sets the colour from a CSS colour name; an unknown name leaves it unchanged
   * @param style - The name, such as `'hotpink'`
   * @param colorSpace - The space it is in @default 'srgb'
   * @returns This colour
   */
  public setColorName(style: string, colorSpace: ColorSpace = SRGBColorSpace): this {
    const hex = COLOR_NAMES[style.toLowerCase()];
    return hex === undefined ? this : this.setHex(hex, colorSpace);
  }

  /** A new colour with the same channels */
  public clone(): Color {
    return new Color(this._r, this._g, this._b);
  }

  /**
   * Copies another colour's channels
   * @param color - The colour
   * @returns This colour
   */
  public copy(color: RGB): this {
    return this._write(color.r, color.g, color.b);
  }

  /**
   * Copies another colour, decoding it from sRGB to linear
   * @param color - The sRGB colour
   * @returns This colour
   */
  public copySRGBToLinear(color: RGB): this {
    return this._write(SRGBToLinear(color.r), SRGBToLinear(color.g), SRGBToLinear(color.b));
  }

  /**
   * Copies another colour, encoding it from linear to sRGB
   * @param color - The linear colour
   * @returns This colour
   */
  public copyLinearToSRGB(color: RGB): this {
    return this._write(LinearToSRGB(color.r), LinearToSRGB(color.g), LinearToSRGB(color.b));
  }

  /** Decodes this colour from sRGB to linear, in place */
  public convertSRGBToLinear(): this {
    return this.copySRGBToLinear(this);
  }

  /** Encodes this colour from linear to sRGB, in place */
  public convertLinearToSRGB(): this {
    return this.copyLinearToSRGB(this);
  }

  /**
   * The colour as a hex number
   * @param colorSpace - The space to encode to @default 'srgb'
   */
  public getHex(colorSpace: ColorSpace = SRGBColorSpace): number {
    this.getRGB(scratch, colorSpace);
    return (
      Math.round(clamp(scratch.r * 255, 0, 255)) * 65536 +
      Math.round(clamp(scratch.g * 255, 0, 255)) * 256 +
      Math.round(clamp(scratch.b * 255, 0, 255))
    );
  }

  /**
   * The colour as six hex digits, without `#`
   * @param colorSpace - The space to encode to @default 'srgb'
   */
  public getHexString(colorSpace: ColorSpace = SRGBColorSpace): string {
    return `000000${this.getHex(colorSpace).toString(16)}`.slice(-6);
  }

  /**
   * Writes the colour's hue, saturation and lightness into `target`
   * @param target - Receives `h`, `s` and `l`, 0 to 1
   * @param colorSpace - The space to measure in @default the working space, linear sRGB
   * @returns `target`
   */
  public getHSL<T extends HSL>(target: T, colorSpace: ColorSpace = ColorManagement.workingColorSpace): T {
    this.getRGB(scratch, colorSpace);
    const { r, g, b } = scratch;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (min + max) / 2;
    let hue = 0;
    let saturation = 0;

    if (min !== max) {
      const delta = max - min;
      saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
      if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue /= 6;
    }
    target.h = hue;
    target.s = saturation;
    target.l = lightness;
    return target;
  }

  /**
   * Writes the colour's channels, converted to a colour space, into `target`
   * @param target - Receives `r`, `g` and `b`
   * @param colorSpace - The space to convert to @default the working space, linear sRGB
   * @returns `target`
   */
  public getRGB<T extends RGB>(target: T, colorSpace: ColorSpace = ColorManagement.workingColorSpace): T {
    target.r = this._r;
    target.g = this._g;
    target.b = this._b;
    return ColorManagement.workingToColorSpace(target, colorSpace);
  }

  /**
   * The colour as a CSS string: `rgb(r,g,b)` in sRGB, as three's
   * @param colorSpace - The space to encode to @default 'srgb'
   */
  public getStyle(colorSpace: ColorSpace = SRGBColorSpace): string {
    this.getRGB(scratch, colorSpace);
    const { r, g, b } = scratch;
    if (colorSpace !== SRGBColorSpace) return `color(${colorSpace} ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  }

  /**
   * Shifts the colour's hue, saturation and lightness
   * @param h - Added to the hue
   * @param s - Added to the saturation
   * @param l - Added to the lightness
   * @returns This colour
   */
  public offsetHSL(h: number, s: number, l: number): this {
    this.getHSL(hslA);
    return this.setHSL(hslA.h + h, hslA.s + s, hslA.l + l);
  }

  /**
   * Adds another colour's channels
   * @param color - The colour
   * @returns This colour
   */
  public add(color: RGB): this {
    return this._write(this._r + color.r, this._g + color.g, this._b + color.b);
  }

  /**
   * Sets this colour to the sum of two
   * @param color1 - The first colour
   * @param color2 - The second colour
   * @returns This colour
   */
  public addColors(color1: RGB, color2: RGB): this {
    return this._write(color1.r + color2.r, color1.g + color2.g, color1.b + color2.b);
  }

  /**
   * Adds a number to every channel
   * @param s - The number
   * @returns This colour
   */
  public addScalar(s: number): this {
    return this._write(this._r + s, this._g + s, this._b + s);
  }

  /**
   * Subtracts another colour's channels, stopping at 0
   * @param color - The colour
   * @returns This colour
   */
  public sub(color: RGB): this {
    return this._write(Math.max(0, this._r - color.r), Math.max(0, this._g - color.g), Math.max(0, this._b - color.b));
  }

  /**
   * Multiplies by another colour, channel by channel
   * @param color - The colour
   * @returns This colour
   */
  public multiply(color: RGB): this {
    return this._write(this._r * color.r, this._g * color.g, this._b * color.b);
  }

  /**
   * Multiplies every channel by a number
   * @param s - The number
   * @returns This colour
   */
  public multiplyScalar(s: number): this {
    return this._write(this._r * s, this._g * s, this._b * s);
  }

  /**
   * Moves this colour toward another by `alpha`, in the working space
   * @param color - The colour to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This colour
   */
  public lerp(color: RGB, alpha: number): this {
    return this._write(
      this._r + (color.r - this._r) * alpha,
      this._g + (color.g - this._g) * alpha,
      this._b + (color.b - this._b) * alpha,
    );
  }

  /**
   * Sets this colour between two others
   * @param color1 - The colour at 0
   * @param color2 - The colour at 1
   * @param alpha - How far along
   * @returns This colour
   */
  public lerpColors(color1: RGB, color2: RGB, alpha: number): this {
    return this._write(
      color1.r + (color2.r - color1.r) * alpha,
      color1.g + (color2.g - color1.g) * alpha,
      color1.b + (color2.b - color1.b) * alpha,
    );
  }

  /**
   * Moves this colour toward another by `alpha`, in hue, saturation and lightness
   * @param color - The colour to move toward
   * @param alpha - How far: 0 stays, 1 arrives
   * @returns This colour
   */
  public lerpHSL(color: Color, alpha: number): this {
    this.getHSL(hslA);
    color.getHSL(hslB);
    return this.setHSL(lerp(hslA.h, hslB.h, alpha), lerp(hslA.s, hslB.s, alpha), lerp(hslA.l, hslB.l, alpha));
  }

  /**
   * Sets the channels from a vector's x, y and z
   * @param v - The vector
   * @returns This colour
   */
  public setFromVector3(v: { x: number; y: number; z: number }): this {
    return this._write(v.x, v.y, v.z);
  }

  /**
   * Multiplies the channels by a 3 by 3 matrix
   * @param m - The matrix
   * @returns This colour
   */
  public applyMatrix3(m: { elements: ArrayLike<number> }): this {
    const { _r: r, _g: g, _b: b } = this;
    const e = m.elements;
    return this._write(e[0] * r + e[3] * g + e[6] * b, e[1] * r + e[4] * g + e[7] * b, e[2] * r + e[5] * g + e[8] * b);
  }

  /**
   * Whether another colour has the same channels
   * @param c - The colour
   */
  public equals(c: RGB): boolean {
    return c.r === this._r && c.g === this._g && c.b === this._b;
  }

  /**
   * Sets the channels from an array, linear
   * @param array - `[r, g, b]`
   * @param offset - Where in the array to start
   * @returns This colour
   */
  public fromArray(array: ArrayLike<number>, offset = 0): this {
    return this._write(array[offset], array[offset + 1], array[offset + 2]);
  }

  /**
   * Writes `[r, g, b]` into an array, linear
   * @param array - The array to write into
   * @param offset - Where in the array to start
   * @returns `array`
   */
  public toArray<T extends number[] | Float32Array = number[]>(array: T = [] as unknown as T, offset = 0): T {
    array[offset] = this._r;
    array[offset + 1] = this._g;
    array[offset + 2] = this._b;
    return array;
  }

  /**
   * Sets the channels from one vertex of a buffer attribute
   * @param attribute - The attribute
   * @param index - The vertex
   * @returns This colour
   */
  public fromBufferAttribute(
    attribute: { getX(index: number): number; getY(index: number): number; getZ(index: number): number },
    index: number,
  ): this {
    return this._write(attribute.getX(index), attribute.getY(index), attribute.getZ(index));
  }

  /** The sRGB hex number, as three's `toJSON` */
  public toJSON(): number {
    return this.getHex();
  }

  /**
   * Sets the function called after each change, as three's `Euler._onChange`; a material uses it to
   * pass its colour on to pixi-3d
   * @param callback - Called with no arguments
   * @returns This colour
   */
  public _onChange(callback: () => void): this {
    this._onChangeCallback = callback;
    return this;
  }

  /** Called after each change; replaced through `_onChange` */
  public _onChangeCallback(): void {}

  /**
   * The channels in order: r, g, b
   * @yields Each in turn
   */
  public *[Symbol.iterator](): Generator<number, void> {
    yield this._r;
    yield this._g;
    yield this._b;
  }

  private _write(r: number, g: number, b: number): this {
    this._r = r;
    this._g = g;
    this._b = b;
    this._onChangeCallback();
    return this;
  }
}

/**
 * A linear channel as the display channel pixi-3d decodes back to it with `srgbToLinear`, clamped to 0 to 1
 * @param channel - The linear channel
 * @internal
 */
export const toPixiChannel = (channel: number): number => linearToSrgb(clamp(channel, 0, 1));

/**
 * A colour's channels as the display `ColorSource` array pixi-3d decodes back to the same linear values,
 * so the shader gets what three's would. The array is reused by the next call.
 * @param color - The colour; its channels are what the shader gets, linear, whether colour management is on or off
 * @returns `[r, g, b]` in display space, clamped to 0 to 1
 * @internal
 */
export function toPixiColor(color: Color): [number, number, number] {
  pixiChannels[0] = toPixiChannel(color.r);
  pixiChannels[1] = toPixiChannel(color.g);
  pixiChannels[2] = toPixiChannel(color.b);
  return pixiChannels;
}

/**
 * A colour's channels encoded to sRGB as three outputs them, for what pixi.js draws without decoding:
 * a clear colour, a 2D tint. The array is reused by the next call.
 * @param color - The colour, linear
 * @returns `[r, g, b]` in sRGB, clamped to 0 to 1
 * @internal
 */
export function toDisplayColor(color: Color): [number, number, number] {
  displayChannels[0] = clamp(LinearToSRGB(color.r), 0, 1);
  displayChannels[1] = clamp(LinearToSRGB(color.g), 0, 1);
  displayChannels[2] = clamp(LinearToSRGB(color.b), 0, 1);
  return displayChannels;
}

/*!
 * Adapted from three.js's examples/jsm/loaders/HDRLoader.js (r187), after Bruce Walter's rgbe.c
 * MIT License, Copyright (c) 2010-2025 three.js authors
 */

/**
 * A decoded Radiance image: linear RGBA as half floats, rows from the top of the image down
 * @internal
 */
export interface RGBEImage {
  width: number;
  height: number;
  /** Four half floats per pixel, alpha 1 */
  data: Uint16Array;
  /** The header's `GAMMA`, 1 when absent */
  gamma: number;
  /** The header's `EXPOSURE`, 1 when absent */
  exposure: number;
}

const floatView = new Float32Array(1);
const intView = new Uint32Array(floatView.buffer);

/**
 * The half float nearest a number, as three's `DataUtils.toHalfFloat` gives it for the range an HDR uses
 * @param value - A number from 0 to 65504
 * @internal
 */
export function toHalfFloat(value: number): number {
  floatView[0] = Math.min(value, 65504);
  const bits = intView[0];
  const sign = (bits >>> 16) & 0x8000;
  const exponent = (bits >>> 23) & 0xff;
  const mantissa = bits & 0x7fffff;
  if (exponent < 103) return sign;
  if (exponent < 113) return sign | ((mantissa | 0x800000) >>> (126 - exponent));
  return sign | ((exponent - 112) << 10) | (mantissa >>> 13);
}

const fail = (message: string): never => {
  throw new Error(`HDRLoader: ${message}`);
};

/** Reads the header's lines up to the size line, and moves `position` past them */
function readHeader(bytes: Uint8Array, cursor: { position: number }) {
  const header = { width: 0, height: 0, gamma: 1, exposure: 1, format: '' };
  let line = '';
  let first = true;
  while (cursor.position < bytes.length) {
    const byte = bytes[cursor.position++];
    if (byte !== 0x0a) {
      line += String.fromCharCode(byte);
      continue;
    }
    if (first) {
      if (!/^#\?(\S+)/.test(line)) fail('Bad File Format: bad initial token');
      first = false;
    } else if (!line.startsWith('#')) {
      const gamma = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/.exec(line);
      if (gamma) header.gamma = Number.parseFloat(gamma[1]);
      const exposure = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/.exec(line);
      if (exposure) header.exposure = Number.parseFloat(exposure[1]);
      const format = /^\s*FORMAT=(\S+)\s*$/.exec(line);
      if (format) header.format = format[1];
      const size = /^\s*-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/.exec(line);
      if (size) {
        header.height = Number.parseInt(size[1], 10);
        header.width = Number.parseInt(size[2], 10);
        if (!header.format) fail('Bad File Format: missing format specifier');
        return header;
      }
    }
    line = '';
  }
  return fail('Bad File Format: missing image size specifier');
}

/** Reads the pixels, run-length encoded per scanline or flat, into RGBE bytes */
function readPixels(bytes: Uint8Array, width: number, height: number): Uint8Array {
  if (width < 8 || width > 0x7fff || bytes[0] !== 2 || bytes[1] !== 2 || bytes[2] & 0x80) return bytes;
  if (width !== ((bytes[2] << 8) | bytes[3])) fail('Bad File Format: wrong scanline width');

  const rgbe = new Uint8Array(4 * width * height);
  const scanline = new Uint8Array(4 * width);
  let offset = 0;
  let position = 0;
  for (let row = 0; row < height && position < bytes.length; row++) {
    if (position + 4 > bytes.length) fail('Read Error');
    const start = bytes.subarray(position, position + 4);
    position += 4;
    if (start[0] !== 2 || start[1] !== 2 || ((start[2] << 8) | start[3]) !== width) {
      fail('Bad File Format: bad rgbe scanline format');
    }
    let pointer = 0;
    while (pointer < scanline.length && position < bytes.length) {
      let count = bytes[position++];
      const run = count > 128;
      if (run) count -= 128;
      if (count === 0 || pointer + count > scanline.length) fail('Bad File Format: bad scanline data');
      if (run) {
        scanline.fill(bytes[position++], pointer, pointer + count);
      } else {
        scanline.set(bytes.subarray(position, position + count), pointer);
        position += count;
      }
      pointer += count;
    }
    for (let x = 0; x < width; x++) {
      rgbe[offset++] = scanline[x];
      rgbe[offset++] = scanline[x + width];
      rgbe[offset++] = scanline[x + 2 * width];
      rgbe[offset++] = scanline[x + 3 * width];
    }
  }
  return rgbe;
}

/**
 * Decodes a Radiance `.hdr` file into linear half floats, as three's `HDRLoader` does
 * @param buffer - The file's bytes
 * @internal
 */
export function parseRGBE(buffer: ArrayBuffer): RGBEImage {
  const bytes = new Uint8Array(buffer);
  const cursor = { position: 0 };
  const { width, height, gamma, exposure } = readHeader(bytes, cursor);
  const rgbe = readPixels(bytes.subarray(cursor.position), width, height);
  const data = new Uint16Array(width * height * 4);
  const one = toHalfFloat(1);
  for (let i = 0; i < width * height * 4; i += 4) {
    const scale = 2 ** (rgbe[i + 3] - 128) / 255;
    data[i] = toHalfFloat(rgbe[i] * scale);
    data[i + 1] = toHalfFloat(rgbe[i + 1] * scale);
    data[i + 2] = toHalfFloat(rgbe[i + 2] * scale);
    data[i + 3] = one;
  }
  return { width, height, data, gamma, exposure };
}

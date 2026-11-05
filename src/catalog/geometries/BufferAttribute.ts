/*!
 * Adapted from three.js r187, src/core/BufferAttribute.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import type { Matrix3, Matrix4 } from '@pixi/3d';

import { Vector3 } from '../../math/Vector3';
import { FloatType, StaticDrawUsage } from '../constants';

/**
 * The typed arrays a {@link BufferAttribute} holds
 * @category catalog
 * @advanced
 */
export type BufferAttributeArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array;

/**
 * A part of an attribute's array to upload, in array elements, as three's `addUpdateRange` takes it
 * @category catalog
 * @advanced
 */
export interface BufferAttributeUpdateRange {
  /** First element */
  start: number;
  /** How many elements */
  count: number;
}

/**
 * What a {@link BufferAttribute} tells when its data changes: the geometries that hold it
 * @internal
 */
export interface BufferAttributeOwner {
  _onAttributeUpdate(attribute: BufferAttribute): void;
}

const v3 = new Vector3();

function denormalize(value: number, array: BufferAttributeArray): number {
  if (array instanceof Float32Array) return value;
  if (array instanceof Uint32Array) return value / 4294967295;
  if (array instanceof Uint16Array) return value / 65535;
  if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return value / 255;
  if (array instanceof Int32Array) return Math.max(value / 2147483647, -1);
  if (array instanceof Int16Array) return Math.max(value / 32767, -1);
  return Math.max(value / 127, -1);
}

function normalize(value: number, array: BufferAttributeArray): number {
  if (array instanceof Float32Array) return value;
  if (array instanceof Uint32Array) return Math.round(value * 4294967295);
  if (array instanceof Uint16Array) return Math.round(value * 65535);
  if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return Math.round(value * 255);
  if (array instanceof Int32Array) return Math.round(value * 2147483647);
  if (array instanceof Int16Array) return Math.round(value * 32767);
  return Math.round(value * 127);
}

/**
 * three's `BufferAttribute`: per-vertex data, `itemSize` numbers per vertex, in a typed array
 *
 * A {@link BufferGeometry} draws its `position`, `normal`, `uv`, `color` and `tangent` attributes
 * through pixi-3d; any other name is kept for your own code. Set `needsUpdate` after writing into
 * `array` and the geometry draws the new data from the next frame. Give it `usage`
 * `DynamicDrawUsage` when it changes every frame: its geometry then draws from its own buffers
 * instead of being packed into pixi-3d's shared ones again on each change.
 * @example
 * ```tsx
 * <bufferGeometry>
 *   <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]), 3]} />
 * </bufferGeometry>
 * ```
 * @category catalog
 * @standard
 */
export class BufferAttribute {
  /** Always `true`; three and r3f duck-type attributes by it */
  public readonly isBufferAttribute = true;
  /** A name of your choosing */
  public name = '';
  /** The data, `itemSize` numbers per vertex */
  public array: BufferAttributeArray;
  /** Numbers per vertex: 3 for a position, 2 for a texture coordinate */
  public itemSize: number = 1;
  /** Number of vertices: `array.length / itemSize` */
  public count: number = 0;
  /** Whether integer data reads as 0 to 1 (or -1 to 1) instead of as the stored integers */
  public normalized: boolean;
  /** three's usage hint; `DynamicDrawUsage` makes its geometry draw from its own buffers */
  public usage: number = StaticDrawUsage;
  /** Parts of `array` to upload on the next update; the whole array is uploaded here either way */
  public updateRanges: BufferAttributeUpdateRange[] = [];
  /** three's GPU type hint, kept for three's shape */
  public gpuType: number = FloatType;
  /** Counts the times `needsUpdate` was set */
  public version: number = 0;
  /** Called after the data is uploaded; kept for three's shape */
  public onUploadCallback: () => void = () => {};
  /** @internal */
  public readonly _owners = new Set<BufferAttributeOwner>();

  /**
   * @param array - The data
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether integer data reads as 0 to 1 (or -1 to 1)
   */
  constructor(array: BufferAttributeArray, itemSize: number, normalized = false) {
    if (Array.isArray(array)) throw new TypeError('BufferAttribute: array should be a Typed Array.');

    this.array = array;
    this.itemSize = itemSize;
    this.count = array !== undefined ? array.length / itemSize : 0;
    this.normalized = normalized;
  }

  /** Set it to `true` after changing `array`, and the geometries holding the attribute draw the new data */
  public set needsUpdate(value: boolean) {
    if (value !== true) return;
    this.version++;
    for (const owner of this._owners) owner._onAttributeUpdate(this);
  }

  /**
   * Sets the usage hint
   * @param value - `StaticDrawUsage`, `DynamicDrawUsage`, ...
   * @returns This attribute
   */
  public setUsage(value: number): this {
    this.usage = value;
    this.needsUpdate = true;
    return this;
  }

  /**
   * Adds a part of `array` to upload
   * @param start - First element
   * @param count - How many elements
   */
  public addUpdateRange(start: number, count: number): void {
    this.updateRanges.push({ start, count });
  }

  /** Forgets the parts to upload */
  public clearUpdateRanges(): void {
    this.updateRanges.length = 0;
  }

  /**
   * Copies another attribute's data and settings
   * @param source - The attribute to copy
   * @returns This attribute
   */
  public copy(source: BufferAttribute): this {
    this.name = source.name;
    this.array = new (source.array.constructor as new (array: BufferAttributeArray) => BufferAttributeArray)(
      source.array,
    );
    this.itemSize = source.itemSize;
    this.count = source.count;
    this.normalized = source.normalized;
    this.usage = source.usage;
    this.gpuType = source.gpuType;
    return this;
  }

  /**
   * Copies one vertex from another attribute
   * @param index1 - Vertex to write
   * @param attribute - Attribute to read
   * @param index2 - Vertex to read
   * @returns This attribute
   */
  public copyAt(index1: number, attribute: BufferAttribute, index2: number): this {
    index1 *= this.itemSize;
    index2 *= attribute.itemSize;
    for (let i = 0, l = this.itemSize; i < l; i++) this.array[index1 + i] = attribute.array[index2 + i];
    return this;
  }

  /**
   * Copies numbers into `array`
   * @param array - The numbers
   * @returns This attribute
   */
  public copyArray(array: ArrayLike<number>): this {
    this.array.set(array);
    return this;
  }

  /**
   * Multiplies every vertex by a 3x3 matrix
   * @param m - The matrix
   * @returns This attribute
   */
  public applyMatrix3(m: Matrix3): this {
    if (this.itemSize === 2) {
      const e = m.elements;
      for (let i = 0, l = this.count; i < l; i++) {
        const x = this.getX(i);
        const y = this.getY(i);
        this.setXY(i, e[0] * x + e[3] * y + e[6], e[1] * x + e[4] * y + e[7]);
      }
    } else if (this.itemSize === 3) {
      for (let i = 0, l = this.count; i < l; i++) {
        v3.fromBufferAttribute(this, i).applyMatrix3(m);
        this.setXYZ(i, v3.x, v3.y, v3.z);
      }
    }
    return this;
  }

  /**
   * Moves every vertex by a 4x4 matrix, as points
   * @param m - The matrix
   * @returns This attribute
   */
  public applyMatrix4(m: Matrix4): this {
    for (let i = 0, l = this.count; i < l; i++) {
      v3.fromBufferAttribute(this, i).applyMatrix4(m);
      this.setXYZ(i, v3.x, v3.y, v3.z);
    }
    return this;
  }

  /**
   * Turns every vertex by a normal matrix and normalises it
   * @param m - The normal matrix
   * @returns This attribute
   */
  public applyNormalMatrix(m: Matrix3): this {
    for (let i = 0, l = this.count; i < l; i++) {
      v3.fromBufferAttribute(this, i).applyNormalMatrix(m);
      this.setXYZ(i, v3.x, v3.y, v3.z);
    }
    return this;
  }

  /**
   * Turns every vertex by a 4x4 matrix, as directions, and normalises it
   * @param m - The matrix
   * @returns This attribute
   */
  public transformDirection(m: Matrix4): this {
    for (let i = 0, l = this.count; i < l; i++) {
      v3.fromBufferAttribute(this, i).transformDirection(m);
      this.setXYZ(i, v3.x, v3.y, v3.z);
    }
    return this;
  }

  /**
   * Writes numbers into `array`
   * @param value - The numbers
   * @param offset - Where to start writing
   * @returns This attribute
   */
  public set(value: ArrayLike<number>, offset = 0): this {
    this.array.set(value, offset);
    return this;
  }

  /**
   * One component of a vertex
   * @param index - The vertex
   * @param component - 0 for x, 1 for y, ...
   */
  public getComponent(index: number, component: number): number {
    const value = this.array[index * this.itemSize + component];
    return this.normalized ? denormalize(value, this.array) : value;
  }

  /**
   * Sets one component of a vertex
   * @param index - The vertex
   * @param component - 0 for x, 1 for y, ...
   * @param value - The value
   * @returns This attribute
   */
  public setComponent(index: number, component: number, value: number): this {
    this.array[index * this.itemSize + component] = this.normalized ? normalize(value, this.array) : value;
    return this;
  }

  /**
   * The x component of a vertex
   * @param index - The vertex
   */
  public getX(index: number): number {
    return this.getComponent(index, 0);
  }

  /**
   * Sets the x component of a vertex
   * @param index - The vertex
   * @param x - The value
   * @returns This attribute
   */
  public setX(index: number, x: number): this {
    return this.setComponent(index, 0, x);
  }

  /**
   * The y component of a vertex
   * @param index - The vertex
   */
  public getY(index: number): number {
    return this.getComponent(index, 1);
  }

  /**
   * Sets the y component of a vertex
   * @param index - The vertex
   * @param y - The value
   * @returns This attribute
   */
  public setY(index: number, y: number): this {
    return this.setComponent(index, 1, y);
  }

  /**
   * The z component of a vertex
   * @param index - The vertex
   */
  public getZ(index: number): number {
    return this.getComponent(index, 2);
  }

  /**
   * Sets the z component of a vertex
   * @param index - The vertex
   * @param z - The value
   * @returns This attribute
   */
  public setZ(index: number, z: number): this {
    return this.setComponent(index, 2, z);
  }

  /**
   * The w component of a vertex
   * @param index - The vertex
   */
  public getW(index: number): number {
    return this.getComponent(index, 3);
  }

  /**
   * Sets the w component of a vertex
   * @param index - The vertex
   * @param w - The value
   * @returns This attribute
   */
  public setW(index: number, w: number): this {
    return this.setComponent(index, 3, w);
  }

  /**
   * Sets the x and y components of a vertex
   * @param index - The vertex
   * @param x - The x value
   * @param y - The y value
   * @returns This attribute
   */
  public setXY(index: number, x: number, y: number): this {
    return this.setComponent(index, 0, x).setComponent(index, 1, y);
  }

  /**
   * Sets the x, y and z components of a vertex
   * @param index - The vertex
   * @param x - The x value
   * @param y - The y value
   * @param z - The z value
   * @returns This attribute
   */
  public setXYZ(index: number, x: number, y: number, z: number): this {
    return this.setComponent(index, 0, x).setComponent(index, 1, y).setComponent(index, 2, z);
  }

  /**
   * Sets every component of a vertex
   * @param index - The vertex
   * @param x - The x value
   * @param y - The y value
   * @param z - The z value
   * @param w - The w value
   * @returns This attribute
   */
  public setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    return this.setComponent(index, 0, x).setComponent(index, 1, y).setComponent(index, 2, z).setComponent(index, 3, w);
  }

  /**
   * Sets the callback run after an upload
   * @param callback - The callback
   * @returns This attribute
   */
  public onUpload(callback: () => void): this {
    this.onUploadCallback = callback;
    return this;
  }

  /** A new attribute with a copy of this one's data and settings */
  public clone(): BufferAttribute {
    return new BufferAttribute(this.array, this.itemSize).copy(this);
  }

  /** The attribute as three's JSON */
  public toJSON(): { itemSize: number; type: string; array: number[]; normalized: boolean; name?: string } {
    return {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized,
      ...(this.name !== '' ? { name: this.name } : {}),
    };
  }

  /** Kept for three's shape: an attribute holds no GPU memory of its own */
  public dispose(): void {}
}

type ArraySource = ArrayLike<number> | ArrayBuffer | Iterable<number>;

/**
 * three's `Int8BufferAttribute`: a {@link BufferAttribute} over an `Int8Array` made from `array`
 * @category catalog
 * @advanced
 */
export class Int8BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as -1 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Int8Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Uint8BufferAttribute`: a {@link BufferAttribute} over a `Uint8Array` made from `array`
 * @category catalog
 * @advanced
 */
export class Uint8BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as 0 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Uint8Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Uint8ClampedBufferAttribute`: a {@link BufferAttribute} over a `Uint8ClampedArray` made
 * from `array`
 * @category catalog
 * @advanced
 */
export class Uint8ClampedBufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as 0 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Uint8ClampedArray(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Int16BufferAttribute`: a {@link BufferAttribute} over an `Int16Array` made from `array`
 * @category catalog
 * @advanced
 */
export class Int16BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as -1 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Int16Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Uint16BufferAttribute`: a {@link BufferAttribute} over a `Uint16Array` made from `array`,
 * the usual index type
 * @category catalog
 * @advanced
 */
export class Uint16BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as 0 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Uint16Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Int32BufferAttribute`: a {@link BufferAttribute} over an `Int32Array` made from `array`
 * @category catalog
 * @advanced
 */
export class Int32BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as -1 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Int32Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Uint32BufferAttribute`: a {@link BufferAttribute} over a `Uint32Array` made from `array`,
 * the index type of large geometries
 * @category catalog
 * @advanced
 */
export class Uint32BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Whether the data reads as 0 to 1
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Uint32Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

/**
 * three's `Float32BufferAttribute`: a {@link BufferAttribute} over a `Float32Array` made from
 * `array`, what three's geometries build their positions, normals and UVs with
 * @example
 * ```ts
 * geometry.setAttribute('position', new Float32BufferAttribute([0, 1, 0, -1, -1, 0, 1, -1, 0], 3));
 * ```
 * @category catalog
 * @standard
 */
export class Float32BufferAttribute extends BufferAttribute {
  /**
   * @param array - The numbers
   * @param itemSize - Numbers per vertex
   * @param normalized - Kept for three's signature; floats are never normalised
   */
  constructor(array: ArraySource, itemSize: number, normalized?: boolean) {
    super(new Float32Array(array as ArrayLike<number>), itemSize, normalized);
  }
}

import { StaticDrawUsage } from '../constants';

/** A typed array a buffer attribute can hold */
type AttributeArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array;

/**
 * three's `InstancedBufferAttribute`: one value of `itemSize` numbers per instance, in a typed array
 *
 * An `InstancedMesh` keeps its `instanceMatrix` (16 numbers per instance) and `instanceColor` (3) in
 * one. Writing into `array` and then setting `needsUpdate = true` sends the values to the mesh, as
 * three's upload does. `<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />` gives an
 * `instancedMesh` its colours.
 * @example
 * ```tsx
 * const colors = new Float32Array(count * 3).fill(1);
 *
 * <instancedMesh args={[undefined, undefined, count]}>
 *   <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
 *   <boxGeometry />
 *   <meshBasicMaterial />
 * </instancedMesh>
 * ```
 * @category catalog
 * @advanced
 */
export class InstancedBufferAttribute {
  /** Always `true`, as on three's `BufferAttribute` */
  public readonly isBufferAttribute = true;
  /** Always `true`, as on three's `InstancedBufferAttribute` */
  public readonly isInstancedBufferAttribute = true;
  /** A name, for debugging */
  public name = '';
  /** The values, `itemSize` numbers per instance */
  public array: AttributeArray;
  /** How many numbers make one value */
  public itemSize: number;
  /** Whether integer values read as 0 to 1 (or -1 to 1) */
  public normalized: boolean;
  /** three's usage hint; kept, pixi-3d uploads what changed */
  public usage: number = StaticDrawUsage;
  /** How many instances one value serves; always 1 here */
  public meshPerAttribute: number = 1;
  /** Ranges of `array` changed since the last upload; kept for three's shape, the mesh uploads every value */
  public updateRanges: { start: number; count: number }[] = [];
  /** Counts the uploads asked for with `needsUpdate` */
  public version: number = 0;
  /**
   * The mesh's handler for `needsUpdate`
   * @internal
   */
  public _onNeedsUpdate: (() => void) | null = null;

  /**
   * @param array - The values, `itemSize` numbers per instance
   * @param itemSize - How many numbers make one value
   * @param normalized - Whether integer values read as 0 to 1 (or -1 to 1)
   * @param meshPerAttribute - How many instances one value serves
   */
  constructor(array: AttributeArray, itemSize: number, normalized = false, meshPerAttribute = 1) {
    this.array = array;
    this.itemSize = itemSize;
    this.normalized = normalized;
    this.meshPerAttribute = meshPerAttribute;
  }

  /** How many values `array` holds */
  public get count(): number {
    return this.array.length / this.itemSize;
  }

  /** Set to `true` after writing into `array`, so the mesh takes the new values */
  public set needsUpdate(value: boolean) {
    if (!value) return;
    this.version++;
    this._onNeedsUpdate?.();
  }

  /**
   * Sets the usage hint
   * @param value - three's usage constant, such as `DynamicDrawUsage`
   * @returns This attribute
   */
  public setUsage(value: number): this {
    this.usage = value;
    return this;
  }

  /**
   * Records a range of `array` that changed
   * @param start - The first changed index of `array`
   * @param count - How many numbers changed
   */
  public addUpdateRange(start: number, count: number): void {
    this.updateRanges.push({ start, count });
  }

  /** Forgets the recorded ranges */
  public clearUpdateRanges(): void {
    this.updateRanges.length = 0;
  }

  /**
   * Copies values into `array`
   * @param value - The values
   * @param offset - Where in `array` to start
   * @returns This attribute
   */
  public set(value: ArrayLike<number>, offset = 0): this {
    this.array.set(value, offset);
    return this;
  }

  /**
   * Replaces every value of `array`
   * @param array - The values
   * @returns This attribute
   */
  public copyArray(array: ArrayLike<number>): this {
    this.array.set(array);
    return this;
  }

  /**
   * One number of one value
   * @param index - The value
   * @param component - Which of its numbers
   */
  public getComponent(index: number, component: number): number {
    return this.array[index * this.itemSize + component];
  }

  /**
   * Sets one number of one value
   * @param index - The value
   * @param component - Which of its numbers
   * @param value - The number
   */
  public setComponent(index: number, component: number, value: number): void {
    this.array[index * this.itemSize + component] = value;
  }

  /**
   * The first number of a value
   * @param index - The value
   */
  public getX(index: number): number {
    return this.getComponent(index, 0);
  }

  /**
   * The second number of a value
   * @param index - The value
   */
  public getY(index: number): number {
    return this.getComponent(index, 1);
  }

  /**
   * The third number of a value
   * @param index - The value
   */
  public getZ(index: number): number {
    return this.getComponent(index, 2);
  }

  /**
   * The fourth number of a value
   * @param index - The value
   */
  public getW(index: number): number {
    return this.getComponent(index, 3);
  }

  /**
   * Sets the first number of a value
   * @param index - The value
   * @param x - The number
   * @returns This attribute
   */
  public setX(index: number, x: number): this {
    this.setComponent(index, 0, x);
    return this;
  }

  /**
   * Sets the second number of a value
   * @param index - The value
   * @param y - The number
   * @returns This attribute
   */
  public setY(index: number, y: number): this {
    this.setComponent(index, 1, y);
    return this;
  }

  /**
   * Sets the third number of a value
   * @param index - The value
   * @param z - The number
   * @returns This attribute
   */
  public setZ(index: number, z: number): this {
    this.setComponent(index, 2, z);
    return this;
  }

  /**
   * Sets the fourth number of a value
   * @param index - The value
   * @param w - The number
   * @returns This attribute
   */
  public setW(index: number, w: number): this {
    this.setComponent(index, 3, w);
    return this;
  }

  /**
   * Sets the first two numbers of a value
   * @param index - The value
   * @param x - The first number
   * @param y - The second number
   * @returns This attribute
   */
  public setXY(index: number, x: number, y: number): this {
    return this.setX(index, x).setY(index, y);
  }

  /**
   * Sets the first three numbers of a value
   * @param index - The value
   * @param x - The first number
   * @param y - The second number
   * @param z - The third number
   * @returns This attribute
   */
  public setXYZ(index: number, x: number, y: number, z: number): this {
    return this.setXY(index, x, y).setZ(index, z);
  }

  /**
   * Sets the first four numbers of a value
   * @param index - The value
   * @param x - The first number
   * @param y - The second number
   * @param z - The third number
   * @param w - The fourth number
   * @returns This attribute
   */
  public setXYZW(index: number, x: number, y: number, z: number, w: number): this {
    return this.setXYZ(index, x, y, z).setW(index, w);
  }

  /** A new attribute with a copy of the values */
  public clone(): InstancedBufferAttribute {
    const copy = new InstancedBufferAttribute(
      this.array.slice(),
      this.itemSize,
      this.normalized,
      this.meshPerAttribute,
    );

    copy.name = this.name;
    copy.usage = this.usage;
    return copy;
  }
}

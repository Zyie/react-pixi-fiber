/*!
 * Adapted from three.js r187, src/core/InstancedBufferAttribute.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { BufferAttribute } from '../geometries/BufferAttribute';
import type { BufferAttributeArray } from '../geometries/BufferAttribute';

/**
 * three's `InstancedBufferAttribute`: a {@link BufferAttribute} with one value of `itemSize` numbers per
 * instance
 *
 * An `InstancedMesh` keeps its `instanceMatrix` (16 numbers per instance) and `instanceColor` (3) in
 * one. Writing into `array` and then setting `needsUpdate = true` sends the values to the mesh, as
 * three's upload does. `<instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />` gives an
 * `instancedMesh` its colours.
 * @example
 * ```tsx
 * const colors = new Float32Array(count * 3).fill(1);
 *
 * <instancedMesh args={[null, null, count]}>
 *   <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
 *   <boxGeometry />
 *   <meshBasicMaterial />
 * </instancedMesh>
 * ```
 * @category catalog
 * @advanced
 */
export class InstancedBufferAttribute extends BufferAttribute {
  /** Always `true`, as on three's `InstancedBufferAttribute` */
  public readonly isInstancedBufferAttribute = true;
  /** How many instances one value serves; always 1 here */
  public meshPerAttribute: number = 1;
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
  constructor(array: BufferAttributeArray, itemSize: number, normalized = false, meshPerAttribute = 1) {
    super(array, itemSize, normalized);
    this.meshPerAttribute = meshPerAttribute;
  }

  /** Set to `true` after writing into `array`, so the mesh takes the new values */
  public override set needsUpdate(value: boolean) {
    if (value !== true) return;
    super.needsUpdate = value;
    this._onNeedsUpdate?.();
  }

  /**
   * Copies another attribute's values and settings
   * @param source - The attribute to copy
   * @returns This attribute
   */
  public override copy(source: BufferAttribute): this {
    super.copy(source);
    if (source instanceof InstancedBufferAttribute) this.meshPerAttribute = source.meshPerAttribute;
    return this;
  }

  /** A new attribute with a copy of the values */
  public override clone(): InstancedBufferAttribute {
    return new InstancedBufferAttribute(this.array, this.itemSize).copy(this);
  }
}

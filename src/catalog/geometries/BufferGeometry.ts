/*!
 * Adapted from three.js r187, src/core/BufferGeometry.js
 * Copyright 2010-2025 three.js authors, MIT License
 */
import { Geometry3D, Matrix4 as PixiMatrix4, computeBoundsFromPositions } from '@pixi/3d';
import type { Matrix4, PointData3D, Quaternion, Sphere as PixiSphere } from '@pixi/3d';
import { Buffer, BufferUsage } from 'pixi.js';
import type { Attribute, VertexFormat } from 'pixi.js';

import { Box3 } from '../../math/Box3';
import { MathUtils } from '../../math/MathUtils';
import { Matrix3 } from '../../math/Matrix3';
import { Sphere } from '../../math/Sphere';
import { Vector3 } from '../../math/Vector3';
import { StaticDrawUsage } from '../constants';
import {
  BufferAttribute,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
} from './BufferAttribute';
import type { BufferAttributeArray, BufferAttributeOwner } from './BufferAttribute';

/**
 * A range of a geometry's indices drawn with one of a mesh's materials, as three's `addGroup` makes
 * @category catalog
 * @advanced
 */
export interface GeometryGroup {
  /** First index (or vertex, without an index) */
  start: number;
  /** How many indices */
  count: number;
  /** Which of the mesh's materials draws it */
  materialIndex: number;
}

/** How pixi-3d draws one of three's attributes */
interface PixiAttributeTarget {
  /** pixi-3d's name for it */
  name: string;
  /** Floats per vertex pixi-3d reads */
  size: number;
  format: VertexFormat;
  /**
   * Whether `v` runs the other way: three's textures are flipped on load, so `v = 1` is an image's
   * top row, where pixi's is at `v = 0`
   */
  flipV?: boolean;
}

/** Where each attribute three draws goes in pixi-3d's geometry */
const PIXI_ATTRIBUTES: Readonly<Record<string, PixiAttributeTarget>> = {
  position: { name: 'aPosition', size: 3, format: 'float32x3' },
  normal: { name: 'aNormal', size: 3, format: 'float32x3' },
  uv: { name: 'aUV', size: 2, format: 'float32x2', flipV: true },
  color: { name: 'aColor', size: 4, format: 'float32x4' },
  tangent: { name: 'aTangent', size: 4, format: 'float32x4' },
};

/** A degenerate triangle at the origin: what a geometry with no `position` yet draws, which is nothing */
const EMPTY_POSITIONS = new Float32Array(9);

/**
 * How the object holding a geometry draws its vertices, which decides what pixi-3d gets: triangles
 * as they are, each vertex as a camera-facing quad for `Points`, or vertex pairs as 1px lines for
 * `LineSegments`, `Line` (a strip) and `LineLoop`
 * @internal
 */
export type GeometryDrawMode = 'triangles' | 'points' | 'lineSegments' | 'lineStrip' | 'lineLoop';

/** The corners of a point's quad as texture coordinates: top left, bottom left, bottom right, top right */
const POINT_CORNERS = [0, 0, 0, 1, 1, 1, 1, 0];

/** The pixi-3d internals a geometry resets when its attributes change */
interface Geometry3DInternals {
  attributes: Record<string, Attribute>;
  dynamic: boolean;
  _attributeKey: string | null;
}

let nextId = 0;
const scratchMatrix = new PixiMatrix4();
const scratchNormalMatrix = new Matrix3();
const scratchVector = new Vector3();
const scratchCenter = new Vector3();

/**
 * Whether three's data can go to pixi-3d as it is: floats, as many per vertex as pixi-3d reads
 * @param attribute - three's attribute
 * @param target - How pixi-3d draws it
 */
function sharesArray(attribute: BufferAttribute, target: PixiAttributeTarget): boolean {
  return attribute.array instanceof Float32Array && attribute.itemSize === target.size && !target.flipV;
}

/**
 * Writes three's data as the floats pixi-3d reads, padding a missing fourth component with 1, as
 * pixi-3d reads colours and tangents as four
 * @param attribute - three's attribute
 * @param target - How pixi-3d draws it
 * @param out - Where to write; a new array when it is missing or the wrong length
 */
function toFloats(attribute: BufferAttribute, { size, flipV }: PixiAttributeTarget, out?: Float32Array): Float32Array {
  const { count, itemSize } = attribute;
  const data = out?.length === count * size ? out : new Float32Array(count * size);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < size; c++) {
      data[i * size + c] = c < itemSize ? attribute.getComponent(i, c) : c === 3 ? 1 : 0;
    }
    if (flipV) data[i * size + 1] = 1 - data[i * size + 1];
  }
  return data;
}

/**
 * Sets a generated geometry's index and its `position`, `normal` and `uv`, as each of three's
 * generators ends
 * @param geometry - The geometry
 * @param indices - Three per triangle
 * @param vertices - Positions, three per vertex
 * @param normals - Normals, three per vertex
 * @param uvs - Texture coordinates, two per vertex
 * @internal
 */
export function setGenerated(
  geometry: BufferGeometry,
  indices: number[],
  vertices: number[],
  normals: number[],
  uvs: number[],
): void {
  geometry.setIndex(indices);
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
}

/**
 * three's `BufferGeometry` over pixi-3d's `Geometry3D`: vertex data as named attributes and an index
 *
 * `position`, `normal`, `uv`, `color` and `tangent` are drawn; other attributes are kept for your
 * code. Every geometry of the catalog extends it, so `geometry.attributes.position`,
 * `computeVertexNormals()`, `translate()` and the rest work on a `<boxGeometry>` as on a
 * `<bufferGeometry>`. `attach="attributes-position"` and `attach="index"` work as in r3f.
 *
 * Set an attribute's `needsUpdate` after changing its data. pixi-3d packs a geometry into buffers it
 * shares with others, so an update packs it again; an attribute with usage `DynamicDrawUsage` makes
 * the geometry draw from its own buffers instead, for data that changes every frame.
 *
 * `geometry.attributes` is also pixi-3d's attribute map: iterating it lists pixi-3d's names
 * (`aPosition`, `aNormal`, ...), and three's names are read and written through it. `groups` are
 * kept, and a mesh draws them with one material. `morphAttributes` are kept and not drawn.
 * @example
 * ```tsx
 * <bufferGeometry>
 *   <bufferAttribute attach="attributes-position" args={[positions, 3]} />
 *   <bufferAttribute attach="attributes-color" args={[colors, 3]} />
 * </bufferGeometry>
 * ```
 * @category catalog
 * @standard
 */
export class BufferGeometry extends Geometry3D implements BufferAttributeOwner {
  /** Always `true`; r3f attaches a child to a mesh's `geometry` by it */
  declare public readonly isBufferGeometry: true;
  /** A number unique to this geometry */
  public readonly id: number = nextId++;
  /** A UUID unique to this geometry */
  public uuid: string = MathUtils.generateUUID();
  /** A name of your choosing */
  public name = '';
  /** three's class name */
  public type = 'BufferGeometry';
  /** Ranges of indices drawn with one of a mesh's materials each; kept, a mesh draws them with one */
  public groups: GeometryGroup[] = [];
  /** The part of the indices (or vertices) drawn: `start` and `count` */
  public readonly drawRange = { start: 0, count: Infinity };
  /** The box around `position`, or `null` until `computeBoundingBox()` */
  public boundingBox: Box3 | null = null;
  /** The sphere around `position`, or `null` until `computeBoundingSphere()` */
  public boundingSphere: Sphere | null = null;
  /** Morph target attributes by name; kept, not drawn */
  public morphAttributes: Record<string, BufferAttribute[]> = {};
  /** Whether morph targets hold offsets; kept for three's shape */
  public morphTargetsRelative = false;
  /** Your own data */
  public userData: Record<string, unknown> = {};
  /** The arguments a generated geometry was built from, as three's geometries keep them */
  public parameters?: Record<string, unknown>;

  private readonly _threeAttributes: Record<string, BufferAttribute> = Object.create(null);
  private _drawMode: GeometryDrawMode = 'triangles';
  private readonly _pixiData = new Map<BufferAttribute, Float32Array>();
  private _index: BufferAttribute | null = null;

  constructor() {
    super({ positions: EMPTY_POSITIONS, quantizeNormals: false });
    const internals = this as unknown as Geometry3DInternals;

    internals.attributes = new Proxy(internals.attributes, {
      get: (target, key: string) => (key in target ? target[key] : this._threeAttributes[key]),
      set: (target, key: string, value: Attribute | BufferAttribute) => {
        if (value instanceof BufferAttribute) this.setAttribute(key, value);
        else target[key] = value;
        return true;
      },
      deleteProperty: (target, key: string) => {
        if (key in this._threeAttributes) this.deleteAttribute(key);
        else delete target[key];
        return true;
      },
    });
  }

  /** three's attributes by name; pixi-3d's attributes, by pixi-3d's names, when iterated */
  declare public readonly attributes: Record<string, Attribute & BufferAttribute>;

  /** The index, three per triangle, or `null` to draw the vertices in order */
  public get index(): BufferAttribute | null {
    return this._index;
  }

  public set index(value: BufferAttribute | null) {
    this.setIndex(value);
  }

  /**
   * The index, or `null` when the vertices are drawn in order. Typed to stand in for pixi's
   * `getIndex`, which returns the index buffer and which neither pixi-3d nor pixi's 3D path calls.
   */
  public override getIndex(): BufferAttribute & Buffer {
    return this._index as BufferAttribute & Buffer;
  }

  /**
   * Sets the index
   * @param index - An attribute, an array of numbers, or `null` to draw the vertices in order
   * @returns This geometry
   */
  public setIndex(index: BufferAttribute | number[] | null): this {
    const next = Array.isArray(index)
      ? new (index.some((value) => value > 65535) ? Uint32BufferAttribute : Uint16BufferAttribute)(index, 1)
      : index;
    if (next === this._index) return this;
    this._index?._owners.delete(this);
    this._index = next;
    next?._owners.add(this);
    this._rebuild();
    return this;
  }

  /**
   * An attribute by three's name, or `undefined` when it isn't set. Typed to stand in for pixi's
   * `getAttribute`, which takes pixi's names and which neither pixi-3d nor pixi's 3D path calls.
   * @param name - `position`, `normal`, `uv`, `color`, or a name of your own
   */
  public override getAttribute(name: string): BufferAttribute & Attribute {
    return this._threeAttributes[name] as BufferAttribute & Attribute;
  }

  /**
   * Sets an attribute
   * @param name - `position`, `normal`, `uv`, `color`, or a name of your own
   * @param attribute - The data
   * @returns This geometry
   */
  public setAttribute(name: string, attribute: BufferAttribute): this {
    const previous = this._threeAttributes[name];
    if (previous === attribute) return this;
    this._threeAttributes[name] = attribute;
    attribute._owners.add(this);
    if (previous) this._release(previous);
    if (name in PIXI_ATTRIBUTES) this._rebuild();
    return this;
  }

  /**
   * Removes an attribute
   * @param name - The attribute's name
   * @returns This geometry
   */
  public deleteAttribute(name: string): this {
    const previous = this._threeAttributes[name];
    if (!previous) return this;
    delete this._threeAttributes[name];
    this._release(previous);
    if (name in PIXI_ATTRIBUTES) this._rebuild();
    return this;
  }

  /**
   * Whether an attribute is set
   * @param name - The attribute's name
   */
  public hasAttribute(name: string): boolean {
    return this._threeAttributes[name] !== undefined;
  }

  /**
   * Adds a range of indices drawn with one of a mesh's materials
   * @param start - First index
   * @param count - How many indices
   * @param materialIndex - Which material
   */
  public addGroup(start: number, count: number, materialIndex = 0): void {
    this.groups.push({ start, count, materialIndex });
  }

  /** Removes every group */
  public clearGroups(): void {
    this.groups = [];
  }

  /**
   * Draws only part of the indices, or of the vertices without an index
   * @param start - First index
   * @param count - How many
   */
  public setDrawRange(start: number, count: number): void {
    this.drawRange.start = start;
    this.drawRange.count = count;
    if (this._drawMode === 'points') {
      this._rebuild();
      return;
    }
    this._rebuildIndex();
    this._repack();
  }

  /**
   * Transforms the vertices: positions as points, normals by the normal matrix, tangents as directions
   * @param matrix - The transform
   * @returns This geometry
   */
  public applyMatrix4(matrix: Matrix4): this {
    const { position, normal, tangent } = this._threeAttributes;
    if (position) {
      position.applyMatrix4(matrix);
      position.needsUpdate = true;
    }
    if (normal) {
      normal.applyNormalMatrix(scratchNormalMatrix.getNormalMatrix(matrix));
      normal.needsUpdate = true;
    }
    if (tangent) {
      tangent.transformDirection(matrix);
      tangent.needsUpdate = true;
    }
    if (this.boundingBox) this.computeBoundingBox();
    if (this.boundingSphere) this.computeBoundingSphere();
    return this;
  }

  /**
   * Rotates the vertices
   * @param q - The rotation
   * @returns This geometry
   */
  public applyQuaternion(q: Quaternion): this {
    return this.applyMatrix4(scratchMatrix.makeRotationFromQuaternion(q));
  }

  /**
   * Rotates the vertices about the X axis
   * @param angle - In radians
   * @returns This geometry
   */
  public rotateX(angle: number): this {
    return this.applyMatrix4(scratchMatrix.makeRotationX(angle));
  }

  /**
   * Rotates the vertices about the Y axis
   * @param angle - In radians
   * @returns This geometry
   */
  public rotateY(angle: number): this {
    return this.applyMatrix4(scratchMatrix.makeRotationY(angle));
  }

  /**
   * Rotates the vertices about the Z axis
   * @param angle - In radians
   * @returns This geometry
   */
  public rotateZ(angle: number): this {
    return this.applyMatrix4(scratchMatrix.makeRotationZ(angle));
  }

  /**
   * Moves the vertices
   * @param x - Along X
   * @param y - Along Y
   * @param z - Along Z
   * @returns This geometry
   */
  public translate(x: number, y: number, z: number): this {
    return this.applyMatrix4(scratchMatrix.makeTranslation(x, y, z));
  }

  /**
   * Scales the vertices
   * @param x - Along X
   * @param y - Along Y
   * @param z - Along Z
   * @returns This geometry
   */
  public scale(x: number, y: number, z: number): this {
    return this.applyMatrix4(scratchMatrix.makeScale(x, y, z));
  }

  /**
   * Moves the vertices so the bounding box is centred on the origin
   * @returns This geometry
   */
  public center(): this {
    this.computeBoundingBox();
    this.boundingBox!.getCenter(scratchCenter);
    return this.translate(-scratchCenter.x, -scratchCenter.y, -scratchCenter.z);
  }

  /**
   * Sets `position` from points, or overwrites it when it is already set
   * @param points - The points; a missing `z` is 0
   * @returns This geometry
   */
  public setFromPoints(points: readonly { x: number; y: number; z?: number }[]): this {
    const position = this._threeAttributes.position;
    if (!position) {
      const values: number[] = [];
      for (const point of points) values.push(point.x, point.y, point.z ?? 0);
      return this.setAttribute('position', new Float32BufferAttribute(values, 3));
    }
    const count = Math.min(points.length, position.count);
    for (let i = 0; i < count; i++) position.setXYZ(i, points[i].x, points[i].y, points[i].z ?? 0);
    position.needsUpdate = true;
    return this;
  }

  /** Works out `boundingBox` from `position` */
  public computeBoundingBox(): void {
    this.boundingBox ??= new Box3();
    const position = this._threeAttributes.position;
    if (!position) {
      this.boundingBox.makeEmpty();
      return;
    }
    this.boundingBox.makeEmpty();
    for (let i = 0; i < position.count; i++)
      this.boundingBox.expandByPoint(scratchVector.fromBufferAttribute(position, i));
  }

  /** Works out `boundingSphere` from `position` */
  public computeBoundingSphere(): void {
    this.boundingSphere ??= new Sphere();
    const position = this._threeAttributes.position;
    if (!position) return;
    const box = new Box3();
    for (let i = 0; i < position.count; i++) box.expandByPoint(scratchVector.fromBufferAttribute(position, i));
    const center = box.getCenter(this.boundingSphere.center);
    let maxRadiusSq = 0;
    for (let i = 0; i < position.count; i++) {
      maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(scratchVector.fromBufferAttribute(position, i)));
    }
    this.boundingSphere.radius = Math.sqrt(maxRadiusSq);
  }

  /** Works out smooth `normal`s from the triangles, adding the attribute when it is missing */
  public computeVertexNormals(): void {
    const position = this._threeAttributes.position;
    if (!position) return;
    let normal = this._threeAttributes.normal;
    if (!normal || normal.count !== position.count) {
      normal = new BufferAttribute(new Float32Array(position.count * 3), 3);
      this.setAttribute('normal', normal);
    } else {
      normal.array.fill(0);
    }

    const pA = new Vector3();
    const pB = new Vector3();
    const pC = new Vector3();
    const nA = new Vector3();
    const nB = new Vector3();
    const nC = new Vector3();
    const cb = new Vector3();
    const ab = new Vector3();
    const index = this._index;
    const triangles = index ? index.count : position.count;

    for (let i = 0; i < triangles; i += 3) {
      const vA = index ? index.getX(i) : i;
      const vB = index ? index.getX(i + 1) : i + 1;
      const vC = index ? index.getX(i + 2) : i + 2;
      pA.fromBufferAttribute(position, vA);
      pB.fromBufferAttribute(position, vB);
      pC.fromBufferAttribute(position, vC);
      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      if (index) {
        nA.fromBufferAttribute(normal, vA).add(cb);
        nB.fromBufferAttribute(normal, vB).add(cb);
        nC.fromBufferAttribute(normal, vC).add(cb);
        normal.setXYZ(vA, nA.x, nA.y, nA.z);
        normal.setXYZ(vB, nB.x, nB.y, nB.z);
        normal.setXYZ(vC, nC.x, nC.y, nC.z);
      } else {
        normal.setXYZ(vA, cb.x, cb.y, cb.z);
        normal.setXYZ(vB, cb.x, cb.y, cb.z);
        normal.setXYZ(vC, cb.x, cb.y, cb.z);
      }
    }

    this.normalizeNormals();
    normal.needsUpdate = true;
  }

  /** Scales every `normal` to unit length */
  public normalizeNormals(): void {
    const normal = this._threeAttributes.normal;
    if (!normal) return;
    for (let i = 0; i < normal.count; i++) {
      scratchVector.fromBufferAttribute(normal, i).normalize();
      normal.setXYZ(i, scratchVector.x, scratchVector.y, scratchVector.z);
    }
  }

  /**
   * Turns the vertices to face a point, as `lookAt` turns a node
   * @param vector - The point
   * @returns This geometry
   */
  public lookAt(vector: PointData3D): this {
    const z = new Vector3(vector.x, vector.y, vector.z).normalize();
    const x = new Vector3(0, 1, 0).cross(z);
    if (x.lengthSq() === 0) x.set(1, 0, 0);
    x.normalize();
    const y = z.clone().cross(x);
    const e = scratchMatrix.identity().elements;
    e[0] = x.x;
    e[1] = x.y;
    e[2] = x.z;
    e[4] = y.x;
    e[5] = y.y;
    e[6] = y.z;
    e[8] = z.x;
    e[9] = z.y;
    e[10] = z.z;
    return this.applyMatrix4(scratchMatrix);
  }

  /** A copy with every triangle's vertices written out, and no index */
  public toNonIndexed(): BufferGeometry {
    const index = this._index;
    if (!index) return this;
    const geometry = new BufferGeometry();
    for (const name in this._threeAttributes) {
      const attribute = this._threeAttributes[name];
      const { itemSize, array } = attribute;
      const out = new (array.constructor as new (length: number) => BufferAttributeArray)(index.count * itemSize);
      for (let i = 0; i < index.count; i++) {
        const from = index.getX(i) * itemSize;
        for (let c = 0; c < itemSize; c++) out[i * itemSize + c] = array[from + c];
      }
      geometry.setAttribute(name, new BufferAttribute(out, itemSize, attribute.normalized));
    }
    for (const group of this.groups) geometry.addGroup(group.start, group.count, group.materialIndex);
    return geometry;
  }

  /**
   * Copies another geometry's attributes, index, groups and draw range
   * @param source - The geometry to copy
   * @returns This geometry
   */
  public copy(source: BufferGeometry): this {
    this.name = source.name;
    for (const name in this._threeAttributes) this.deleteAttribute(name);
    for (const name in source._threeAttributes) this.setAttribute(name, source._threeAttributes[name].clone());
    this.setIndex(source._index ? source._index.clone() : null);
    this.groups = source.groups.map((group) => ({ ...group }));
    this.drawRange.start = source.drawRange.start;
    this.drawRange.count = source.drawRange.count;
    this.boundingBox = source.boundingBox?.clone() ?? null;
    this.boundingSphere = source.boundingSphere ? new Sphere().copy(source.boundingSphere) : null;
    this.userData = { ...source.userData };
    this._rebuildIndex();
    return this;
  }

  /** A new geometry with copies of this one's data */
  public clone(): BufferGeometry {
    return new BufferGeometry().copy(this);
  }

  /**
   * How the object holding the geometry draws it; `Points` and the lines set it when given the
   * geometry. A geometry drawn two ways at once takes the last.
   * @internal
   */
  public get _mode(): GeometryDrawMode {
    return this._drawMode;
  }

  public set _mode(value: GeometryDrawMode) {
    if (value === this._drawMode) return;
    this._drawMode = value;
    this.topology = value === 'triangles' || value === 'points' ? 'triangle-list' : 'line-list';
    this._rebuild();
  }

  /** Frees the geometry and the buffers it made, once */
  public dispose(): void {
    this.destroy(true);
  }

  public override destroy(destroyBuffers?: boolean): void {
    for (const name in this._threeAttributes) this._threeAttributes[name]._owners.delete(this);
    this._index?._owners.delete(this);
    this._pixiData.clear();
    super.destroy(destroyBuffers);
  }

  /** @internal */
  public _onAttributeUpdate(attribute: BufferAttribute): void {
    if (attribute === this._index) {
      this._rebuildIndex();
      this._repack();
      return;
    }
    const name = this._nameOf(attribute);
    const target = name ? PIXI_ATTRIBUTES[name] : undefined;
    if (!target) return;
    if (this._drawMode === 'points') {
      this._rebuild();
      return;
    }
    const pixi = this.attributes[target.name] as Attribute | undefined;
    if (!pixi || this.dynamic !== this._wantsDynamic()) {
      this._rebuild();
      return;
    }
    const data = this._dataFor(attribute, target);
    if (pixi.buffer.data !== data) pixi.buffer.data = data;
    else pixi.buffer.update();
    if (name === 'position') {
      this._updateBounds(data);
      this._rebuildIndex();
    }
    this._repack();
  }

  private _nameOf(attribute: BufferAttribute): string | undefined {
    for (const name in this._threeAttributes) if (this._threeAttributes[name] === attribute) return name;
    return undefined;
  }

  private _release(attribute: BufferAttribute): void {
    if (Object.values(this._threeAttributes).includes(attribute)) return;
    attribute._owners.delete(this);
    this._pixiData.delete(attribute);
  }

  private _wantsDynamic(): boolean {
    for (const name in this._threeAttributes) {
      if (this._threeAttributes[name].usage !== StaticDrawUsage) return true;
    }
    return false;
  }

  /** The floats pixi-3d draws for an attribute: three's own array when it fits, else a converted copy */
  private _dataFor(attribute: BufferAttribute, target: PixiAttributeTarget): Float32Array {
    if (sharesArray(attribute, target)) return attribute.array as Float32Array;
    const data = toFloats(attribute, target, this._pixiData.get(attribute));
    this._pixiData.set(attribute, data);
    return data;
  }

  /** Builds pixi-3d's attributes and index from three's, after the set of attributes changed */
  private _rebuild(): void {
    const internals = this as unknown as Geometry3DInternals;
    const pixiAttributes = this.attributes as Record<string, Attribute>;
    const previous = new Set(this.buffers);
    const buffers: Buffer[] = [];

    const points = this._drawMode === 'points' && this._threeAttributes.position ? this._pointQuads() : undefined;

    for (const name in PIXI_ATTRIBUTES) {
      const target = PIXI_ATTRIBUTES[name];
      const { name: pixiName, size, format } = target;
      const attribute = this._threeAttributes[name];
      let data: Float32Array | undefined;
      if (points) data = points[name];
      else if (attribute) data = this._dataFor(attribute, target);
      else if (name === 'position') data = EMPTY_POSITIONS;
      if (!data) {
        delete pixiAttributes[pixiName];
        continue;
      }
      const existing = pixiAttributes[pixiName] as Attribute | undefined;
      let buffer = existing?.buffer;
      if (!buffer || buffer.destroyed) {
        buffer = new Buffer({ data, label: `attribute-${name}`, usage: BufferUsage.VERTEX | BufferUsage.COPY_DST });
      } else if (buffer.data !== data) {
        buffer.data = data;
      }
      pixiAttributes[pixiName] = { buffer, format, stride: size * 4, offset: 0 };
      buffers.push(buffer);
    }

    this._updateBounds(pixiAttributes.aPosition.buffer.data as Float32Array);
    this._rebuildIndex(buffers);
    if (this.indexBuffer) buffers.push(this.indexBuffer);

    for (const buffer of previous) {
      if (buffers.includes(buffer)) continue;
      this._listen(buffer, false);
      buffer.destroy();
    }
    for (const buffer of buffers) {
      if (!previous.has(buffer)) this._listen(buffer, true);
    }
    this.buffers.length = 0;
    this.buffers.push(...buffers);

    internals._attributeKey = null;
    this.unload();
    internals.dynamic = this._wantsDynamic();
  }

  /**
   * Writes pixi-3d's index from three's, or counts the vertices when there is none, keeping only
   * the draw range
   * @param buffers - The geometry's buffers being rebuilt, when called from `_rebuild`
   */
  private _rebuildIndex(buffers?: Buffer[]): void {
    let data = this._indices();
    if (data instanceof Uint16Array && data.byteLength % 4 !== 0) data = new Uint32Array(data);

    if (this.indexBuffer && !this.indexBuffer.destroyed) {
      this.indexBuffer.data = data;
      return;
    }
    this.indexBuffer = new Buffer({ data, label: 'index-buffer', usage: BufferUsage.INDEX | BufferUsage.COPY_DST });
    if (!buffers) {
      this.buffers.push(this.indexBuffer);
      this._listen(this.indexBuffer, true);
    }
  }

  /** The draw range over three's index, or over the vertices without one */
  private _range(): { start: number; count: number; vertexCount: number } {
    const index = this._index;
    const vertexCount = this._threeAttributes.position ? this._threeAttributes.position.count : 3;
    const total = index ? index.count : vertexCount;
    const start = Math.min(Math.max(0, this.drawRange.start), total);
    const count = Math.max(0, Math.min(total - start, this.drawRange.count));
    return { start, count, vertexCount };
  }

  /** pixi-3d's index for the draw mode: the triangles, point quads, or line pairs, in the draw range */
  private _indices(): Uint16Array | Uint32Array {
    const index = this._index;
    const { start, count, vertexCount } = this._range();
    const at = (i: number): number => (index ? index.getX(start + i) : start + i);
    const mode = this._threeAttributes.position ? this._drawMode : 'triangles';
    const pairs = mode === 'lineSegments' ? count >> 1 : mode === 'lineStrip' ? Math.max(0, count - 1) : count;
    const length = mode === 'points' ? count * 6 : mode === 'triangles' ? count : pairs * 2;
    const large = (mode === 'points' ? count * 4 : vertexCount) > 65535;
    const data = large ? new Uint32Array(length) : new Uint16Array(length);

    if (mode === 'triangles') {
      for (let i = 0; i < count; i++) data[i] = at(i);
    } else if (mode === 'points') {
      for (let p = 0; p < count; p++) data.set([p * 4, p * 4 + 1, p * 4 + 2, p * 4, p * 4 + 2, p * 4 + 3], p * 6);
    } else if (mode === 'lineSegments') {
      for (let i = 0; i < pairs * 2; i++) data[i] = at(i);
    } else {
      for (let i = 0; i < pairs; i++) {
        data[i * 2] = at(i);
        data[i * 2 + 1] = at((i + 1) % count);
      }
    }
    return data;
  }

  /**
   * Each point in the draw range as four vertices at its position, with the quad's corner in `uv`,
   * for `PointsMaterial` to spread across the screen
   */
  private _pointQuads(): Partial<Record<string, Float32Array>> {
    const { position, color } = this._threeAttributes;
    const index = this._index;
    const { start, count } = this._range();
    const positions = new Float32Array(count * 12);
    const uvs = new Float32Array(count * 8);
    const colors = color ? new Float32Array(count * 16) : undefined;

    for (let p = 0; p < count; p++) {
      const vertex = index ? index.getX(start + p) : start + p;
      for (let corner = 0; corner < 4; corner++) {
        const v = p * 4 + corner;
        positions.set([position.getX(vertex), position.getY(vertex), position.getZ(vertex)], v * 3);
        uvs.set([POINT_CORNERS[corner * 2], POINT_CORNERS[corner * 2 + 1]], v * 2);
        if (colors && color) {
          for (let c = 0; c < 4; c++) colors[v * 4 + c] = c < color.itemSize ? color.getComponent(vertex, c) : 1;
        }
      }
    }
    return { position: positions, uv: uvs, color: colors };
  }

  /**
   * Starts or stops hearing a buffer's changes, as pixi's `Geometry` hears the buffers it adds
   * @param buffer - The buffer
   * @param listen - Whether to start
   */
  private _listen(buffer: Buffer, listen: boolean): void {
    // oxlint-disable-next-line typescript/unbound-method -- pixi's emitter calls it with the geometry as its context, as pixi's Geometry registers it
    const onUpdate = this.onBufferUpdate;
    if (listen) {
      buffer.on('update', onUpdate, this);
      buffer.on('change', onUpdate, this);
    } else {
      buffer.off('update', onUpdate, this);
      buffer.off('change', onUpdate, this);
    }
  }

  private _updateBounds(positions: Float32Array): void {
    this.bounds3D.copyFrom(computeBoundsFromPositions(positions));
    (this.boundsSphere as PixiSphere).setFromBox(this.bounds3D);
  }

  /** Packs the geometry into pixi-3d's shared buffers again on the next frame, unless it draws from its own */
  private _repack(): void {
    if (!this.dynamic) this.unload();
  }
}

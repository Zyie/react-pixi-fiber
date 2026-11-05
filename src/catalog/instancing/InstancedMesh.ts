import { BatchedMesh3D, Matrix4 as PixiMatrix4, RenderPassBit } from '@pixi/3d';
import type { BaseMaterial3D, Destroy3DOptions, Geometry3D, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import { placeholderGeometry, placeholderMaterial } from '../../compat/placeholders';
import { raycastGeometry } from '../../compat/Raycaster';
import type { Intersection, Raycaster } from '../../compat/Raycaster';
import { Box3 } from '../../math/Box3';
import type { Color } from '../../math/Color';
import type { Euler } from '../../math/Euler';
import { Sphere } from '../../math/Sphere';
import {
  INSTANCE_COLOR_FIELD,
  acquireInstanceColorMaterial,
  releaseInstanceColorMaterial,
} from './instanceColorMaterial';
import { InstancedBufferAttribute } from './InstancedBufferAttribute';

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const instanceLocal = new PixiMatrix4();
const instanceWorld = new PixiMatrix4();
const meshWorld = new PixiMatrix4();
const instanceSphere = new Sphere();
const instanceBox = new Box3();
const instanceHits: Intersection[] = [];

/**
 * three's `InstancedMesh` over pixi-3d's `BatchedMesh3D`: one geometry and one material drawn many
 * times in one draw, each instance placed by its own matrix and tinted by its own colour
 *
 * It takes three's arguments, `(geometry, material, count)`, and the r3f idiom
 * `<instancedMesh args={[null, null, count]}>` with the geometry and material as children.
 * Each instance is a slot of the batch. `setMatrixAt`, `getMatrixAt`, `setColorAt`, `getColorAt`,
 * `instanceMatrix`, `instanceColor`, `count`, `computeBoundingBox`, `computeBoundingSphere` and
 * picking with `instanceId` work as in three.
 *
 * What differs from three:
 * - `setMatrixAt` and `setColorAt` reach the batch straight away; `needsUpdate` is only needed after
 *   writing into `instanceMatrix.array` or `instanceColor.array` directly, as three needs it.
 * - `count` can only go down from the count the mesh was built with, as three's draws only as many
 *   as its buffers hold. A new count in `args` builds a new mesh.
 * - `frustumCulled` turns pixi-3d's culling of each instance on and off, where three culls the whole
 *   mesh by its bounding sphere. It is on by default, as in three; turn it off for a batch that
 *   always fits in view.
 * - Instance colours need a material that can be rebuilt with no arguments, as three's can, since
 *   the mesh draws with a copy of the material that multiplies in each instance's colour. The copy
 *   follows the material's values and textures; change `transparent` or `side` before the first
 *   colour is set.
 * - A material's `transparent` changed later doesn't move the instances between pixi-3d's passes;
 *   set the material again (`mesh.material = material`) after changing it.
 * @example
 * ```tsx
 * const matrix = new Matrix4();
 *
 * function Boxes({ count = 100 }) {
 *   const mesh = useRef<ElementRef<'instancedMesh'>>(null);
 *
 *   useLayoutEffect(() => {
 *     for (let i = 0; i < count; i++) mesh.current!.setMatrixAt(i, matrix.makeTranslation(i, 0, 0));
 *     mesh.current!.instanceMatrix.needsUpdate = true;
 *   }, [count]);
 *
 *   return (
 *     <instancedMesh ref={mesh} args={[null, null, count]}>
 *       <boxGeometry />
 *       <meshStandardMaterial />
 *     </instancedMesh>
 *   );
 * }
 * ```
 * @category catalog
 * @standard
 */
export class InstancedMesh extends BatchedMesh3D {
  /** Always `true`, as on three's `Mesh` */
  public readonly isMesh = true;
  /** Always `true`, as on three's `InstancedMesh` */
  public readonly isInstancedMesh = true;
  /** `'InstancedMesh'`, as in three */
  public override readonly type: string = 'InstancedMesh';
  /** Each instance's matrix, 16 numbers per instance; set `needsUpdate` after writing into its `array` */
  public readonly instanceMatrix: InstancedBufferAttribute;
  /** Always `null`: pixi-3d batches have no morph targets */
  public morphTexture: null = null;
  /** The box around every instance, once `computeBoundingBox` has worked it out */
  public boundingBox: Box3 | null = null;
  /** The sphere around every instance, once `computeBoundingSphere` has worked it out; picking works it out when it is `null` */
  public boundingSphere: Sphere | null = null;
  private _geometry: Geometry3D;
  private _material: BaseMaterial3D;
  private _drawMaterial: BaseMaterial3D;
  private _instanceColor: InstancedBufferAttribute | null = null;
  private _count: number;
  private _castShadow = false;
  private _receiveShadow = false;

  /**
   * @param geometry - The shape every instance draws; with `null` or none, a zero-size one until a child geometry attaches
   * @param material - How every instance is shaded; with `null` or none, white and unlit until a child material attaches
   * @param count - How many instances
   */
  constructor(geometry?: Geometry3D | null, material?: BaseMaterial3D | null, count = 1) {
    const slots = Math.max(1, count);

    super({ size: slots, instanceData: { [INSTANCE_COLOR_FIELD]: { value: [1, 1, 1, 1], type: 'vec4<f32>' } } });
    geometry ??= placeholderGeometry();
    material ??= placeholderMaterial();
    this.label = 'InstancedMesh';
    this._geometry = geometry;
    this._material = material;
    this._drawMaterial = material;
    this._count = count;

    const matrices = new Float32Array(count * 16);

    for (let i = 0; i < count; i++) matrices.set(IDENTITY, i * 16);
    this.instanceMatrix = new InstancedBufferAttribute(matrices, 16);
    this.instanceMatrix._onNeedsUpdate = () => this._uploadMatrices();

    for (let i = 0; i < slots; i++) {
      this.setGeometryAt(i, geometry);
      this.setMaterialAt(i, material);
      this.setVisibleAt(i, i < count);
    }
    this._uploadMatrices();
    this._applyPasses();
    this.cull = 'gpu';
  }

  /** The shape every instance draws */
  public get geometry(): Geometry3D {
    return this._geometry;
  }

  public set geometry(value: Geometry3D) {
    this._geometry = value;
    for (let i = 0; i < this.size; i++) this.setGeometryAt(i, value);
  }

  /** How every instance is shaded */
  public get material(): BaseMaterial3D {
    return this._material;
  }

  public set material(value: BaseMaterial3D) {
    if (this._instanceColor) releaseInstanceColorMaterial(this._material);
    this._material = value;
    this._applyMaterial();
  }

  /** How many instances draw and pick, up to the count the mesh was built with */
  public get count(): number {
    return this._count;
  }

  public set count(value: number) {
    this._count = Math.min(Math.max(0, Math.floor(value)), this.instanceMatrix.count);
    for (let i = 0; i < this.size; i++) this.setVisibleAt(i, i < this._count);
  }

  /** Each instance's colour, 3 numbers per instance in linear light, or `null` until `setColorAt` makes it */
  public get instanceColor(): InstancedBufferAttribute | null {
    return this._instanceColor;
  }

  public set instanceColor(value: InstancedBufferAttribute | null) {
    if (value === this._instanceColor) return;

    const previous = this._instanceColor;

    if (previous) previous._onNeedsUpdate = null;
    this._instanceColor = value;
    if (value) value._onNeedsUpdate = () => this._uploadColors();
    if (!previous !== !value) {
      if (previous) releaseInstanceColorMaterial(this._material);
      this._applyMaterial();
    }
    this._uploadColors();
  }

  /** Whether the instances cast shadows; off by default, as in three */
  public get castShadow(): boolean {
    return this._castShadow;
  }

  public set castShadow(value: boolean) {
    this._castShadow = value;
    this._applyPasses();
  }

  /** Whether the instances receive shadows; off by default, as in three */
  public get receiveShadow(): boolean {
    return this._receiveShadow;
  }

  public set receiveShadow(value: boolean) {
    this._receiveShadow = value;
    for (let i = 0; i < this.size; i++) {
      this.items[i].receiveShadow = value;
      this.invalidate(i);
    }
  }

  /** Whether pixi-3d may skip the instances outside the camera's view; on by default, as three's `frustumCulled` */
  public get frustumCulled(): boolean {
    return this.cull !== 'off';
  }

  public set frustumCulled(value: boolean) {
    this.cull = value ? 'gpu' : 'off';
  }

  /** Local rotation in radians, three's `Euler`: its `order` sets how the angles combine, and it stays in step with `quaternion` */
  public override get rotation(): Euler {
    return super.rotation as Euler;
  }

  public override set rotation(value: PointData3D) {
    super.rotation = value;
  }

  /**
   * Turns this node to face a point in world space, given as a vector or as three numbers
   * @param x - The point, or its x
   * @param y - The point's y
   * @param z - The point's z
   */
  public override lookAt(x: number | PointData3D, y?: number | PointData3D, z?: number): void {
    lookAtPoint(this, x, y, z);
  }

  /**
   * Places an instance, relative to the mesh
   * @param index - The instance
   * @param matrix - Its matrix; affine, as pixi-3d's batches take
   */
  public override setMatrixAt(index: number, matrix: PixiMatrix4): void {
    this.instanceMatrix.array.set(matrix.elements, index * 16);
    super.setMatrixAt(index, matrix);
  }

  /**
   * Reads an instance's matrix
   * @param index - The instance
   * @param matrix - Where its matrix goes
   */
  public getMatrixAt(index: number, matrix: PixiMatrix4): void {
    matrix.fromArray(this.instanceMatrix.array, index * 16);
  }

  /**
   * Tints an instance; the first call makes `instanceColor`, every instance white
   * @param index - The instance
   * @param color - Its colour
   */
  public setColorAt(index: number, color: Color): void {
    this.instanceColor ??= new InstancedBufferAttribute(new Float32Array(this.instanceMatrix.count * 3).fill(1), 3);
    color.toArray(this._instanceColor!.array as Float32Array, index * 3);
    this.setInstanceDataAt(index, INSTANCE_COLOR_FIELD, color.r, color.g, color.b, 1);
  }

  /**
   * Reads an instance's colour
   * @param index - The instance
   * @param color - Where its colour goes
   */
  public getColorAt(index: number, color: Color): void {
    color.fromArray(this._instanceColor!.array, index * 3);
  }

  /** Works out `boundingBox`, around the geometry's bounds at every instance */
  public computeBoundingBox(): void {
    this.boundingBox ??= new Box3();
    this.boundingBox.makeEmpty();
    for (let i = 0; i < this._count; i++) {
      this.getMatrixAt(i, instanceLocal);
      instanceBox.copy(this._geometry.bounds3D).applyMatrix4(instanceLocal);
      this.boundingBox.union(instanceBox);
    }
  }

  /** Works out `boundingSphere`, around the geometry's bounding sphere at every instance */
  public computeBoundingSphere(): void {
    this.boundingSphere ??= new Sphere();
    this.boundingSphere.makeEmpty();
    for (let i = 0; i < this._count; i++) {
      this.getMatrixAt(i, instanceLocal);
      instanceSphere.copy(this._geometry.boundsSphere).applyMatrix4(instanceLocal);
      this.boundingSphere.union(instanceSphere);
    }
  }

  /**
   * Adds a hit for every triangle of every instance the ray crosses, each with its `instanceId`, as
   * three's `InstancedMesh.raycast` does
   * @param raycaster - The ray
   * @param intersects - List the hits are added to
   */
  public override raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const world = this.getGlobalTransform(meshWorld);

    if (!this.boundingSphere) this.computeBoundingSphere();
    instanceSphere.copy(this.boundingSphere!).applyMatrix4(world);
    if (!raycaster.ray.intersectsSphere(instanceSphere)) return;

    for (let instanceId = 0; instanceId < this._count; instanceId++) {
      this.getMatrixAt(instanceId, instanceLocal);
      instanceWorld.multiplyMatrices(world, instanceLocal);
      raycastGeometry(this, this._geometry, this._material, instanceWorld, raycaster, instanceHits);
      for (const hit of instanceHits) {
        hit.instanceId = instanceId;
        intersects.push(hit);
      }
      instanceHits.length = 0;
    }
  }

  /**
   * Destroys the mesh and its batch, and the copy of the material instance colours drew with. The
   * geometry and material stay unless the options ask for them, as three's `dispose` leaves them.
   * @param options - pixi-3d's teardown flags
   */
  public override destroy(options?: Destroy3DOptions): void {
    if (this.destroyed) return;
    this.instanceMatrix._onNeedsUpdate = null;
    if (this._instanceColor) {
      this._instanceColor._onNeedsUpdate = null;
      releaseInstanceColorMaterial(this._material);
    }
    super.destroy(options);
  }

  /** Points every slot at the material, or at its instance colour copy when the mesh has colours */
  private _applyMaterial(): void {
    this._drawMaterial = (this._instanceColor && acquireInstanceColorMaterial(this._material)) || this._material;
    for (let i = 0; i < this.size; i++) this.setMaterialAt(i, this._drawMaterial);
    this._applyPasses();
  }

  /** Puts every slot in the passes its material draws in, as a mesh's `renderPassMask` does */
  private _applyPasses(): void {
    const passes = this._drawMaterial._passBit;
    const blended = (passes & (RenderPassBit.TRANSPARENT | RenderPassBit.TRANSMISSION)) !== 0;
    const mask = this._castShadow && !blended ? passes | RenderPassBit.SHADOW : passes;

    for (let i = 0; i < this.size; i++) this.setPassesAt(i, mask);
  }

  /** Copies `instanceMatrix` into the batch */
  private _uploadMatrices(): void {
    const { data, stride, offset } = this.matrices;
    const source = this.instanceMatrix.array;
    const count = Math.min(this.instanceMatrix.count, this.size);

    for (let i = 0; i < count; i++) {
      const row = offset + i * stride;
      for (let k = 0; k < 16; k++) data[row + k] = source[i * 16 + k];
    }
    if (count > 0) this.matrices.update(0, count);
  }

  /** Copies `instanceColor` into the batch's instance data, white where there is none */
  private _uploadColors(): void {
    const { data, stride, offset, fields } = this.instanceData;
    const colors = this._instanceColor;
    const known = colors ? Math.min(colors.count, this.size) : 0;

    for (let i = 0; i < this.size; i++) {
      const at = offset + i * stride + fields[INSTANCE_COLOR_FIELD];
      const from = i * 3;

      data[at] = i < known ? colors!.array[from] : 1;
      data[at + 1] = i < known ? colors!.array[from + 1] : 1;
      data[at + 2] = i < known ? colors!.array[from + 2] : 1;
      data[at + 3] = 1;
    }
    this.instanceData.update();
  }
}

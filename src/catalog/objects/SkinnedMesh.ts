import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

import { Matrix4 } from '../../math/Matrix4';
import { Mesh } from './Mesh';
import type { Skeleton } from './Skeleton';

/**
 * three's `SkinnedMesh`: a mesh that bends with a `Skeleton`, over pixi-3d's skinned `Mesh3D`
 *
 * Give it its skeleton before it joins the scene, as `bind` or the `skeleton` prop does, since
 * pixi-3d sets up skinning when a mesh is added to a view. It draws relative to its parent, so it
 * goes beside the root bone, as a glTF file and gltfjsx put it. `bindMatrix` and
 * `bindMatrixInverse` are kept for code that reads them; pixi-3d bakes the bind pose into the
 * skeleton.
 * @example
 * ```tsx
 * <group name="Armature">
 *   <primitive object={nodes.Hips} />
 *   <skinnedMesh geometry={nodes.Body.geometry} material={materials.Skin} skeleton={nodes.Body.skeleton} />
 * </group>
 * ```
 * @category catalog
 * @standard
 */
export class SkinnedMesh extends Mesh {
  /** Always `true`, as on three's `SkinnedMesh` */
  public readonly isSkinnedMesh = true;
  /** Always `'SkinnedMesh'`, as on three's `SkinnedMesh` */
  public readonly type: string = 'SkinnedMesh';
  /** `'attached'`, as three's default; kept */
  public bindMode: string = 'attached';
  /** The mesh's transform when it was bound */
  public readonly bindMatrix: Matrix4 = new Matrix4();
  /** The inverse of `bindMatrix` */
  public readonly bindMatrixInverse: Matrix4 = new Matrix4();

  /**
   * @param geometry - The shape, with joints and weights
   * @param material - How to shade it
   */
  constructor(geometry?: Geometry3D, material?: BaseMaterial3D) {
    super(geometry, material);
  }

  /**
   * Gives the mesh its skeleton, as three's `bind`
   * @param skeleton - The skeleton
   * @param bindMatrix - The mesh's transform at bind time; its world transform when omitted
   */
  public bind(skeleton: Skeleton, bindMatrix?: Matrix4): void {
    (this as { skeleton?: Skeleton }).skeleton = skeleton;
    this.bindMatrix.copy(bindMatrix ?? this.matrixWorld);
    this.bindMatrixInverse.copy(this.bindMatrix).invert();
  }

  /** Puts the skeleton's bones back in their bind pose */
  public pose(): void {
    (this.skeleton as Skeleton | undefined)?.pose();
  }

  /** Nothing to do: glTF's weights already add up to 1 */
  public normalizeSkinWeights(): void {}
}

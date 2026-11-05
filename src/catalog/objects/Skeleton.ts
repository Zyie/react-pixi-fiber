import { Skeleton as PixiSkeleton } from '@pixi/3d';
import type { Container3D, SkeletonOptions } from '@pixi/3d';

import { MathUtils } from '../../math/MathUtils';
import { Matrix4 } from '../../math/Matrix4';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';

const scratchMatrix = new Matrix4();
const scratchParent = new Matrix4();
const scratchPosition = new Vector3();
const scratchQuaternion = new Quaternion();
const scratchScale = new Vector3();

/**
 * pixi-3d's skeleton data for three's bones: the bones as its nodes, each after its parent, every
 * bone a joint in the order given
 */
function rigFor(bones: readonly Container3D[], boneInverses: readonly Matrix4[]): SkeletonOptions {
  const order: Container3D[] = [];
  const visit = (bone: Container3D): void => {
    if (order.includes(bone)) return;
    if (bone.parent && bones.includes(bone.parent)) visit(bone.parent);
    order.push(bone);
  };

  bones.forEach(visit);

  const inverseBindMatrices = new Float32Array(bones.length * 16);

  bones.forEach((bone, i) => {
    const inverse = boneInverses[i] ?? scratchMatrix.copy(bone.matrixWorld).invert();

    inverseBindMatrices.set(inverse.elements, i * 16);
  });

  return {
    parent: Int16Array.from(order, (bone) => order.indexOf(bone.parent!)),
    joints: Int16Array.from(bones, (bone) => order.indexOf(bone)),
    inverseBindMatrices,
    labels: order.map((bone) => bone.name),
  };
}

/**
 * three's `Skeleton` over pixi-3d's `Skeleton`: the bones a skinned mesh bends with, and their
 * inverse bind matrices
 *
 * Each bone is a node in the scene graph, and pixi-3d's skeleton follows it, so moving or animating
 * a bone bends the mesh as in three. `new Skeleton(bones, boneInverses)` takes three's arguments;
 * without inverses it works them out from where the bones are now, as three's does. `GLTFLoader`
 * passes pixi-3d's own skeleton data as the third argument, which also lists the nodes between the
 * joints. A skinned mesh draws relative to the bones' common parent, so keep it beside the root bone,
 * as glTF files and gltfjsx do.
 * @example
 * ```tsx
 * <skinnedMesh geometry={nodes.Body.geometry} material={materials.Skin} skeleton={nodes.Body.skeleton} />
 * ```
 * @category catalog
 * @standard
 */
export class Skeleton extends PixiSkeleton {
  /** A unique id, as three's */
  public readonly uuid: string = MathUtils.generateUUID();
  /** The bones, one per joint */
  public readonly bones: Container3D[];
  /** Each joint's inverse bind matrix, in the order of `bones` */
  public readonly boneInverses: Matrix4[];

  /**
   * @param bones - The bones, one per joint
   * @param boneInverses - Each bone's inverse bind matrix; worked out from the bones when omitted
   * @param rig - pixi-3d's skeleton data, when the joints have nodes between them that aren't bones
   * @param rigNodes - The node of each of the rig's nodes, which the skeleton follows
   */
  constructor(
    bones: Container3D[] = [],
    boneInverses: Matrix4[] = [],
    rig?: SkeletonOptions,
    rigNodes?: readonly Container3D[],
  ) {
    const options = rig ?? rigFor(bones, boneInverses);

    super(options);
    this.bones = bones;
    this.boneInverses = bones.map(
      (_, i) => boneInverses[i] ?? new Matrix4().fromArray(options.inverseBindMatrices, i * 16),
    );

    const nodes = rigNodes ?? options.labels?.map((_, i) => bones[options.joints.indexOf(i)]) ?? bones;

    nodes.forEach((node, i) => {
      if (node) this.bindContainerBone(i, node);
    });
  }

  /**
   * The bone of a name
   * @param name - The bone's name
   */
  public getBoneByName(name: string): Container3D | undefined {
    return this.bones.find((bone) => bone.name === name);
  }

  /** Works out `boneInverses` from where the bones are now */
  public calculateInverses(): void {
    this.bones.forEach((bone, i) => {
      this.boneInverses[i].copy(bone.matrixWorld).invert();
      this.inverseBindMatrices.set(this.boneInverses[i].elements, i * 16);
    });
    this.dirty = true;
  }

  /** Puts every bone back in its bind pose, the inverse of its inverse bind matrix */
  public pose(): void {
    this.bones.forEach((bone, i) => {
      scratchMatrix.copy(this.boneInverses[i]).invert();

      const parentIndex = this.bones.indexOf(bone.parent!);

      if (parentIndex !== -1) {
        scratchParent.copy(this.boneInverses[parentIndex]);
        scratchMatrix.premultiply(scratchParent);
      }

      scratchMatrix.decompose(scratchPosition, scratchQuaternion, scratchScale);
      bone.position.copyFrom(scratchPosition);
      bone.quaternion.copyFrom(scratchQuaternion);
      bone.scale.copyFrom(scratchScale);
    });
  }

  /** Nothing to do: pixi-3d works out the bone matrices when it draws */
  public update(): void {}

  /** A skeleton with the same bones and inverses */
  public clone(): Skeleton {
    return new Skeleton(
      this.bones,
      this.boneInverses.map((inverse) => inverse.clone()),
    );
  }

  /** Stops following the bones, as pixi-3d's `destroy` */
  public dispose(): void {
    this.destroy();
  }
}

import { Object3D } from './Object3D';

/**
 * three's `Bone`: a node a `Skeleton` follows
 *
 * `GLTFLoader` builds every joint of a skin as a bone in the scene graph, where three puts it, so
 * `nodes.Hips` is a node you can move, `<primitive>` into the tree or drive with an animation, and
 * the skinned mesh bends with it. A bone follows its `Skeleton` through pixi-3d's
 * `Skeleton.bindContainerBone`, which copies its local position, rotation and scale each frame.
 * @example
 * ```tsx
 * const { nodes } = useGraph(gltf.scene);
 * return <primitive object={nodes.Hips} />;
 * ```
 * @category catalog
 * @standard
 */
export class Bone extends Object3D {
  /** Always `true`, as on three's `Bone` */
  public readonly isBone = true;
  /** Always `'Bone'`, as on three's `Bone` */
  public readonly type: string = 'Bone';
}

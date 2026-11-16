import { Object3D } from './Object3D';

/**
 * three's `Group`: a node that groups its children
 * @example
 * ```tsx
 * <group position={[0, 1, 0]}>
 *   <mesh />
 * </group>
 * ```
 * @category catalog
 * @standard
 */
export class Group extends Object3D {
  /** Always `true`, as on three's `Group` */
  public readonly isGroup = true;
  /** Always `'Group'`, as on three's `Group` */
  public readonly type: string = 'Group';
}

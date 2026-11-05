import { Container3D } from '@pixi/3d';

/**
 * three's `Group`: a pixi-3d `Container3D` that groups its children
 * @example
 * ```tsx
 * <group position={[0, 1, 0]}>
 *   <mesh />
 * </group>
 * ```
 * @category catalog
 * @standard
 */
export class Group extends Container3D {
  /** Always `true`, as on three's `Group` */
  public readonly isGroup = true;
}

import { Container3D } from '@pixi/3d';

/**
 * A root's default scene, and the scene a `<View3D>` or a `<RenderTexture2D>` draws, while no package
 * registers its own: a pixi-3d `Container3D` with the two flags r3f's core reads, `isScene`, which
 * tells a scene from a portal's container, and `type`, which keeps a scene from being disposed
 * @category core
 * @advanced
 */
export class RootScene extends Container3D {
  /** Always `true`: r3f's core takes an object with it as a scene of its own */
  public readonly isScene = true;
  /** Always `'Scene'`: the dispose hook leaves a scene alone */
  public readonly type = 'Scene';
}

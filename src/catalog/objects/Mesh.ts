import { Mesh3D, Morph } from '@pixi/3d';
import type { BaseMaterial3D, Geometry3D, PointData3D } from '@pixi/3d';

import { lookAtPoint } from '../../compat/installObject3DSurface';
import { placeholderGeometry, placeholderMaterial } from '../../compat/placeholders';
import type { Euler } from '../../math/Euler';

/**
 * Gives a weights array the `fromArray` r3f's props call on an object with a `set` method, so
 * `morphTargetInfluences={[0.5, 0]}` copies into it as three's plain array takes it
 */
function settableWeights(weights: Float32Array): Float32Array {
  if (!('fromArray' in weights)) {
    Object.defineProperty(weights, 'fromArray', {
      value(this: Float32Array, values: ArrayLike<number>) {
        this.set(values);
      },
    });
  }

  return weights;
}

/**
 * three's `Mesh` over pixi-3d's `Mesh3D`, with three's positional constructor
 *
 * `<mesh>` is built with no arguments and gets its geometry and material from its children, as
 * in three. Until then it holds a zero-size geometry that draws nothing. Shadows start off, as in
 * three: set `castShadow` and `receiveShadow`.
 * @example
 * ```tsx
 * <mesh position={[0, 1, 0]} castShadow>
 *   <boxGeometry args={[1, 2, 3]} />
 *   <meshStandardMaterial color="hotpink" />
 * </mesh>
 * ```
 * @category catalog
 * @standard
 */
export class Mesh extends Mesh3D {
  /** Always `true`, as on three's `Mesh` */
  public readonly isMesh = true;
  /** Each morph target's index by name, as three's; a glTF mesh fills it from the file's target names */
  public morphTargetDictionary?: Record<string, number>;
  private _pendingInfluences?: ArrayLike<number>;

  /**
   * @param geometry - The shape to draw
   * @param material - How to shade it
   */
  constructor(geometry: Geometry3D = placeholderGeometry(), material: BaseMaterial3D = placeholderMaterial()) {
    super({ geometry, material, castShadow: false, receiveShadow: false });
    if (this.morph) settableWeights(this.morph.weights);
  }

  /** The shape it draws; a geometry with morph targets gives the mesh its `morphTargetInfluences` */
  public override get geometry(): Geometry3D {
    return super.geometry;
  }

  public override set geometry(value: Geometry3D) {
    super.geometry = value;
    this.updateMorphTargets();
  }

  /**
   * How much of each morph target shows, 0 to 1, as three's; pixi-3d's morph `weights`, a
   * `Float32Array` typed as three's array, so writing an entry, or an animation track on it, shows on
   * the next frame. `undefined` while the geometry has no morph targets.
   */
  public get morphTargetInfluences(): number[] | undefined {
    return this.morph?.weights as unknown as number[] | undefined;
  }

  public set morphTargetInfluences(value: ArrayLike<number> | undefined) {
    if (!value) return;
    if (this.morph) this.morph.weights.set(value);
    else this._pendingInfluences = value;
  }

  /** Gives the mesh morph weights for its geometry's morph targets, as three's `updateMorphTargets` */
  public updateMorphTargets(): void {
    const count = this.geometry?.morphTargetCount ?? 0;

    if (count === 0 || this.morph) return;

    const weights = settableWeights(new Float32Array(count));

    if (this._pendingInfluences) weights.set(this._pendingInfluences);
    this._pendingInfluences = undefined;
    (this as { morph?: Morph }).morph = new Morph(weights);
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
}

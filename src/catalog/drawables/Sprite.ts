import type { BaseMaterial3D } from '@pixi/3d';

import type { Intersection, Raycaster } from '../../compat/Raycaster';
import type { Vector2 } from '../../math/Vector2';
import { BufferGeometry, setGenerated } from '../geometries/BufferGeometry';
import { observedVector2 } from '../materials/textureSlots';
import { Drawable } from './Drawable';
import { raycastSprite } from './raycastDrawables';
import { SpriteMaterial } from './SpriteMaterial';

/** A sprite's unit quad, moved so `center` sits on the node's origin */
function quadFor(center: Vector2, geometry = new BufferGeometry()): BufferGeometry {
  const x = 0.5 - center.x;
  const y = 0.5 - center.y;
  setGenerated(
    geometry,
    [0, 1, 2, 0, 2, 3],
    [-0.5 + x, -0.5 + y, 0, 0.5 + x, -0.5 + y, 0, 0.5 + x, 0.5 + y, 0, -0.5 + x, 0.5 + y, 0],
    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    [0, 0, 1, 0, 1, 1, 0, 1],
  );
  return geometry;
}

/**
 * three's `Sprite`: a quad that always faces the camera, with a {@link SpriteMaterial}, over a
 * pixi-3d `Mesh3D` billboarded the way pixi-3d's `Sprite3D` is
 *
 * One unit across, sized by `scale`; `center` sets which point of it sits on the node's position.
 * The raycaster hits the quad as the raycaster's camera sees it.
 * @example
 * ```tsx
 * <sprite position={[0, 1, 0]} scale={[2, 2, 1]}>
 *   <spriteMaterial map={texture} />
 * </sprite>
 * ```
 * @category catalog
 * @standard
 */
export class Sprite extends Drawable {
  /** Always `true`, as on three's `Sprite` */
  public readonly isSprite = true;
  /** three's class name */
  public type = 'Sprite';
  private readonly _center: Vector2;

  /** @param material - How to draw the sprite */
  constructor(material: BaseMaterial3D = new SpriteMaterial()) {
    const center = observedVector2(0.5, 0.5, () => quadFor(center, this.geometry as BufferGeometry));
    super(quadFor(center), material, 'triangles');
    this._center = center;
    this.billboardMode = 'spherical';
  }

  /** Which point of the quad sits on the node's position: 0.5, 0.5 for its middle, 0, 0 for its bottom left */
  public get center(): Vector2 {
    return this._center;
  }

  public set center(value: Vector2 | [number, number]) {
    if (Array.isArray(value)) this._center.set(value[0], value[1]);
    else this._center.set(value.x, value.y);
  }

  /**
   * Adds a hit where the ray crosses the camera-facing quad
   * @param raycaster - The raycaster
   * @param intersects - List the hit is added to
   */
  public raycast(raycaster: Raycaster, intersects: Intersection[]): void {
    const rotation = this.material instanceof SpriteMaterial ? this.material.rotation : 0;
    raycastSprite(this, this._center, rotation, raycaster, intersects);
  }

  /** Frees the sprite and its quad, which no other node holds */
  public override destroy(): void {
    const quad = this.geometry;
    super.destroy();
    quad.destroy(true);
  }
}

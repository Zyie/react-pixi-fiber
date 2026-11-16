import { CubeGeometry, FlatMaterial } from '@pixi/3d';
import type { BaseMaterial3D, Geometry3D } from '@pixi/3d';

let geometry: Geometry3D | undefined;
let material: BaseMaterial3D | undefined;

/**
 * The geometry a mesh holds until r3f attaches one: a zero-size box, so it draws and picks nothing,
 * as three's empty `BufferGeometry` does
 *
 * pixi-3d's `Mesh3D` needs geometry when it is constructed, but r3f constructs `<mesh>` with no
 * arguments and attaches `<boxGeometry>` afterwards. One shared instance serves every mesh, and
 * nothing destroys it: `Mesh3D.destroy()` frees its geometry only when asked to.
 * @internal
 */
export function placeholderGeometry(): Geometry3D {
  return (geometry ??= new CubeGeometry({ width: 0, height: 0, depth: 0 }));
}

/**
 * The material a mesh holds until r3f attaches one: white and unlit, three's default
 * `MeshBasicMaterial`
 * @internal
 */
export function placeholderMaterial(): BaseMaterial3D {
  return (material ??= new FlatMaterial());
}

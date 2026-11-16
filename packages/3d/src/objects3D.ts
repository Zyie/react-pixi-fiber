import { BaseMaterial3D, Geometry3D } from '@pixi/3d';
import type { ObjectHooks } from '@react-fiber/core/extension';

/** What the dispose hook frees: a geometry or material, through its own `dispose` when it has one */
type Freeable = (Geometry3D | BaseMaterial3D) & { dispose?(): void };

/**
 * The renderer hooks of @pixi/3d's geometries and materials, which this package registers with core: a
 * geometry attaches as its mesh's `geometry` and a material as its `material`, and one r3f removes is
 * destroyed, through its `dispose` where a package gives it one. @pixi/3d's nodes are core's, since a
 * root's scene is one.
 * @internal
 */
export const objects3D: ObjectHooks = {
  test: (object) => object instanceof Geometry3D || object instanceof BaseMaterial3D,
  defaultAttach: (object) => (object instanceof Geometry3D ? 'geometry' : 'material'),
  dispose(object) {
    const freeable = object as Freeable;
    if (freeable.dispose) freeable.dispose();
    else freeable.destroy();
  },
};

import type { Container3D } from '@pixi/3d';

import { Object3D } from '../catalog/objects/Object3D';
import { PerspectiveCamera } from '../catalog/scene/PerspectiveCamera';
import type { PixiRenderer } from '../renderer/PixiRenderer';
import type { WebGLCubeRenderTarget } from './WebGLCubeRenderTarget';

/** Where each face camera looks and which way is up on it, in the order of the cube's faces */
const FACES: readonly (readonly [number, number, number, number, number, number])[] = [
  [1, 0, 0, 0, -1, 0],
  [-1, 0, 0, 0, -1, 0],
  [0, 1, 0, 0, 0, 1],
  [0, -1, 0, 0, 0, -1],
  [0, 0, 1, 0, -1, 0],
  [0, 0, -1, 0, -1, 0],
];

/**
 * three's `CubeCamera`: six cameras that draw a scene around a point into a {@link WebGLCubeRenderTarget}
 *
 * `update(renderer, scene)` draws each face, as three's does, so `renderTarget.texture` can light a
 * scene as its environment or be drawn behind it. Each face is drawn upside down, as three's
 * cameras draw them with a negative field of view, which is the way up a cube map's faces are stored.
 * @example
 * ```tsx
 * const target = useMemo(() => new WebGLCubeRenderTarget(256), []);
 * <cubeCamera ref={camera} args={[0.1, 100, target]} />;
 * useFrame(({ renderer, scene }) => camera.current.update(renderer, scene));
 * ```
 * @category catalog
 * @advanced
 */
export class CubeCamera extends Object3D {
  /** Always `'CubeCamera'` */
  public override readonly type: string = 'CubeCamera';
  /** The target the faces are drawn into */
  public renderTarget: WebGLCubeRenderTarget;
  /** The mip level of the target to draw into */
  public activeMipmapLevel: number = 0;

  private readonly _cameras: PerspectiveCamera[] = [];
  private _aimed = false;

  /**
   * @param near - Near clipping distance of every face
   * @param far - Far clipping distance of every face
   * @param renderTarget - The target to draw into
   */
  constructor(near: number, far: number, renderTarget: WebGLCubeRenderTarget) {
    super();
    this.renderTarget = renderTarget;
    for (let face = 0; face < 6; face++) {
      const camera = new PerspectiveCamera(90, 1, near, far);
      this._cameras.push(camera);
      this.addChild(camera);
    }
  }

  /**
   * Draws the six faces of `scene`, as seen from this camera, into `renderTarget`
   * @param renderer - The renderer to draw with
   * @param scene - The scene to draw
   */
  public update(renderer: PixiRenderer, scene: Container3D): void {
    if (!this._aimed) {
      this._aimed = true;
      for (let face = 0; face < 6; face++) {
        const [x, y, z, upX, upY, upZ] = FACES[face];
        const camera = this._cameras[face];
        this.removeChild(camera);
        camera.up.set(upX, upY, upZ);
        camera.lookAt(x, y, z);
        this.addChild(camera);
      }
    }
    const current = renderer.getRenderTarget();
    const currentFace = renderer.getActiveCubeFace();
    const currentMip = renderer.getActiveMipmapLevel();
    for (let face = 0; face < 6; face++) {
      renderer.setRenderTarget(this.renderTarget, face, this.activeMipmapLevel);
      renderer.render(scene, this._cameras[face]);
    }
    renderer.setRenderTarget(current, currentFace, currentMip);
  }
}

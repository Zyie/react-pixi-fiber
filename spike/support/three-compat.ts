/**
 * The three.js surface r3f's vendored core touches, provided on pixi-3d classes.
 *
 * Two layers:
 * 1. `installObject3DSurface()` patches pixi-3d prototypes so every Container3D (including nodes
 *    pixi-3d builds itself, e.g. glTF children passed to `<primitive>`) answers r3f's duck-typed
 *    checks: `isObject3D`, `add`/`remove`, `uuid`, `traverse`, `getWorldPosition`, `dispose`, and
 *    `isBufferGeometry`/`isMaterial` for auto-attach.
 * 2. Classes under three's names (Mesh, BoxGeometry, MeshStandardMaterial, PerspectiveCamera, ...)
 *    that map three's constructor signatures and field names onto pixi-3d.
 */
import {
  AmbientLight as PixiAmbientLight,
  BaseMaterial3D,
  Camera3D,
  Container3D,
  CubeGeometry,
  DirectionalLight as PixiDirectionalLight,
  FlatMaterial,
  Frustum as PixiFrustum,
  Geometry3D,
  Material3D,
  Matrix4,
  Mesh3D,
  PlaneGeometry as PixiPlaneGeometry,
  PointLight as PixiPointLight,
  Ray,
  SphereGeometry as PixiSphereGeometry,
  Vector2 as PixiVector2,
  Vector3 as PixiVector3,
  createHitResult3D,
  intersectRayGeometry,
} from '@pixi/3d';
import { Assets, type ColorSource, type Texture } from 'pixi.js';

type AnyFn = (...args: never[]) => unknown;

let installed = false;

export function installObject3DSurface(): void {
  if (installed) return;
  installed = true;

  const node = Container3D.prototype as unknown as Record<string, unknown>;
  Object.defineProperty(node, 'isObject3D', { value: true });
  Object.defineProperty(node, 'uuid', {
    get(this: Container3D) {
      return `pixi3d-${this.uid}`;
    },
  });
  node.add = function add(this: Container3D, ...objects: Container3D[]) {
    for (const object of objects) this.addChild(object);
    return this;
  };
  node.remove = function remove(this: Container3D, ...objects: Container3D[]) {
    for (const object of objects) this.removeChild(object);
    return this;
  };
  // r3f's insertBefore splices `parent.children` and sets `child.parent` itself, then dispatches
  // 'added'. That bypasses addChild, so finish addChild's bookkeeping here or the View3D never
  // attaches the node (it would be neither drawn nor pickable).
  node.dispatchEvent = function dispatchEvent(this: Container3D, event: { type: string }) {
    const parent = this.parent;
    if (event.type !== 'added' || !parent) return;
    this._worldTransformDirty = true;
    this._worldVisibleDirty = true;
    this.didChange = true;
    if (parent.view3d && this.view3d !== parent.view3d) parent.view3d._attach(this);
    parent.emit('childAdded', this, parent, parent.children.indexOf(this));
    this.emit('added', parent);
  };
  node.getWorldPosition = function getWorldPosition(this: Container3D, target: PixiVector3) {
    return this.getGlobalPosition(target);
  };
  const scratch = new Matrix4();
  node.updateWorldMatrix = function updateWorldMatrix(this: Container3D) {
    this.getGlobalTransform(scratch);
  };
  node.traverse = function traverse(this: Container3D, callback: (object: Container3D) => void) {
    callback(this);
    for (const child of this.children) (child as unknown as { traverse: AnyFn }).traverse(callback as never);
  };
  node.traverseAncestors = function traverseAncestors(this: Container3D, callback: (o: Container3D) => unknown) {
    for (let parent = this.parent; parent; parent = parent.parent) if (callback(parent) === false) return;
  };
  const lookAt = Container3D.prototype.lookAt;
  node.lookAt = function (this: Container3D, x: number | PixiVector3, y?: number, z?: number) {
    lookAt.call(this, typeof x === 'number' ? { x, y: y!, z: z! } : x);
  };
  node.dispose = function dispose(this: Container3D) {
    if (!this.destroyed) this.destroy();
  };

  const geometry = Geometry3D.prototype as unknown as Record<string, unknown>;
  Object.defineProperty(geometry, 'isBufferGeometry', { value: true });
  geometry.dispose = function dispose(this: Geometry3D) {
    if (!(this as unknown as { _destroyed: boolean })._destroyed) this.destroy();
  };

  const material = BaseMaterial3D.prototype as unknown as Record<string, unknown>;
  Object.defineProperty(material, 'isMaterial', { value: true });
  material.dispose = function dispose(this: BaseMaterial3D) {
    if (!this.destroyed) this.destroy();
  };

  // `new Mesh3D()` reads `options.geometry.morphTargetCount`; r3f constructs with no args and
  // attaches geometry/material afterwards, so give the bare constructor three's defaults.
  Mesh3D.defaultOptions.geometry ??= placeholderGeometry();
  Mesh3D.defaultOptions.material ??= placeholderMaterial();
}

let sharedGeometry: Geometry3D | undefined;
let sharedMaterial: BaseMaterial3D | undefined;
const placeholderGeometry = () => (sharedGeometry ??= new CubeGeometry());
const placeholderMaterial = () => (sharedMaterial ??= new Material3D());

//* Math ==============================

export class Vector3 extends PixiVector3 {
  readonly isVector3 = true;
  copy(v: { x: number; y: number; z: number }): this {
    return this.copyFrom(v);
  }
  unproject(camera: PerspectiveCamera): this {
    return this.applyMatrix4(new Matrix4().getInverse(camera.projection)).applyMatrix4(camera.worldTransform);
  }
}

export class Vector2 extends PixiVector2 {
  readonly isVector2 = true;
  copy(v: { x: number; y: number }): this {
    return this.copyFrom(v);
  }
}

export class Frustum extends PixiFrustum {}

export interface Intersection {
  distance: number;
  point: Vector3;
  object: Container3D;
  face: null;
  index: undefined;
  instanceId: undefined;
}

/** three's Raycaster over pixi-3d's per-triangle picking (`intersectRayGeometry`). */
export class Raycaster {
  ray = new Ray();
  camera: Camera3D | null | undefined = null;
  near = 0;
  far = Infinity;
  params = {};
  private readonly local = new Ray();
  private readonly world = new Matrix4();
  private readonly inverse = new Matrix4();
  private readonly hit = createHitResult3D();

  setFromCamera(ndc: { x: number; y: number }, camera: Camera3D): void {
    this.camera = camera;
    const view = camera.view3d;
    if (!view) return;
    view.screenToRay({ x: ((ndc.x + 1) / 2) * view.width, y: ((1 - ndc.y) / 2) * view.height }, this.ray);
  }

  intersectObject(object: Container3D, recursive = true, out: Intersection[] = []): Intersection[] {
    if (object instanceof Mesh3D) this.intersectMesh(object, out);
    if (recursive) for (const child of object.children) this.intersectObject(child, true, out);
    return out.sort((a, b) => a.distance - b.distance);
  }

  intersectObjects(objects: Container3D[], recursive = true, out: Intersection[] = []): Intersection[] {
    for (const object of objects) this.intersectObject(object, recursive, out);
    return out;
  }

  private intersectMesh(mesh: Mesh3D, out: Intersection[]): void {
    this.inverse.getInverse(mesh.getGlobalTransform(this.world));
    const { origin, direction } = this.ray;
    this.local.origin.copyFrom(origin).applyMatrix4(this.inverse);
    this.local.direction.copyFrom(direction).transformDirection(this.inverse);
    if (intersectRayGeometry(this.local, mesh.geometry, this.hit) < 0) return;
    const point = mesh.toGlobal(this.hit.point, new Vector3());
    const distance = point.distanceTo(origin);
    if (distance < this.near || distance > this.far) return;
    out.push({ distance, point, object: mesh, face: null, index: undefined, instanceId: undefined });
  }
}

//* Scene graph under three's names ==============================

export class Object3D extends Container3D {}
export class Group extends Container3D {}

export class Scene extends Container3D {
  readonly isScene = true;
  readonly type = 'Scene';
}

export class Mesh extends Mesh3D {
  readonly isMesh = true;
  constructor(geometry: Geometry3D = placeholderGeometry(), material: BaseMaterial3D = placeholderMaterial()) {
    super({ geometry, material });
  }
}

/**
 * pixi-3d rebuilds the projection from the view's aspect every frame, so `aspect` and
 * `updateProjectionMatrix` exist only for r3f's bookkeeping.
 */
export class PerspectiveCamera extends Camera3D {
  readonly isCamera = true;
  readonly isPerspectiveCamera = true;
  aspect: number;
  manual?: boolean;
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super({ fov, near, far });
    this.aspect = aspect;
  }
  updateProjectionMatrix(): void {}
  get projectionMatrix(): Matrix4 {
    return this.projection;
  }
  get matrixWorldInverse(): Matrix4 {
    return this.view;
  }
}

export class OrthographicCamera extends Camera3D {
  readonly isCamera = true;
  readonly isOrthographicCamera = true;
  left: number;
  right: number;
  top: number;
  bottom: number;
  manual?: boolean;
  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super({ mode: 'orthographic', near, far });
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
  }
  updateProjectionMatrix(): void {
    this.orthographicSize = (this.right - this.left) / 2;
  }
  get projectionMatrix(): Matrix4 {
    return this.projection;
  }
  get matrixWorldInverse(): Matrix4 {
    return this.view;
  }
}

//* Geometry: three's positional constructor args ==============================

export class BoxGeometry extends CubeGeometry {
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super({ width, height, depth, widthSegments, heightSegments, depthSegments });
  }
}

export class SphereGeometry extends PixiSphereGeometry {
  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    super({ radius, widthSegments, heightSegments });
  }
}

export class PlaneGeometry extends PixiPlaneGeometry {
  constructor(width = 1, height = 1) {
    super({ width, height });
  }
}

//* Materials: three's parameter names ==============================

interface StandardParams {
  color?: ColorSource;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}

export class MeshStandardMaterial extends Material3D {
  constructor({ color, roughness, metalness, opacity }: StandardParams = {}) {
    super({ baseColor: color, roughness: roughness ?? 1, metallic: metalness ?? 0, alpha: opacity });
  }
  // three's `color` is a Color object; this reads back a number, so `material.color.set()` won't work
  get color(): number {
    return this.baseColor;
  }
  set color(value: ColorSource) {
    this.baseColor = value;
  }
  get metalness(): number {
    return this.metallic;
  }
  set metalness(value: number) {
    this.metallic = value;
  }
}

/** three's unlit material maps to pixi-3d's FlatMaterial; `Material3D` with `lit = false` fails to compile on WebGL. */
export class MeshBasicMaterial extends FlatMaterial {
  constructor({ color, opacity }: StandardParams = {}) {
    super({ baseColor: color, alpha: opacity });
  }
  get color(): number {
    return this.baseColor;
  }
  set color(value: ColorSource) {
    this.baseColor = value;
  }
}

//* Lights: three's (color, intensity) ==============================

export class AmbientLight extends PixiAmbientLight {
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
  }
}

export class DirectionalLight extends PixiDirectionalLight {
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
  }
}

export class PointLight extends PixiPointLight {
  constructor(color: ColorSource = 0xffffff, intensity = 1) {
    super({ color, intensity });
  }
}

//* Loaders: three's Loader.loadAsync over pixi's Assets ==============================

export class TextureLoader {
  loadAsync(url: string): Promise<Texture> {
    return Assets.load<Texture>(url);
  }
}

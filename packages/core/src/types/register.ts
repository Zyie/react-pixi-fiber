import type { Camera3D, Container3D, Frustum, ObservableVector3, Ray, RaycastHit3D, Vector2, Vector3 } from '@pixi/3d';
import type { ColorSource, PointData, Texture } from 'pixi.js';

import type { RootRenderTarget, RootRenderTargetOptions } from '../defaults/RootRenderTarget';
import type { PixiRenderer } from '../renderer/PixiRenderer';

/**
 * What core calls on a raycaster: the root's, which pointer events set from the camera, and an
 * anchor's, which tests what hides it
 * @category types
 * @advanced
 */
export interface RaycasterLike {
  /** The ray it casts */
  ray: Ray;
  /** The camera it was last set from */
  camera?: Camera3D;
  /** Nearest distance a hit counts at */
  near: number;
  /** Farthest distance a hit counts at */
  far: number;
  /**
   * Points the ray from an origin along a direction
   * @param origin - Where the ray starts
   * @param direction - Its unit direction
   */
  set(origin: Vector3, direction: Vector3): void;
  /**
   * Points the ray from a camera through a point on screen
   * @param coords - The point, -1 to 1 on both axes
   * @param camera - The camera
   */
  setFromCamera(coords: PointData, camera: Camera3D): void;
  /**
   * The hits on an object, and on its descendants when `recursive`, nearest first
   * @param object - The object
   * @param recursive - Test its descendants too
   * @param target - A list to add the hits to
   */
  intersectObject(object: Container3D, recursive?: boolean, target?: Hit3D[]): Hit3D[];
}

/**
 * A hit on a 3D object, as core's event pipeline reads one: pixi-3d's `RaycastHit3D` (where in the
 * world and in the node's own space the ray hit, the surface normal, uv and triangle when the node is
 * picked per triangle), with the node hit as r3f's `object` rather than pixi's `target`, which an r3f
 * event uses for the pointer capture target
 * @category types
 * @advanced
 */
export interface Hit3D extends Omit<RaycastHit3D, 'target'> {
  /** The object hit */
  object: Container3D;
  /** The instance hit, on an instanced mesh */
  instanceId?: number;
  /** The point or segment hit, on points and lines */
  index?: number;
  /** The triangle hit, on a mesh */
  face?: object | null;
}

/**
 * The classes and types core's own types fall back to, @pixi/3d's and pixi.js's, while no package
 * registers its own in {@link Register}
 * @category types
 * @advanced
 */
export interface RegisterDefaults {
  /** The class of a root's default scene, and of the scene a bridge draws */
  Scene: typeof Container3D;
  /** The class of a root's default camera */
  PerspectiveCamera: typeof Camera3D;
  /** The class of a root's camera with `orthographic` */
  OrthographicCamera: typeof Camera3D;
  /** The cameras a root draws from */
  Camera: Camera3D;
  /** The class of a root's raycaster */
  Raycaster: new () => RaycasterLike;
  /** A raycaster's hit */
  Intersection: Hit3D;
  /** The class of `state.pointer` */
  Vector2: typeof Vector2;
  /** The class of a hit's `point` */
  Vector3: typeof Vector3;
  /** The class of `state.frustum` */
  Frustum: typeof Frustum;
  /** The class `useTexture` loads */
  Texture: typeof Texture;
  /** The class of the root's renderer */
  Renderer: typeof PixiRenderer;
  /** The class of what `useRenderTarget` makes */
  RenderTarget: typeof RootRenderTarget;
  /** The options `useRenderTarget` takes */
  RenderTargetOptions: RootRenderTargetOptions;
  /** What a colour prop takes besides a pixi `ColorSource` */
  ColorRepresentation: ColorSource;
  /** The class of a colour a colour prop holds */
  Color: never;
  /** The class of a node's `rotation` */
  Euler: typeof ObservableVector3;
  /** The axis orders of a `rotation` */
  EulerOrder: string;
  /** The classes JSX names resolve to */
  Catalog: Record<string, unknown>;
  /** The classes core builds its own objects from, which `getThree()` returns */
  Classes: Record<string, unknown>;
}

/**
 * The types a package registers over core's: the classes it gives a root (scene, camera, raycaster,
 * renderer) and what its math props take. It is empty in core, which then types a root with @pixi/3d's
 * classes ({@link RegisterDefaults}); `@react-fiber/threejs-compat` fills it with three's, so
 * `useThree().camera` is three's `PerspectiveCamera` wherever it is installed.
 * @example
 * ```ts
 * declare module '@react-fiber/core' {
 *   interface Register {
 *     Scene: typeof MyScene;
 *   }
 * }
 * ```
 * @category types
 * @advanced
 */
export interface Register {}

/**
 * What a package registered under a key of {@link Register}, or core's default
 * @category types
 * @advanced
 */
export type Registered<K extends keyof RegisterDefaults> = Register extends { [P in K]: infer T }
  ? T
  : RegisterDefaults[K];

/**
 * An instance of a class a package registered under a key of {@link Register}, or of core's default
 * @category types
 * @advanced
 */
export type RegisteredInstance<K extends keyof RegisterDefaults> = [Registered<K>] extends [never]
  ? never
  : Registered<K> extends abstract new (...args: never[]) => infer T
    ? T
    : Registered<K>;

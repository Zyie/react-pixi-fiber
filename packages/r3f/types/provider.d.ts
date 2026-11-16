import type * as ThreeLegacy from 'three'
import type * as ThreeWebGPU from 'three/webgpu'
import type { uniform, nodeObject } from 'three/tsl'
import type { DomEvent } from './events'

//* Renderer Support ==============================
// Core has no static imports from `three` or `three/webgpu`. Both are separate bundles built on one
// shared `three.core.js`, and there is no import that gives you the core alone -- so a core that
// statically imported either one would put that renderer into every app's eager graph. Instead each
// renderer is described by a *support* object, loaded when a root needs it, that carries the three
// namespace of its flavour plus the handful of renderer-specific classes core touches by name.

/** The Three.js namespace of either flavour. Classes in three's shared core are the same objects in both. */
export type ThreeNamespace = typeof ThreeLegacy | typeof ThreeWebGPU

/**
 * Three's shared core: every export `three` and `three/webgpu` have in common (`Vector3`, `Scene`,
 * `Mesh`, the constants, ...). This is what core code reads from `getThree()`. The renderer-specific
 * exports are reached through the flavour's support object, never by name from here.
 */
export type ThreeCore = Pick<typeof ThreeLegacy, Extract<keyof typeof ThreeLegacy, keyof typeof ThreeWebGPU>>

/** Node classes and TSL functions the occlusion observer is built from (WebGPU only). */
export interface OcclusionSupport {
  Node: typeof ThreeWebGPU.Node
  NodeUpdateType: typeof ThreeWebGPU.NodeUpdateType
  MeshBasicNodeMaterial: typeof ThreeWebGPU.MeshBasicNodeMaterial
  uniform: typeof uniform
  nodeObject: typeof nodeObject
}

//* Renderer Hooks ==============================
// Core keeps React's tree, props, events and the frame loop. Where it used to reach into three's
// objects -- joining a child to its parent, picking which objects take events, casting a ray,
// ordering two hits, freeing an object -- it asks the root's support instead. three's supports
// answer with what core did before (src/support/threeHooks.ts); another renderer answers for its
// own objects.

/** A hit as core dedupes and bubbles it. three's `Intersection` is one. */
export interface Hit {
  object: object
  index?: number
  instanceId?: number
}

/** What core asks a renderer about the objects it draws. Each hook is called with the root's support. */
export interface RendererHooks {
  /** Adds `child` to `parent`, or moves it there, before `before` when given (an insert or a keyed move). */
  add(parent: object, child: object, before?: object): void
  /** Takes `child` out of `parent`. */
  remove(parent: object, child: object): void
  /** Whether an object is a node of the scene graph: core adds it to its parent, hides it and gives it events. */
  isInteractive(object: object): boolean
  /** Where an element without `attach` attaches to its parent's object, or `undefined` to be added as a child. */
  defaultAttach(object: object): string | undefined
  /**
   * Writes `value` at `key` of `object` when the renderer handles that key itself, such as a method that
   * is also a prop or a slot of a list it keeps, and returns whether it did; core then skips its own
   * write. Core asks for each prop it applies, with the key as written, for each prop an update removes,
   * with `undefined`, before it resets the prop to a fresh instance's value, and for each string `attach`:
   * with the child's object to attach it, and with the value it replaced to detach it.
   */
  applyProp(object: object, key: string, value: unknown): boolean
  /**
   * The hits of a pointer event on an object and its descendants, cast with `state.raycaster`. `state`
   * is the root state of the object, which each renderer types as its own (three's: `RootState`).
   */
  hitTest(object: object, event: DomEvent, state: object): Hit[]
  /** Orders two hits, nearest first, after `interactivePriority` and the roots' event priority. */
  compareHits(a: Hit, b: Hit): number
  /** Frees an object core removed, unless it is a primitive or under `dispose={null}`. */
  dispose(object: object): void
}

/**
 * What a renderer gives core: the classes core builds its own objects from, the JSX catalog, the
 * renderer class and the hooks. `kind` is open: three's supports below are `'webgl'` and `'webgpu'`,
 * and a support for another renderer names its own.
 */
export interface RendererSupport extends RendererHooks {
  kind: string
  /** The classes and constants core builds its own objects from: raycaster, default scene and camera, pointer, frustum. */
  three: object
  /** The constructors JSX element names resolve to, after `extend()` registrations. */
  catalog: object
  Renderer: new (parameters: any) => object
}

/** WebGL renderer support: the `three` namespace and the classes only it exports. */
export interface WebGLSupport extends RendererSupport {
  kind: 'webgl'
  /** `import * as THREE from 'three'`: JSX constructors for roots on this renderer, and core's classes. */
  three: typeof ThreeLegacy
  catalog: typeof ThreeLegacy
  Renderer: typeof ThreeLegacy.WebGLRenderer
  /** Render target for `useRenderTarget`. */
  RenderTarget: typeof ThreeLegacy.WebGLRenderTarget
  /** Cube render target for `<Environment>`. */
  CubeRenderTarget: typeof ThreeLegacy.WebGLCubeRenderTarget
}

/** WebGPU renderer support: the `three/webgpu` namespace and the classes only it exports. */
export interface WebGPUSupport extends RendererSupport {
  kind: 'webgpu'
  /** `import * as THREE from 'three/webgpu'`: JSX constructors (node materials included) and core's classes. */
  three: typeof ThreeWebGPU
  catalog: typeof ThreeWebGPU
  Renderer: typeof ThreeWebGPU.WebGPURenderer
  /** Render target for `useRenderTarget`. */
  RenderTarget: typeof ThreeWebGPU.RenderTarget
  /** Cube render target for `<Environment>`. */
  CubeRenderTarget: typeof ThreeWebGPU.CubeRenderTarget
  /** Canvas target for secondary canvases sharing a primary's renderer. */
  CanvasTarget: typeof ThreeWebGPU.CanvasTarget
  occlusion: OcclusionSupport
}

/**
 * What an entry point hands to `createRoot`/`Canvas`: a loader per renderer it can construct.
 *
 * The root entry provides both as dynamic imports, so an app downloads only the renderer its
 * Canvas asks for. `/legacy` and `/webgpu` provide one each, statically, for apps that would rather
 * have no extra request than the choice. Another renderer's support goes in `webgpu`, the path that
 * awaits the renderer's `init()`.
 */
export interface RendererProvider {
  webgl?: () => RendererSupport | Promise<RendererSupport>
  webgpu?: () => RendererSupport | Promise<RendererSupport>
}

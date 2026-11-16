import { BaseMaterial3D } from '@pixi/3d';
import type { BLEND_MODES } from 'pixi.js';

import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  FrontSide,
  LessEqualDepth,
  MultiplyBlending,
  NoBlending,
  NormalBlending,
} from '../catalog/constants';
import { MathUtils } from '../math/MathUtils';

/**
 * three's `Material` fields and methods that every pixi-3d material has once a root has loaded the
 * support, the catalog's materials and a glTF model's alike
 *
 * `side`, `transparent`, `opacity`, `alphaTest`, `depthTest`, `depthWrite`, `blending`, `visible` and
 * `toneMapped` drive pixi-3d's render state and shader as in three, and can change at any time.
 * `needsUpdate` rebuilds the shaders of the meshes drawing the material, which is how a change to
 * pixi-3d's own `flatShading`, `vertexColors` or `fog` reaches them; the catalog's materials do that
 * by themselves. The rest are kept for three's shape and change nothing: `shadowSide`, `alphaHash`,
 * `alphaToCoverage`, `depthFunc`, `colorWrite`, `premultipliedAlpha`, `dithering`, `forceSinglePass`,
 * `precision`, the custom blend factors, `clippingPlanes` and the stencil settings.
 *
 * A transparent `DoubleSide` material draws in one pass, in triangle order, as with three's
 * `forceSinglePass`: three draws its back faces first and its front faces over them, so where a
 * back face comes later in the index buffer pixi-3d blends it over the front.
 * @category compat
 * @advanced
 */
export interface MaterialMembers {
  /** A number unique to this material, pixi-3d's `uid` */
  readonly id: number;
  /** A UUID unique to this material, made on first read */
  uuid: string;
  /** A name of your choosing */
  name: string;
  /** Your own data */
  userData: Record<string, unknown>;
  /** Counts the times `needsUpdate` was set */
  readonly version: number;
  /** Set it to `true` to rebuild the shaders of the meshes drawing the material */
  needsUpdate: boolean;
  /** Which faces are drawn: `FrontSide`, `BackSide` or `DoubleSide` */
  side: number;
  /** Kept for three's shape */
  shadowSide: number | null;
  /** Whether it blends with what is behind, using `opacity`; pixi-3d's `alphaMode: 'blend'` */
  transparent: boolean;
  /** 0 for clear, 1 for solid; pixi-3d's `alpha` */
  opacity: number;
  /** Fragments with less alpha than this are discarded; 0 discards none. pixi-3d's `alphaMode: 'mask'` */
  alphaTest: number;
  /** Kept for three's shape */
  alphaHash: boolean;
  /** Kept for three's shape */
  alphaToCoverage: boolean;
  /** Whether it is hidden behind nearer surfaces */
  depthTest: boolean;
  /** Whether it hides farther surfaces drawn after it; stays on for a transparent material, as in three */
  depthWrite: boolean;
  /** Kept for three's shape: pixi-3d always tests less-or-equal */
  depthFunc: number;
  /** Kept for three's shape */
  colorWrite: boolean;
  /**
   * How it blends: `NormalBlending` (when transparent), `NoBlending`, `AdditiveBlending` or
   * `MultiplyBlending`; `SubtractiveBlending` and `CustomBlending` keep pixi-3d's state as it is
   */
  blending: number;
  /** Kept for three's shape */
  blendSrc: number;
  /** Kept for three's shape */
  blendDst: number;
  /** Kept for three's shape */
  blendEquation: number;
  /** Kept for three's shape */
  premultipliedAlpha: boolean;
  /** Kept for three's shape */
  dithering: boolean;
  /** Kept for three's shape: a transparent `DoubleSide` material always draws in one pass */
  forceSinglePass: boolean;
  /** Pushes its depth back to avoid z-fighting, by `polygonOffsetFactor` */
  polygonOffset: boolean;
  /** How far `polygonOffset` pushes, in pixi's polygon offset units */
  polygonOffsetFactor: number;
  /** Kept for three's shape: pixi takes one polygon offset value, `polygonOffsetFactor` */
  polygonOffsetUnits: number;
  /** Kept for three's shape */
  precision: string | null;
  /** Kept for three's shape */
  clippingPlanes: unknown[] | null;
  /** Kept for three's shape */
  stencilWrite: boolean;
  /** Whether meshes drawing it are drawn */
  visible: boolean;
  /**
   * Whether the renderer's tone curve applies; off, the colour takes the output encode alone, and no
   * fog. pixi-3d's `_skipsToneCurve`, inverted
   */
  toneMapped: boolean;
  /**
   * Sets several fields at once, as three's constructors take them
   * @param values - Field names and values
   */
  setValues(values?: Record<string, unknown>): void;
}

declare module '@pixi/3d' {
  interface BaseMaterial3D extends MaterialMembers {}
}

/** three's settings behind a material's pixi-3d state, which pixi-3d's own fields can't hold */
interface ThreeMaterialState {
  side: number;
  transparent: boolean;
  opacity: number;
  alphaTest: number;
  depthWrite: boolean;
  blending: number;
  visible: boolean;
  polygonOffset: boolean;
  polygonOffsetFactor: number;
  version: number;
}

/** The pixi-3d internals the surface writes */
interface MaterialInternals {
  doubleSided: boolean;
  _invalidateDescriptor(): void;
  _meshes: { items: readonly { _view3d: { _invalidateDrawCaches(): void } | null }[] };
}

const states = new WeakMap<BaseMaterial3D, ThreeMaterialState>();

const BLEND_MODES_BY_BLENDING: Partial<Record<number, BLEND_MODES>> = {
  [AdditiveBlending]: 'add',
  [MultiplyBlending]: 'multiply',
};

/**
 * three's settings of a material, read from its pixi-3d state the first time, so a glTF material
 * reads as three's GLTFLoader would build it
 * @param material - The material
 * @internal
 */
export function threeState(material: BaseMaterial3D): ThreeMaterialState {
  let state = states.get(material);
  if (!state) {
    state = {
      side: material.doubleSided ? DoubleSide : FrontSide,
      transparent: material.alphaMode === 'blend',
      opacity: material.alpha,
      alphaTest: material.alphaMode === 'mask' ? material.alphaCutoff : 0,
      depthWrite: material.state.depthMask,
      blending: NormalBlending,
      visible: true,
      polygonOffset: false,
      polygonOffsetFactor: 0,
      version: 0,
    };
    states.set(material, state);
  }
  return state;
}

/**
 * Rebuilds the shaders and draws of the meshes drawing a material
 *
 * pixi-3d rebuilds the meshes' shaders and pass entries, but its default passes keep replaying the
 * draws they recorded with the old shader and state, so each view drawing the material re-records
 * its draws too, on the next frame.
 * @param material - The material
 * @internal
 */
export function invalidateMaterial(material: BaseMaterial3D): void {
  const internals = material as unknown as MaterialInternals;
  internals._invalidateDescriptor();
  const meshes = internals._meshes.items;
  for (let i = 0; i < meshes.length; i++) {
    const view = meshes[i]._view3d;
    if (view && (i === 0 || meshes[i - 1]._view3d !== view)) view._invalidateDrawCaches();
  }
}

/**
 * Puts three's alpha, depth and blend settings on pixi-3d's: an invisible material discards every
 * fragment, a transparent one blends, one with an `alphaTest` discards below it. An opaque material
 * ignores `opacity`, as three's does; pixi-3d would still scale its colour by it.
 */
function applyAlpha(material: BaseMaterial3D): void {
  const three = threeState(material);
  const state = material.state;

  if (!three.visible) {
    material.alphaMode = 'mask';
    material.alphaCutoff = 0.5;
    material.alpha = 0;
    return;
  }

  material.alpha = three.transparent || three.alphaTest > 0 ? three.opacity : 1;
  material.alphaMode = three.transparent ? 'blend' : three.alphaTest > 0 ? 'mask' : 'opaque';
  if (three.alphaTest > 0) material.alphaCutoff = three.alphaTest;
  state.depthMask = three.depthWrite;

  if (three.blending === NoBlending) {
    state.blend = false;
  } else if (three.blending === NormalBlending) {
    state.blendMode = 'normal';
    state.blend = three.transparent;
  } else if (BLEND_MODES_BY_BLENDING[three.blending]) {
    state.blendMode = BLEND_MODES_BY_BLENDING[three.blending]!;
  }
  state.polygonOffset = three.polygonOffset ? three.polygonOffsetFactor : 0;
}

/**
 * A field kept in three's settings that changes pixi-3d's state when set; the meshes' draws are
 * recorded again, since WebGPU bakes the state into them
 * @param key - The field
 */
function stateField<K extends keyof ThreeMaterialState>(key: K): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: true,
    get(this: BaseMaterial3D) {
      return threeState(this)[key];
    },
    set(this: BaseMaterial3D, value: ThreeMaterialState[K]) {
      const three = threeState(this);
      if (three[key] === value) return;
      three[key] = value;
      applyAlpha(this);
      invalidateMaterial(this);
    },
  };
}

/** A field three has that changes nothing here, with three's default */
const inert = (value: unknown): PropertyDescriptor => ({ configurable: true, writable: true, value });

const members: PropertyDescriptorMap = {
  id: {
    configurable: true,
    get(this: BaseMaterial3D) {
      return this.uid;
    },
  },
  uuid: {
    configurable: true,
    get(this: BaseMaterial3D) {
      const uuid = MathUtils.generateUUID();
      Object.defineProperty(this, 'uuid', { configurable: true, writable: true, enumerable: true, value: uuid });
      return uuid;
    },
    set(this: BaseMaterial3D, value: string) {
      Object.defineProperty(this, 'uuid', { configurable: true, writable: true, enumerable: true, value });
    },
  },
  name: inert(''),
  userData: {
    configurable: true,
    get(this: BaseMaterial3D) {
      const userData = {};
      Object.defineProperty(this, 'userData', {
        configurable: true,
        writable: true,
        enumerable: true,
        value: userData,
      });
      return userData;
    },
    set(this: BaseMaterial3D, value: Record<string, unknown>) {
      Object.defineProperty(this, 'userData', { configurable: true, writable: true, enumerable: true, value });
    },
  },
  version: {
    configurable: true,
    get(this: BaseMaterial3D) {
      return threeState(this).version;
    },
  },
  needsUpdate: {
    configurable: true,
    set(this: BaseMaterial3D, value: boolean) {
      if (value !== true) return;
      threeState(this).version++;
      invalidateMaterial(this);
    },
  },
  side: {
    configurable: true,
    enumerable: true,
    get(this: BaseMaterial3D) {
      return threeState(this).side;
    },
    set(this: BaseMaterial3D, value: number) {
      const three = threeState(this);
      if (three.side === value) return;
      three.side = value;
      (this as unknown as MaterialInternals).doubleSided = value === DoubleSide;
      this.state.culling = value !== DoubleSide;
      this.state.clockwiseFrontFace = value === BackSide;
      invalidateMaterial(this);
    },
  },
  transparent: stateField('transparent'),
  opacity: stateField('opacity'),
  alphaTest: stateField('alphaTest'),
  depthWrite: stateField('depthWrite'),
  blending: stateField('blending'),
  visible: stateField('visible'),
  polygonOffset: stateField('polygonOffset'),
  polygonOffsetFactor: stateField('polygonOffsetFactor'),
  depthTest: {
    configurable: true,
    enumerable: true,
    get(this: BaseMaterial3D) {
      return this.state.depthTest;
    },
    set(this: BaseMaterial3D, value: boolean) {
      if (this.state.depthTest === value) return;
      this.state.depthTest = value;
      invalidateMaterial(this);
    },
  },
  toneMapped: {
    configurable: true,
    enumerable: true,
    get(this: BaseMaterial3D) {
      return !this._skipsToneCurve;
    },
    set(this: BaseMaterial3D, value: boolean) {
      if (this._skipsToneCurve === !value) return;
      this._skipsToneCurve = !value;
      invalidateMaterial(this);
    },
  },
  polygonOffsetUnits: inert(0),
  shadowSide: inert(null),
  alphaHash: inert(false),
  alphaToCoverage: inert(false),
  depthFunc: inert(LessEqualDepth),
  colorWrite: inert(true),
  blendSrc: inert(204),
  blendDst: inert(205),
  blendEquation: inert(100),
  premultipliedAlpha: inert(false),
  dithering: inert(false),
  forceSinglePass: inert(false),
  precision: inert(null),
  clippingPlanes: inert(null),
  stencilWrite: inert(false),
  setValues: inert(function setValues(this: BaseMaterial3D, values?: Record<string, unknown>) {
    if (!values) return;
    for (const key in values) {
      const value = values[key];
      if (value !== undefined) (this as unknown as Record<string, unknown>)[key] = value;
    }
  }),
};

let installed = false;

/**
 * Gives every pixi-3d material three's `Material` fields ({@link MaterialMembers}), once. The support
 * calls it with the rest of the three.js surface, and so does the first catalog material built, since
 * three code often builds materials at module scope, before any root has loaded the support.
 * @internal
 */
export function installMaterialSurface(): void {
  if (installed) return;
  installed = true;
  Object.defineProperties(BaseMaterial3D.prototype, members);
}

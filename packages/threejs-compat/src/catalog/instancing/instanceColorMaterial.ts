import { ShaderDescriptor } from '@pixi/3d';
import type { BaseMaterial3D, ShaderBit, View3D } from '@pixi/3d';

/** The batch's instance-data field that holds each instance's colour, in linear light */
export const INSTANCE_COLOR_FIELD = 'instanceColor';

/**
 * Multiplies the base colour by the instance's colour, as three's `USE_INSTANCING_COLOR` does. It goes
 * ahead of the material's own bits, so a lit material mixes its reflectance toward the tinted colour.
 */
const instanceColorBit: ShaderBit = {
  name: 'r3fInstanceColor',
  bindings: { instance: { [INSTANCE_COLOR_FIELD]: 'vec4<f32>' } },
  gpu: { fragment: { material: `albedo *= instance.${INSTANCE_COLOR_FIELD}.rgb;` } },
  gl: { fragment: { material: `albedo *= instance.${INSTANCE_COLOR_FIELD}.rgb;` } },
};

const tintedDescriptors = new WeakMap<ShaderDescriptor, ShaderDescriptor>();

/**
 * A material's descriptor with the instance colour bit in front of its bits
 * @param descriptor - The material's descriptor
 */
function withInstanceColor(descriptor: ShaderDescriptor): ShaderDescriptor {
  let tinted = tintedDescriptors.get(descriptor);

  if (!tinted) {
    tinted = new ShaderDescriptor({
      bitsGpu: [instanceColorBit, ...descriptor.bitsGpu],
      bitsGl: [instanceColorBit, ...descriptor.bitsGl],
      template: descriptor.template,
      overrides: descriptor.overrides,
      includeGlobal: descriptor.includeGlobal,
      includeCamera: descriptor.includeCamera,
    });
    tintedDescriptors.set(descriptor, tinted);
  }

  return tinted;
}

type MaterialClass = new () => BaseMaterial3D;

const twinClasses = new WeakMap<MaterialClass, MaterialClass>();

/**
 * The class of a material's twins: the material's own class, with the instance colour bit added to
 * every descriptor it compiles
 * @param source - The material
 */
function twinClassOf(source: BaseMaterial3D): MaterialClass {
  const Source = source.constructor as MaterialClass;
  let Twin = twinClasses.get(Source);

  if (!Twin) {
    Twin = class extends Source {
      public override getPrimaryDescriptor(view: View3D): ShaderDescriptor {
        return withInstanceColor(super.getPrimaryDescriptor(view));
      }
    };
    twinClasses.set(Source, Twin);
  }

  return Twin;
}

/** A twin and how many instanced meshes draw with it */
interface TwinRecord {
  twin: BaseMaterial3D;
  users: number;
}

const records = new WeakMap<BaseMaterial3D, TwinRecord>();

type Writable = Record<string, unknown>;

/**
 * Whether assigning `key` on `target` takes: a data field, or an accessor with a setter
 * @param target - The object
 * @param key - The property
 */
function canWrite(target: object, key: string): boolean {
  for (let owner: object | null = target; owner; owner = Object.getPrototypeOf(owner) as object | null) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    if (descriptor) return descriptor.writable === true || descriptor.set !== undefined;
  }

  return true;
}

/** The settings copied onto a twin besides its data and textures; the read-only ones are set before it first draws */
const SETTINGS = [
  'alphaMode',
  'alphaCutoff',
  'toneMapped',
  'vertexColors',
  'doubleSided',
  'flatShading',
  'fog',
  'side',
];

/**
 * Copies a material's values, textures and settings onto its twin
 * @param source - The material
 * @param twin - Its twin
 */
function copyInto(source: BaseMaterial3D, twin: BaseMaterial3D): void {
  twin.data._f32.set(source.data._f32);
  twin.update();

  for (let i = 0; i < source._textures.length; i++) {
    if (twin._textures[i] !== source._textures[i]) twin._setTextureSlot(i, source._textures[i]);
  }

  for (const key of SETTINGS) {
    const value = (source as unknown as Writable)[key];

    if (value === undefined || (twin as unknown as Writable)[key] === value || !canWrite(twin, key)) continue;
    (twin as unknown as Writable)[key] = value;
  }

  twin.state.culling = source.state.culling;
}

/**
 * The material an instanced mesh draws with once it has instance colours: a twin of `source`, of the
 * same class and kept in step with it, whose shader multiplies in each instance's colour. pixi-3d fixes
 * a material's shader bits when it is built, and a bit that reads instance data can only draw in a
 * batch, so the colour can't go on `source` itself, which plain meshes may share.
 *
 * The twin copies `source`'s values whenever `source` queues an upload (any colour, number or
 * other value it keeps in its data) and whenever a texture of `source` changes. A change to
 * `alphaMode` or another setting after that reaches the twin with the next such change.
 * @param source - The material the mesh was given
 * @returns The twin, or `null` when one can't stand in for `source`: its class builds a different
 * shader layout when made with no arguments
 * @internal
 */
export function acquireInstanceColorMaterial(source: BaseMaterial3D): BaseMaterial3D | null {
  const existing = records.get(source);

  if (existing) {
    existing.users++;
    return existing.twin;
  }

  const twin = new (twinClassOf(source))();

  if (
    twin._materialStructSnapshot !== source._materialStructSnapshot ||
    twin._textures.length !== source._textures.length
  ) {
    twin.destroy();
    return null;
  }

  const record: TwinRecord = { twin, users: 1 };
  const own = Object.getPrototypeOf(source) as BaseMaterial3D;

  copyInto(source, twin);
  records.set(source, record);
  Object.assign(source, {
    update(this: BaseMaterial3D) {
      own.update.call(this);
      copyInto(this, twin);
    },
    _setTextureSlot(this: BaseMaterial3D, index: number, value: BaseMaterial3D['_textures'][number]) {
      own._setTextureSlot.call(this, index, value);
      copyInto(this, twin);
    },
  });

  return twin;
}

/**
 * Lets go of a twin from {@link acquireInstanceColorMaterial}; the last mesh to let go destroys it
 * and gives `source` back its own methods
 * @param source - The material the twin stands in for
 * @internal
 */
export function releaseInstanceColorMaterial(source: BaseMaterial3D): void {
  const record = records.get(source);

  if (!record || --record.users > 0) return;

  records.delete(source);
  Reflect.deleteProperty(source, 'update');
  Reflect.deleteProperty(source, '_setTextureSlot');
  record.twin.destroy();
}

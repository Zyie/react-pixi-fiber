import { glbToGltf, loadImages, normalizeMeshopt, parseGltf } from '@pixi/3d';
import type {
  BaseMaterial3D,
  Container3D,
  Geometry3D,
  GltfFormat,
  Scene3DNode,
  Scene3DSource,
  SkeletonOptions,
} from '@pixi/3d';
import { Assets, Loader as PixiLoader } from 'pixi.js';
import type { Texture as PixiTexture } from 'pixi.js';

import { AnimationClip } from '../../animation/AnimationClip';
import type { KeyframeTrack } from '../../animation/KeyframeTrack';
import { NumberKeyframeTrack } from '../../animation/NumberKeyframeTrack';
import { PropertyBinding } from '../../animation/PropertyBinding';
import { QuaternionKeyframeTrack } from '../../animation/QuaternionKeyframeTrack';
import { VectorKeyframeTrack } from '../../animation/VectorKeyframeTrack';
import {
  ClampToEdgeWrapping,
  DoubleSide,
  FrontSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapLinearFilter,
  NearestMipmapNearestFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
} from '../../catalog/constants';
import { DirectionalLight } from '../../catalog/lights/DirectionalLight';
import { PointLight } from '../../catalog/lights/PointLight';
import { SpotLight } from '../../catalog/lights/SpotLight';
import { MeshBasicMaterial } from '../../catalog/materials/MeshBasicMaterial';
import { MeshPhysicalMaterial } from '../../catalog/materials/MeshPhysicalMaterial';
import type { MeshPhysicalMaterialParameters } from '../../catalog/materials/MeshPhysicalMaterial';
import { MeshStandardMaterial } from '../../catalog/materials/MeshStandardMaterial';
import { Bone } from '../../catalog/objects/Bone';
import { Group } from '../../catalog/objects/Group';
import { Mesh } from '../../catalog/objects/Mesh';
import { Object3D } from '../../catalog/objects/Object3D';
import { Skeleton } from '../../catalog/objects/Skeleton';
import { SkinnedMesh } from '../../catalog/objects/SkinnedMesh';
import { OrthographicCamera } from '../../catalog/scene/OrthographicCamera';
import { PerspectiveCamera } from '../../catalog/scene/PerspectiveCamera';
import { Texture } from '../../catalog/textures/Texture';
import { installObject3DSurface } from '../../compat/installObject3DSurface';
import { FileLoader } from '../../loaders/FileLoader';
import { Loader } from '../../loaders/Loader';
import { LoaderUtils } from '../../loaders/LoaderUtils';
import { Color } from '../../math/Color';
import { Matrix4 } from '../../math/Matrix4';
import { Quaternion } from '../../math/Quaternion';
import { Vector3 } from '../../math/Vector3';
import type { DRACOLoader } from './DRACOLoader';

const WRAPPINGS: Record<number, number> = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping,
};

const FILTERS: Record<number, number> = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter,
};

/** Material extensions `MeshStandardMaterial` covers */
const STANDARD_EXTENSIONS = new Set(['KHR_texture_transform', 'KHR_materials_emissive_strength']);

/**
 * Material extensions `MeshPhysicalMaterial` covers by their factors; one that names a texture, or any
 * other extension, keeps pixi-3d's own material
 */
const PHYSICAL_EXTENSIONS = new Set([
  'KHR_materials_clearcoat',
  'KHR_materials_sheen',
  'KHR_materials_transmission',
  'KHR_materials_volume',
  'KHR_materials_iridescence',
  'KHR_materials_specular',
  'KHR_materials_anisotropy',
  'KHR_materials_ior',
]);

const scratchMatrix = new Matrix4();
const scratchPosition = new Vector3();
const scratchQuaternion = new Quaternion();
const scratchScale = new Vector3();

/**
 * What `GLTFLoader` gives: three's `GLTF`, its scene graph made of the catalog's classes
 * @category catalog
 * @standard
 */
export interface GLTF {
  /** The file's default scene, a `Group` */
  scene: Group;
  /** Every scene of the file */
  scenes: Group[];
  /** Every animation, as clips with tracks named by node as three's loader names them */
  animations: AnimationClip[];
  /** Every camera, in the default scene */
  cameras: (PerspectiveCamera | OrthographicCamera)[];
  /** The file's `asset` block: its glTF version, generator and copyright */
  asset: { version: string; generator?: string; copyright?: string; minVersion?: string };
  /** The parsed JSON, and pixi-3d's `Scene3DSource` holding the geometry, materials and textures */
  parser: { json: GltfFormat; source: Scene3DSource };
  /** The file's `extras` */
  userData: Record<string, unknown>;
}

/** What `parse` reads: a GLB or glTF file's bytes, its JSON text, or its parsed JSON */
type GLTFData = ArrayBuffer | string | GltfFormat;

/** Everything one parse builds and shares between scenes */
interface Build {
  json: GltfFormat;
  source: Scene3DSource;
  textures: Map<string, Texture>;
  materials: Map<number, BaseMaterial3D>;
  skeletons: Skeleton[];
  names: Set<string>;
}

/** The `extras` glTF lets any object carry, which three puts in `userData` */
function extrasOf(definition: object | undefined): Record<string, unknown> | undefined {
  return (definition as { extras?: Record<string, unknown> } | undefined)?.extras;
}

/** One scene's built nodes, by file index */
type NodeMap = Map<number, Container3D>;

/**
 * three's `GLTFLoader`, in `react-pixi-fiber/addons`: loads a glTF or GLB file with pixi-3d's
 * parser and hands back three's `GLTF` shape, built from the catalog's classes
 *
 * `gltf.scene` is a `Group` of `Object3D`, `Group`, `Mesh`, `SkinnedMesh` and `Bone` nodes, where three
 * puts them and named as three names them, so `useGraph(gltf.scene)` gives the `nodes` and
 * `materials` gltfjsx code uses and `<primitive object={gltf.scene} />` works. Materials are
 * `MeshStandardMaterial`s (`MeshBasicMaterial` for unlit ones), with their maps as three `Texture`s;
 * a material using an extension `MeshStandardMaterial` can't show, such as transmission or
 * clearcoat, keeps pixi-3d's own material, with its `name` and `userData`. Animations are
 * `AnimationClip`s, skins move their bones, and morph targets show as `morphTargetInfluences` with
 * `morphTargetDictionary` from the file's target names. Cameras and punctual lights are built too.
 *
 * Draco and meshopt compression decode with pixi-3d's decoders: `setDRACOLoader` points pixi-3d's
 * Draco decoder at the `DRACOLoader`'s decoder path, and `setMeshoptDecoder` is taken and not needed.
 * KTX2 textures need `import 'pixi.js/ktx2'`. Plugins (`register`) aren't supported.
 *
 * It gives pixi-3d's classes three's members as it parses, as a root does when it starts, so a file
 * preloaded before any `<Canvas>` mounts, with `useLoader.preload`, is built the same.
 *
 * Geometries and materials from the file free their GPU memory on `dispose` and stay usable, as
 * three's do, so r3f disposing a `<mesh geometry={nodes.Body.geometry} />` that unmounts leaves the
 * file whole. `gltf.parser.source.destroy()` frees everything the file made, for good.
 * @example
 * ```tsx
 * import { useGraph, useLoader } from '@react-fiber/threejs-compat';
 * import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
 *
 * function Robot() {
 *   const { nodes, materials } = useLoader(GLTFLoader, '/robot.glb');
 *   return <mesh geometry={nodes.Body.geometry} material={materials.Metal} />;
 * }
 * ```
 * @category catalog
 * @standard
 */
export class GLTFLoader extends Loader<GLTF> {
  /** The Draco loader `setDRACOLoader` was given */
  public dracoLoader: DRACOLoader | null = null;
  /** The meshopt decoder `setMeshoptDecoder` was given; pixi-3d decodes meshopt with its own */
  public meshoptDecoder: unknown = null;

  /**
   * Loads a glTF or GLB file
   * @param url - The file, after `path`
   * @param onLoad - Called with the `GLTF`
   * @param onProgress - Called as the file downloads
   * @param onError - Called when it fails to load or parse
   */
  public override load(
    url: string,
    onLoad?: (gltf: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ): void {
    const resourcePath =
      this.resourcePath !== ''
        ? this.resourcePath
        : this.path !== ''
          ? LoaderUtils.resolveURL(LoaderUtils.extractUrlBase(url), this.path)
          : LoaderUtils.extractUrlBase(url);
    const fail = (error: unknown): void => {
      onError?.(error);
      this.manager.itemError(url);
      this.manager.itemEnd(url);
    };

    this.manager.itemStart(url);
    new FileLoader(this.manager)
      .setPath(this.path)
      .setResponseType('arraybuffer')
      .setRequestHeader(this.requestHeader)
      .setWithCredentials(this.withCredentials)
      .load(
        url,
        (data) =>
          this.parse(
            data as ArrayBuffer,
            resourcePath,
            (gltf) => {
              onLoad?.(gltf);
              this.manager.itemEnd(url);
            },
            fail,
          ),
        onProgress,
        fail,
      );
  }

  /**
   * Builds a `GLTF` from a file already in memory
   * @param data - A GLB or glTF file's bytes, its JSON text, or its parsed JSON
   * @param path - Where the file's buffers and images load from
   * @param onLoad - Called with the `GLTF`
   * @param onError - Called when it fails to parse
   */
  public override parse(
    data: GLTFData,
    path: string,
    onLoad?: (gltf: GLTF) => void,
    onError?: (error: unknown) => void,
  ): void {
    this._parse(data, path).then(onLoad, (error: unknown) => {
      if (onError) onError(error);
      else throw error;
    });
  }

  /**
   * `parse` as a promise
   * @param data - A GLB or glTF file's bytes, its JSON text, or its parsed JSON
   * @param path - Where the file's buffers and images load from
   * @returns The `GLTF`
   */
  public parseAsync(data: GLTFData, path: string): Promise<GLTF> {
    return this._parse(data, path);
  }

  /**
   * Takes a `DRACOLoader`, whose decoder path pixi-3d's Draco decoder uses
   * @param dracoLoader - The loader
   * @returns This loader
   */
  public setDRACOLoader(dracoLoader: DRACOLoader): this {
    this.dracoLoader = dracoLoader;
    return this;
  }

  /**
   * Takes three's meshopt decoder; pixi-3d decodes meshopt with its own, so it isn't needed
   * @param meshoptDecoder - The decoder
   * @returns This loader
   */
  public setMeshoptDecoder(meshoptDecoder: unknown): this {
    this.meshoptDecoder = meshoptDecoder;
    return this;
  }

  /**
   * Takes three's KTX2 loader; pixi-3d loads KTX2 textures once `pixi.js/ktx2` is imported
   * @param _ktx2Loader - The loader
   * @returns This loader
   */
  public setKTX2Loader(_ktx2Loader: unknown): this {
    return this;
  }

  private async _parse(data: GLTFData, path: string): Promise<GLTF> {
    installObject3DSurface();

    const { json, buffers } = await readFile(data, path, this.requestHeader, this.withCredentials);

    this.dracoLoader?.applyDecoderPath();
    await normalizeMeshopt(json, buffers);

    const imageLoader = new PixiLoader();

    imageLoader.parsers.push(...Assets.loader.parsers);

    const images = await loadImages(json, path, buffers, imageLoader);
    const source = await parseGltf(json, buffers, images.textures);

    imageLoader.reset();

    return buildGltf(json, source);
  }
}

/** The JSON and binary buffers of a file in any form `parse` takes */
async function readFile(
  data: GLTFData,
  path: string,
  headers: Record<string, string>,
  withCredentials: boolean,
): Promise<{ json: GltfFormat; buffers: ArrayBuffer[] }> {
  if (data instanceof ArrayBuffer && new TextDecoder().decode(new Uint8Array(data, 0, 4)) === 'glTF') {
    const { json, buffers } = glbToGltf(data);

    for (let i = buffers.length; i < (json.buffers?.length ?? 0); i++) buffers.push(new ArrayBuffer(0));

    return { json, buffers };
  }

  const json: GltfFormat =
    typeof data === 'string'
      ? JSON.parse(data)
      : data instanceof ArrayBuffer
        ? JSON.parse(new TextDecoder().decode(data))
        : data;
  const buffers = await Promise.all(
    (json.buffers ?? []).map(async (buffer) => {
      if (!buffer.uri) return new ArrayBuffer(0);

      const response = await fetch(LoaderUtils.resolveURL(buffer.uri, path), {
        headers,
        credentials: withCredentials ? 'include' : 'same-origin',
      });

      if (!response.ok) throw new Error(`GLTFLoader: Failed to load buffer "${buffer.uri}".`);

      return response.arrayBuffer();
    }),
  );

  return { json, buffers };
}

/** three's `GLTF` from pixi-3d's parsed source and the file's JSON */
function buildGltf(json: GltfFormat, source: Scene3DSource): GLTF {
  const build: Build = { json, source, textures: new Map(), materials: new Map(), skeletons: [], names: new Set() };
  const descriptor = source._descriptor;
  const sceneIndex = json.scene ?? 0;
  const builds = (json.scenes ?? []).map((sceneDef) =>
    buildScene(build, sceneDef.nodes ?? [], sceneDef.name, extrasOf(sceneDef)),
  );

  if (builds.length === 0 && descriptor.nodes?.length) builds.push(buildScene(build, [0]));

  const main = builds[sceneIndex] ?? builds[0];
  const cameras: GLTF['cameras'] = [];

  main?.scene.traverse((node) => {
    if (node instanceof PerspectiveCamera || node instanceof OrthographicCamera) cameras.push(node);
  });

  for (const geometries of source.geometries) {
    for (const geometry of geometries ?? []) keepUsable(geometry);
  }

  return {
    scene: main?.scene ?? new Group(),
    scenes: builds.map((entry) => entry.scene),
    animations: main ? buildAnimations(build, main.nodes) : [],
    cameras,
    asset: json.asset as GLTF['asset'],
    parser: { json, source },
    userData: extrasOf(json) ?? {},
  };
}

/**
 * Makes a geometry's or material's `dispose` free its GPU memory and keep it, as three's does, where
 * the support's `dispose` destroys it; r3f disposes what an unmounting element held, and a file's
 * geometry is shared by everything built from it
 */
function keepUsable(resource: Geometry3D | BaseMaterial3D): void {
  Object.defineProperty(resource, 'dispose', {
    configurable: true,
    value(this: Geometry3D | BaseMaterial3D) {
      if (!(this as { destroyed?: boolean }).destroyed) this.unload();
    },
  });
}

/** A name no other node of the file has, as three's `createUniqueName` */
function uniqueName(build: Build, name: string | undefined): string {
  if (!name) return '';

  const base = PropertyBinding.sanitizeNodeName(name);
  let unique = base;

  for (let i = 1; build.names.has(unique); i++) unique = `${base}_${i}`;
  build.names.add(unique);

  return unique;
}

function buildScene(
  build: Build,
  roots: number[],
  name?: string,
  extras?: Record<string, unknown>,
): { scene: Group; nodes: NodeMap } {
  const scene = new Group();
  const nodes: NodeMap = new Map();
  const skinned: { node: Container3D; skin: number }[] = [];

  build.names.clear();
  scene.name = uniqueName(build, name);
  if (extras) scene.userData = extras;

  for (const index of roots) scene.addChild(buildNode(build, index, nodes, skinned));
  bindSkins(build, scene, nodes, skinned);

  return { scene, nodes };
}

function jointsOf(build: Build): Set<number> {
  const joints = new Set<number>();

  for (const skin of build.json.skins ?? []) for (const joint of skin.joints) joints.add(joint);

  return joints;
}

function buildNode(
  build: Build,
  index: number,
  nodes: NodeMap,
  skinned: { node: Container3D; skin: number }[],
): Container3D {
  const { json, source } = build;
  const nodeDef = json.nodes![index];
  const data = source._descriptor.nodes![index];
  const name = uniqueName(build, nodeDef.name);
  const objects: Container3D[] = [];

  if (data.geometry !== undefined) objects.push(...buildMeshes(build, data));
  if (data.camera !== undefined) objects.push(buildCamera(build, data.camera));
  if (data.light !== undefined) {
    const light = buildLight(build, data.light);

    if (light) objects.push(light);
  }

  let node: Container3D;

  if (jointsOf(build).has(index)) {
    node = new Bone();
    if (objects.length) node.addChild(...objects);
  } else if (objects.length === 1) {
    node = objects[0];
  } else if (objects.length > 1) {
    node = new Group();
    node.addChild(...objects);
  } else {
    node = new Object3D();
  }

  node.name = name;
  if (nodeDef.name) node.userData.name = nodeDef.name;
  Object.assign(node.userData, extrasOf(nodeDef));
  if (data.position) node.position.set(data.position[0], data.position[1], data.position[2]);
  if (data.rotation) node.quaternion.set(data.rotation[0], data.rotation[1], data.rotation[2], data.rotation[3]);
  if (data.scale) node.scale.set(data.scale[0], data.scale[1], data.scale[2]);
  if (data.visible === false) node.visible = false;

  nodes.set(index, node);
  if (data.skin !== undefined && data.geometry !== undefined) skinned.push({ node, skin: data.skin });

  for (const child of data.children) node.addChild(buildNode(build, child, nodes, skinned));

  return node;
}

/** The meshes of a node's mesh: one per primitive, each `SkinnedMesh` when the node has a skin */
function buildMeshes(build: Build, data: Scene3DNode): Container3D[] {
  const { json, source } = build;
  const meshDef = json.meshes![data.geometry!];
  const primitives = source.geometries[data.geometry!] ?? [];
  const targetNames = extrasOf(meshDef)?.targetNames as string[] | undefined;

  return primitives.map((geometry, i) => {
    const material = materialFor(build, data.materials?.[i] ?? json.materials?.length ?? 0);
    const mesh = data.skin !== undefined ? new SkinnedMesh(geometry, material) : new Mesh(geometry, material);

    mesh.name = uniqueName(build, meshDef.name || `mesh_${data.geometry}`);
    if (primitives.length > 1) mesh.name += `_${i}`;
    Object.assign(mesh.userData, extrasOf(meshDef));
    if (mesh.morphTargetInfluences) {
      if (data.weights) mesh.morphTargetInfluences = data.weights;
      if (targetNames) mesh.morphTargetDictionary = Object.fromEntries(targetNames.map((name, t) => [name, t]));
    }

    return mesh;
  });
}

function buildCamera(build: Build, index: number): Container3D {
  const cameraDef = build.json.cameras![index];
  const camera =
    cameraDef.type === 'orthographic' && cameraDef.orthographic
      ? new OrthographicCamera(
          -cameraDef.orthographic.xmag,
          cameraDef.orthographic.xmag,
          cameraDef.orthographic.ymag,
          -cameraDef.orthographic.ymag,
          cameraDef.orthographic.znear,
          cameraDef.orthographic.zfar,
        )
      : new PerspectiveCamera(
          ((cameraDef.perspective?.yfov ?? 0.8) * 180) / Math.PI,
          cameraDef.perspective?.aspectRatio ?? 1,
          cameraDef.perspective?.znear ?? 1,
          cameraDef.perspective?.zfar ?? 2e6,
        );

  if (cameraDef.name) camera.name = uniqueName(build, cameraDef.name);

  return camera;
}

function buildLight(build: Build, index: number): Container3D | undefined {
  const lightDef = (build.json.extensions as { KHR_lights_punctual?: { lights: GltfLight[] } } | undefined)
    ?.KHR_lights_punctual?.lights[index];

  if (!lightDef) return undefined;

  const color = new Color().setRGB(...((lightDef.color ?? [1, 1, 1]) as [number, number, number]));
  const intensity = lightDef.intensity ?? 1;
  let light: Container3D | undefined;

  if (lightDef.type === 'directional') {
    light = aimed(new DirectionalLight(color, intensity));
  } else if (lightDef.type === 'point') {
    light = new PointLight(color, intensity, lightDef.range ?? 0);
  } else if (lightDef.type === 'spot') {
    const inner = lightDef.spot?.innerConeAngle ?? 0;
    const outer = lightDef.spot?.outerConeAngle ?? Math.PI / 4;

    light = aimed(
      new SpotLight(color, intensity, lightDef.range ?? 0, outer, 1 - inner / outer),
    ) as unknown as Container3D;
  }
  light?.position.set(0, 0, 0);

  if (light && lightDef.name) light.name = uniqueName(build, lightDef.name);

  return light;
}

/** A directional or spot light aimed down its own -Z, as glTF's lights shine, by a target it carries */
function aimed<T extends DirectionalLight | SpotLight>(light: T): T {
  light.target.position.set(0, 0, -1);
  light.addChild(light.target);
  return light;
}

/** A light of `KHR_lights_punctual` */
interface GltfLight {
  name?: string;
  type: 'directional' | 'point' | 'spot';
  color?: number[];
  intensity?: number;
  range?: number;
  spot?: { innerConeAngle?: number; outerConeAngle?: number };
}

/** A three texture over one of the file's pixi textures, with three's settings for how it is used */
function textureFor(
  build: Build,
  info: { index: number; extensions?: Record<string, unknown> } | undefined,
  colorSpace: string,
): Texture | null {
  if (!info) return null;

  const transform = info.extensions?.KHR_texture_transform as
    | { offset?: [number, number]; rotation?: number; scale?: [number, number] }
    | undefined;
  const key = `${info.index}:${colorSpace}:${JSON.stringify(transform ?? null)}`;
  const cached = build.textures.get(key);

  if (cached) return cached;

  const pixiTexture: PixiTexture | undefined = build.source.textures[info.index];

  if (!pixiTexture) return null;

  const textureDef = build.json.textures![info.index];
  const sampler = build.json.samplers?.[textureDef.sampler!] ?? {};
  const texture = new Texture(
    pixiTexture.source,
    undefined,
    WRAPPINGS[sampler.wrapS ?? 10497],
    WRAPPINGS[sampler.wrapT ?? 10497],
    FILTERS[sampler.magFilter ?? 9729],
    FILTERS[sampler.minFilter ?? 9987],
  );

  texture.flipY = false;
  texture._gltfUvs = true;
  texture.colorSpace = colorSpace;
  texture.name = textureDef.name ?? build.json.images?.[textureDef.source!]?.name ?? '';
  if (transform) {
    if (transform.offset) texture.offset.set(transform.offset[0], transform.offset[1]);
    if (transform.rotation !== undefined) texture.rotation = transform.rotation;
    if (transform.scale) texture.repeat.set(transform.scale[0], transform.scale[1]);
  }
  build.textures.set(key, texture);

  return texture;
}

/** The factors of the material extensions `MeshPhysicalMaterial` takes, as three's GLTFLoader maps them */
type ExtensionDef = Record<string, number | number[] | Record<string, unknown> | undefined>;

/** Whether an extension's definition names a texture, which `MeshPhysicalMaterial` can't take */
const hasTexture = (definition: ExtensionDef): boolean =>
  Object.keys(definition).some((key) => key.endsWith('Texture'));

/** three's `MeshPhysicalMaterial` parameters from the physical extensions of a glTF material */
function physicalParameters(extensions: object): MeshPhysicalMaterialParameters {
  const ext = (name: string): ExtensionDef | undefined =>
    (extensions as Record<string, ExtensionDef | undefined>)[name];
  const number = (definition: ExtensionDef | undefined, key: string, fallback: number): number =>
    typeof definition?.[key] === 'number' ? (definition[key] as number) : fallback;
  const rgb = (definition: ExtensionDef | undefined, key: string, fallback: number[]): Color =>
    new Color().setRGB(
      ...((Array.isArray(definition?.[key]) ? definition[key] : fallback) as [number, number, number]),
    );
  const parameters: MeshPhysicalMaterialParameters = {};
  const clearcoat = ext('KHR_materials_clearcoat');
  const sheen = ext('KHR_materials_sheen');
  const transmission = ext('KHR_materials_transmission');
  const volume = ext('KHR_materials_volume');
  const iridescence = ext('KHR_materials_iridescence');
  const specular = ext('KHR_materials_specular');
  const anisotropy = ext('KHR_materials_anisotropy');
  const ior = ext('KHR_materials_ior');

  if (clearcoat) {
    parameters.clearcoat = number(clearcoat, 'clearcoatFactor', 0);
    parameters.clearcoatRoughness = number(clearcoat, 'clearcoatRoughnessFactor', 0);
  }
  if (sheen) {
    parameters.sheen = 1;
    parameters.sheenColor = rgb(sheen, 'sheenColorFactor', [0, 0, 0]);
    parameters.sheenRoughness = number(sheen, 'sheenRoughnessFactor', 0);
  }
  if (transmission) parameters.transmission = number(transmission, 'transmissionFactor', 0);
  if (volume) {
    parameters.thickness = number(volume, 'thicknessFactor', 0);
    parameters.attenuationDistance = number(volume, 'attenuationDistance', Infinity);
    parameters.attenuationColor = rgb(volume, 'attenuationColor', [1, 1, 1]);
  }
  if (iridescence) {
    parameters.iridescence = number(iridescence, 'iridescenceFactor', 0);
    parameters.iridescenceIOR = number(iridescence, 'iridescenceIor', 1.3);
    parameters.iridescenceThicknessRange = [
      number(iridescence, 'iridescenceThicknessMinimum', 100),
      number(iridescence, 'iridescenceThicknessMaximum', 400),
    ];
  }
  if (specular) {
    parameters.specularIntensity = number(specular, 'specularFactor', 1);
    parameters.specularColor = rgb(specular, 'specularColorFactor', [1, 1, 1]);
  }
  if (anisotropy) {
    parameters.anisotropy = number(anisotropy, 'anisotropyStrength', 0);
    parameters.anisotropyRotation = number(anisotropy, 'anisotropyRotation', 0);
  }
  if (ior) parameters.ior = number(ior, 'ior', 1.5);

  return parameters;
}

/** The material of a file's material index, built once; the index past the file's own is glTF's default */
function materialFor(build: Build, index: number): BaseMaterial3D {
  const cached = build.materials.get(index);

  if (cached) return cached;

  const materialDef: GltfFormat.Material = build.json.materials?.[index] ?? {};
  const extensions = materialDef.extensions ?? {};
  const names = Object.keys(extensions);
  const pbr = materialDef.pbrMetallicRoughness ?? {};
  const [r, g, b, a] = pbr.baseColorFactor ?? [1, 1, 1, 1];
  const shared = {
    color: new Color().setRGB(r, g, b),
    opacity: a,
    transparent: materialDef.alphaMode === 'BLEND',
    alphaTest: materialDef.alphaMode === 'MASK' ? (materialDef.alphaCutoff ?? 0.5) : 0,
    side: materialDef.doubleSided ? DoubleSide : FrontSide,
    vertexColors: true,
    map: textureFor(build, pbr.baseColorTexture, SRGBColorSpace),
  };
  const physical = names.filter((name) => !STANDARD_EXTENSIONS.has(name));
  let material: BaseMaterial3D;

  if (names.includes('KHR_materials_unlit')) {
    material = new MeshBasicMaterial(shared);
  } else if (
    physical.every(
      (name) => PHYSICAL_EXTENSIONS.has(name) && !hasTexture((extensions as Record<string, ExtensionDef>)[name]),
    )
  ) {
    const [er, eg, eb] = materialDef.emissiveFactor ?? [0, 0, 0];
    const metallicRoughness = textureFor(build, pbr.metallicRoughnessTexture, NoColorSpace);
    const parameters: MeshPhysicalMaterialParameters = {
      ...shared,
      roughness: pbr.roughnessFactor ?? 1,
      metalness: pbr.metallicFactor ?? 1,
      roughnessMap: metallicRoughness,
      metalnessMap: metallicRoughness,
      normalMap: textureFor(build, materialDef.normalTexture, NoColorSpace),
      aoMap: textureFor(build, materialDef.occlusionTexture, NoColorSpace),
      aoMapIntensity: materialDef.occlusionTexture?.strength ?? 1,
      emissive: new Color().setRGB(er, eg, eb),
      emissiveIntensity:
        (extensions.KHR_materials_emissive_strength as { emissiveStrength?: number } | undefined)?.emissiveStrength ??
        1,
      emissiveMap: textureFor(build, materialDef.emissiveTexture, SRGBColorSpace),
    };
    const scale = materialDef.normalTexture?.scale;

    if (scale !== undefined) parameters.normalScale = [scale, scale];
    material = physical.length
      ? new MeshPhysicalMaterial({ ...parameters, ...physicalParameters(extensions) })
      : new MeshStandardMaterial(parameters);
  } else {
    material = build.source.materials[index];
  }

  Object.assign(material, {
    name: materialDef.name ?? (index === (build.json.materials?.length ?? 0) ? Loader.DEFAULT_MATERIAL_NAME : ''),
    uuid: `pixi3d-material-${material.uid}`,
    userData: extrasOf(materialDef) ?? {},
  });
  keepUsable(material);
  build.materials.set(index, material);

  return material;
}

/**
 * Builds a `Skeleton` per skin from pixi-3d's skin data, follows its nodes with the bones built
 * for them, and moves each skinned mesh under the node its skeleton hangs from, with the transform
 * it was bound at, as pixi-3d's `Model3D` does
 */
function bindSkins(
  build: Build,
  scene: Container3D,
  nodes: NodeMap,
  skinned: { node: Container3D; skin: number }[],
): void {
  const skins = build.source._descriptor.skins ?? [];
  const skeletons = skins.map((skin) => {
    const rig: SkeletonOptions = {
      parent: skin.skeletonParent,
      joints: skin.skeletonJoints,
      inverseBindMatrices: skin.inverseBindMatrices,
      labels: skin.skeletonLabels,
      bindShapeMatrix: skin.bindShapeMatrix,
    };
    const rigNodes = Array.from(skin.skeletonNodes, (index) => nodes.get(index)!);
    const bones = Array.from(skin.skeletonJoints, (joint) => rigNodes[joint]);
    const inverses = bones.map((_, j) => new Matrix4().fromArray(skin.inverseBindMatrices, j * 16));

    return new Skeleton(bones, inverses, rig, rigNodes);
  });

  build.skeletons.push(...skeletons);

  for (const { node, skin } of skinned) {
    const data = skins[skin];
    const parent = data.parentNode !== undefined && data.parentNode >= 0 ? nodes.get(data.parentNode) : scene;
    const meshes = node instanceof SkinnedMesh ? [node] : node.children.filter((child) => child instanceof SkinnedMesh);

    for (const mesh of meshes as SkinnedMesh[]) mesh.bind(skeletons[skin], new Matrix4());

    if (node instanceof Bone || !parent || node.parent === parent) continue;

    parent.addChild(node);
    if (data.bindShapeMatrix) {
      scratchMatrix.fromArray(data.bindShapeMatrix).decompose(scratchPosition, scratchQuaternion, scratchScale);
      node.position.copyFrom(scratchPosition);
      node.quaternion.copyFrom(scratchQuaternion);
      node.scale.copyFrom(scratchScale);
    } else {
      node.position.set(0, 0, 0);
      node.quaternion.set(0, 0, 0, 1);
      node.scale.set(1, 1, 1);
    }
  }
}

/** three's clips from pixi-3d's animations, each track renamed from the node's file index to its name */
function buildAnimations(build: Build, nodes: NodeMap): AnimationClip[] {
  const { json, source } = build;

  return (json.animations ?? []).map((animationDef, index) => {
    const animation = source.animations[animationDef.name || `anim_${index}`];
    const tracks: KeyframeTrack[] = [];

    for (const track of animation?.tracks ?? []) {
      const dot = track.label.lastIndexOf('.');
      const node = nodes.get(Number(track.label.slice(0, dot)));
      const path = track.label.slice(dot + 1);

      if (!node) continue;

      if (path === 'weights') {
        const targets: Container3D[] = [];

        node.traverse((object) => {
          if ((object as Mesh).morphTargetInfluences) targets.push(object);
        });
        for (const target of targets) {
          tracks.push(
            new NumberKeyframeTrack(
              `${target.name || target.uuid}.morphTargetInfluences`,
              track.times,
              track.values,
              track.interpolation,
            ),
          );
        }
        continue;
      }

      const Kind = path === 'quaternion' ? QuaternionKeyframeTrack : VectorKeyframeTrack;

      tracks.push(new Kind(`${node.name || node.uuid}.${path}`, track.times, track.values, track.interpolation));
    }

    return new AnimationClip(animationDef.name || `animation_${index}`, -1, tracks);
  });
}

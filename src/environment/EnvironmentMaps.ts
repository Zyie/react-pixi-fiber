import type { Camera3D, Container3D, View3D } from '@pixi/3d';
import { Container, CubeTexture, Mesh, MeshGeometry, Shader, Texture, TextureSource, UniformGroup } from 'pixi.js';
import type { CubeTextureSource, Renderer, TEXTURE_FORMATS } from 'pixi.js';

import type { EulerOrder } from '../math/Euler';
import { MathUtils } from '../math/MathUtils';
import { Matrix4 } from '../math/Matrix4';
import { backdropPrograms, bakePrograms, blurPrograms } from './environmentShaders';
import type { EnvironmentTexture } from './environmentTexture';

/** Frames an environment map can go unused before its cubes are freed */
const MAX_IDLE_FRAMES = 120;

/** The face size of a lighting cube: the largest cube pixi-3d prefilters, near three's 256 PMREM */
const LIGHTING_SIZE = 256;

/** The size and the last mip of three's PMREM for an environment up to 256 wide: 256 down to 8 */
const PMREM_SIZE = 256;
const PMREM_MAX_LOD = 5;

/** Transfers the shaders take: linear, sRGB, pixi-3d's 2.2 gamma */
const LINEAR = 0;
const SRGB = 1;
const GAMMA = 2;

/** three's tone mapping constants, by value, as the backdrop's curve: none, linear, Reinhard, Cineon, ACES */
const TONE_CURVES = [0, 1, 2, 3, 4, 0, 4, 4];

/** The angles of three's `Euler`, which a scene's rotations are */
interface Angles {
  x: number;
  y: number;
  z: number;
  order?: EulerOrder;
}

/**
 * The fields of three's `Scene` this reads, all optional, since any pixi-3d node can be drawn as a scene
 * @internal
 */
export interface EnvironmentScene extends Container3D {
  background?: unknown;
  environment?: unknown;
  environmentIntensity?: number;
  environmentRotation?: Angles;
  backgroundIntensity?: number;
  backgroundRotation?: Angles;
  backgroundBlurriness?: number;
}

/** The cubes made from one environment source */
interface BakedSource {
  /** The source as linear radiance, three's picture of it, with mips for blurring */
  canonical: CubeTexture | null;
  /** The render count of a drawn source when `canonical` was made */
  version: number;
  /** The source turned and scaled for pixi-3d's lighting, which decodes it with its 2.2 gamma */
  lighting: CubeTexture | null;
  lightingKey: string;
  /** `canonical` prefiltered into three's PMREM mips, for a blurry background */
  pmrem: CubeTexture | null;
  pmremVersion: number;
  usedAt: number;
  readonly release: () => void;
}

/** A scene's background cube drawn behind its view */
interface Backdrop {
  readonly mesh: Mesh<MeshGeometry, Shader>;
  readonly uniforms: UniformGroup;
}

/** What a texture or a cube texture tells about its end */
interface DestroyEvents {
  once(event: 'destroy', listener: () => void): unknown;
  off(event: 'destroy', listener: () => void): unknown;
}

const isTexture = (value: unknown): value is EnvironmentTexture =>
  value instanceof Texture || value instanceof CubeTexture;

/** How a source's texels decode to linear light */
function transferOf(source: EnvironmentTexture): number {
  if ((source as { isRenderTargetTexture?: boolean }).isRenderTargetTexture) return GAMMA;
  if (source.colorSpace === 'srgb-linear') return LINEAR;
  if (source.colorSpace === 'srgb') return SRGB;
  return source.source.format.endsWith('float') ? LINEAR : SRGB;
}

const versionOf = (source: EnvironmentTexture): number => (source as { _version?: number })._version ?? 0;

const rotationMatrix = new Matrix4();
const cameraMatrix = new Matrix4();
const directionMatrix = new Matrix4();

/**
 * Writes three's rotation of an environment by a scene's Euler: each angle negated, in the same order
 * @param angles - The scene's `environmentRotation` or `backgroundRotation`
 * @param out - Receives the rotation
 */
function sceneRotation(angles: Angles | undefined, out: Matrix4): Matrix4 {
  if (!angles) return out.identity();
  return out.makeRotationFromEuler({ x: -angles.x, y: -angles.y, z: -angles.z, order: angles.order });
}

/**
 * Turns a scene's environment textures into what pixi-3d draws: three's environment maps on pixi-3d's
 * image-based lighting, and three's background cube behind each view
 *
 * Each source (a cube texture, or an equirectangular one) is baked once on the GPU into a linear cube,
 * the picture three makes of it: an image cube mirrored in x as three samples it, an equirectangular map
 * wrapped onto the faces. That cube, with mips, is drawn behind the view for `scene.background`, turned
 * by `backgroundRotation`, scaled by `backgroundIntensity` and blurred by `backgroundBlurriness`, and
 * tone mapped only when three would: a background not stored in sRGB, or a blurred one, which three
 * draws from its linear PMREM. For `scene.environment` the
 * source is baked again, turned by `environmentRotation` and scaled by `environmentIntensity`, into the
 * cube pixi-3d's view prefilters for its lighting.
 *
 * A source's cubes are made again when a renderer draws into it (a cube camera's target), or when the
 * rotation or intensity changes, and freed when the source is destroyed, when nothing has used them
 * for 120 frames, or when this is disposed.
 * @internal
 */
export class EnvironmentMaps {
  private readonly _baked = new Map<EnvironmentTexture, BakedSource>();
  private readonly _backdrops = new Map<View3D, Backdrop>();
  private readonly _lit = new Set<View3D>();
  private readonly _bakeStage = new Container({ label: 'EnvironmentBake' });
  private readonly _bakeUniforms = new UniformGroup({
    uRotation: { value: new Float32Array(16), type: 'mat4x4<f32>' },
    uFace: { value: 0, type: 'f32' },
    uFlipX: { value: 1, type: 'f32' },
    uDecode: { value: SRGB, type: 'f32' },
    uEncode: { value: LINEAR, type: 'f32' },
    uIntensity: { value: 1, type: 'f32' },
    uRoughness: { value: 0, type: 'f32' },
    uSourceSize: { value: 1, type: 'f32' },
  });
  private readonly _bakeMeshes: Record<'cube' | 'equirect' | 'blur', Mesh<MeshGeometry, Shader>>;
  private readonly _quad = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  private _frame = -1;
  private _floatFormat: TEXTURE_FORMATS | null = null;

  constructor() {
    const mesh = (programs: ReturnType<typeof bakePrograms>): Mesh<MeshGeometry, Shader> =>
      new Mesh({
        geometry: this._quad,
        shader: new Shader({
          ...programs,
          resources: {
            bakeUniforms: this._bakeUniforms,
            uSource: Texture.EMPTY.source,
            uSourceSampler: Texture.EMPTY.source.style,
          },
        }),
      });
    this._bakeMeshes = {
      cube: mesh(bakePrograms(true)),
      equirect: mesh(bakePrograms(false)),
      blur: mesh(blurPrograms()),
    };
  }

  /**
   * Points a scene's view at its environment, and shows or hides the background cube behind it
   * @param pixi - The renderer that draws the view
   * @param view - The scene's view
   * @param stage - The container the view is drawn from, which the background goes into behind it
   * @param scene - The scene
   * @param toneMapping - three's tone mapping constant, or 0 when drawing into a target
   * @param exposure - three's `toneMappingExposure`
   * @param toTarget - Whether the view draws into a render target, which stores 2.2 gamma
   * @param frame - The renderer's frame, which ages unused maps
   * @returns Whether the background is an environment texture, which the view mustn't draw itself
   */
  public apply(
    pixi: Renderer,
    view: View3D,
    stage: Container,
    scene: EnvironmentScene,
    toneMapping: number,
    exposure: number,
    toTarget: boolean,
    frame: number,
  ): boolean {
    if (frame !== this._frame) {
      this._frame = frame;
      for (const [source, baked] of this._baked) if (frame - baked.usedAt > MAX_IDLE_FRAMES) this._release(source);
    }

    const { environment, background } = scene;
    if (isTexture(environment)) {
      this._lit.add(view);
      view.environment = this._lighting(pixi, environment, scene.environmentIntensity ?? 1, scene.environmentRotation);
    } else if (view.environment instanceof CubeTexture && environment === null) {
      view.environment = null;
    }

    const backdrop = this._backdrops.get(view);
    if (!isTexture(background)) {
      if (backdrop) backdrop.mesh.visible = false;
      return false;
    }
    const blurriness = Math.min(1, Math.max(0, scene.backgroundBlurriness ?? 0));
    const cube = blurriness > 0 ? this._pmrem(pixi, background) : this._canonical(pixi, background).canonical;
    if (!cube) return true;
    this._drawBackdrop(backdrop ?? this._createBackdrop(view, stage), view, cube, scene, {
      toneMapping:
        toTarget || (blurriness === 0 && transferOf(background) === SRGB) ? 0 : (TONE_CURVES[toneMapping] ?? 4),
      exposure,
      encode: toTarget ? GAMMA : SRGB,
    });
    return true;
  }

  /**
   * Frees the background a view drew behind it
   * @param view - The view
   */
  public releaseView(view: View3D): void {
    this._lit.delete(view);
    const backdrop = this._backdrops.get(view);
    if (!backdrop) return;
    this._backdrops.delete(view);
    backdrop.mesh.shader!.destroy();
    backdrop.mesh.destroy();
  }

  /** Frees every cube made, the backgrounds still shown and the bake's meshes. Idempotent. */
  public dispose(): void {
    for (const view of this._backdrops.keys()) this.releaseView(view);
    for (const view of this._lit) this.releaseView(view);
    for (const mesh of Object.values(this._bakeMeshes)) {
      mesh.shader?.destroy();
      mesh.destroy();
    }
    for (const source of this._baked.keys()) this._release(source);
    if (!this._bakeStage.destroyed) this._bakeStage.destroy();
    this._quad.destroy();
  }

  private _entry(source: EnvironmentTexture): BakedSource {
    let baked = this._baked.get(source);
    if (!baked) {
      const release = (): void => this._release(source);
      baked = {
        canonical: null,
        version: -1,
        lighting: null,
        lightingKey: '',
        pmrem: null,
        pmremVersion: -1,
        usedAt: this._frame,
        release,
      };
      (source as DestroyEvents).once('destroy', release);
      this._baked.set(source, baked);
    }
    baked.usedAt = this._frame;
    return baked;
  }

  private _release(source: EnvironmentTexture): void {
    const baked = this._baked.get(source);
    if (!baked) return;
    this._baked.delete(source);
    (source as DestroyEvents).off('destroy', baked.release);
    for (const view of this._lit) if (view.environment === baked.lighting) view.environment = null;
    for (const { mesh } of this._backdrops.values()) {
      const shown = mesh.shader!.resources.uCube;
      if (shown === baked.canonical?.source || shown === baked.pmrem?.source) {
        mesh.shader!.resources.uCube = Texture.EMPTY.source;
        mesh.shader!.resources.uCubeSampler = Texture.EMPTY.source.style;
      }
    }
    baked.canonical?.destroy(true);
    baked.lighting?.destroy(true);
    baked.pmrem?.destroy(true);
  }

  /** The linear cube of a source, baked again when a renderer has drawn into the source since */
  private _canonical(pixi: Renderer, source: EnvironmentTexture): BakedSource {
    const baked = this._entry(source);
    const version = versionOf(source);
    if (baked.canonical && baked.version === version) return baked;
    baked.version = version;
    baked.canonical ??= this._createCube(pixi, this._backgroundSize(source), true);
    this._bake(pixi, source, baked.canonical, null, 1, LINEAR);
    return baked;
  }

  /** The lighting cube pixi-3d prefilters: the source turned, scaled and encoded with its gamma */
  private _lighting(
    pixi: Renderer,
    source: EnvironmentTexture,
    intensity: number,
    rotation: Angles | undefined,
  ): CubeTexture | null {
    const baked = this._entry(source);
    const version = versionOf(source);
    const key = rotation
      ? `${version}:${intensity}:${rotation.x}:${rotation.y}:${rotation.z}:${rotation.order}`
      : `${version}:${intensity}`;
    if (baked.lighting && baked.lightingKey === key) return baked.lighting;
    baked.lightingKey = key;
    baked.lighting?.destroy(true);
    baked.lighting = this._createCube(pixi, LIGHTING_SIZE, true);
    this._bake(pixi, source, baked.lighting, rotation, intensity, GAMMA);
    return baked.lighting;
  }

  /**
   * `canonical` prefiltered as three's PMREM is: a mip chain from a 256 cube down to 8, each level the
   * GGX convolution at the roughness three's `lodToRoughness` gives it, which the backdrop samples at
   * three's `roughnessToMip` of the blurriness
   */
  private _pmrem(pixi: Renderer, source: EnvironmentTexture): CubeTexture | null {
    const baked = this._canonical(pixi, source);
    if (baked.pmrem && baked.pmremVersion === baked.version) return baked.pmrem;
    baked.pmremVersion = baked.version;
    const canonical = baked.canonical!;
    baked.pmrem ??= this._createCube(pixi, PMREM_SIZE, false, PMREM_MAX_LOD + 1);
    const uniforms = this._bakeUniforms.uniforms;
    uniforms.uSourceSize = canonical.source.pixelWidth;
    for (let lod = 0; lod <= PMREM_MAX_LOD; lod++) {
      uniforms.uRoughness = Math.max(1e-3, 1 - Math.sqrt(1 - lod / PMREM_MAX_LOD));
      this._drawFaces(pixi, this._bakeMeshes.blur, canonical, baked.pmrem, lod);
    }
    return baked.pmrem;
  }

  /** The face size three draws a background at: a cube's own, or an equirectangular map's height */
  private _backgroundSize(source: EnvironmentTexture): number {
    const { pixelWidth, pixelHeight } = source.source;
    return Math.min(2048, source instanceof CubeTexture ? pixelWidth : pixelHeight);
  }

  /** The float format the renderer can draw into, half floats where it can */
  private _format(pixi: Renderer): TEXTURE_FORMATS {
    if (this._floatFormat) return this._floatFormat;
    const gl = (pixi as Renderer & { gl?: WebGL2RenderingContext }).gl;
    this._floatFormat = !gl || gl.getExtension('EXT_color_buffer_float') ? 'rgba16float' : 'rgba8unorm';
    return this._floatFormat;
  }

  private _createCube(pixi: Renderer, size: number, mipmaps: boolean, mipLevelCount = 1): CubeTexture {
    const source = new TextureSource({
      width: size,
      height: size,
      resolution: 1,
      viewDimension: 'cube',
      arrayLayerCount: 6,
      format: this._format(pixi),
      autoGenerateMipmaps: mipmaps,
      mipLevelCount: mipmaps ? Math.floor(Math.log2(size)) + 1 : mipLevelCount,
      mipmapFilter: 'linear',
      label: 'EnvironmentCube',
    }) as CubeTextureSource;
    return new CubeTexture({ source });
  }

  /** Draws each face of `into` from a source, then builds its mips */
  private _bake(
    pixi: Renderer,
    source: EnvironmentTexture,
    into: CubeTexture,
    rotation: Angles | null | undefined,
    intensity: number,
    encode: number,
  ): void {
    const isCube = source instanceof CubeTexture;
    const uniforms = this._bakeUniforms.uniforms;
    sceneRotation(rotation ?? undefined, rotationMatrix);
    (uniforms.uRotation as Float32Array).set(rotationMatrix.elements);
    uniforms.uFlipX = isCube && !(source as { isRenderTargetTexture?: boolean }).isRenderTargetTexture ? -1 : 1;
    uniforms.uDecode = transferOf(source);
    uniforms.uEncode = encode;
    uniforms.uIntensity = intensity;
    this._drawFaces(pixi, this._bakeMeshes[isCube ? 'cube' : 'equirect'], source, into);
  }

  /** Draws each face of a mip of `into` with a bake mesh reading `source`, then builds its mips when it has them made */
  private _drawFaces(
    pixi: Renderer,
    mesh: Mesh<MeshGeometry, Shader>,
    source: EnvironmentTexture,
    into: CubeTexture,
    mipLevel = 0,
  ): void {
    mesh.shader!.resources.uSource = source.source;
    mesh.shader!.resources.uSourceSampler = source.source.style;
    const size = into.source.pixelWidth >> mipLevel;
    mesh.scale.set(size, size);
    this._bakeStage.addChild(mesh);
    for (let face = 0; face < 6; face++) {
      this._bakeUniforms.uniforms.uFace = face;
      pixi.render({
        container: this._bakeStage,
        target: into.source,
        layer: face,
        mipLevel,
        clear: true,
        clearColor: [0, 0, 0, 1],
      });
    }
    this._bakeStage.removeChild(mesh);
    mesh.shader!.resources.uSource = Texture.EMPTY.source;
    mesh.shader!.resources.uSourceSampler = Texture.EMPTY.source.style;
    into.source.updateMipmaps();
  }

  private _createBackdrop(view: View3D, stage: Container): Backdrop {
    const uniforms = new UniformGroup({
      uDirection: { value: new Float32Array(16), type: 'mat4x4<f32>' },
      uLod: { value: 0, type: 'f32' },
      uIntensity: { value: 1, type: 'f32' },
      uToneMapping: { value: 0, type: 'f32' },
      uExposure: { value: 1, type: 'f32' },
      uEncode: { value: SRGB, type: 'f32' },
    });
    const mesh = new Mesh({
      geometry: this._quad,
      shader: new Shader({
        ...backdropPrograms(),
        resources: {
          backdropUniforms: uniforms,
          uCube: Texture.EMPTY.source,
          uCubeSampler: Texture.EMPTY.source.style,
        },
      }),
      label: 'EnvironmentBackdrop',
    });
    stage.addChildAt(mesh, stage.getChildIndex(view));
    const backdrop = { mesh, uniforms };
    this._backdrops.set(view, backdrop);
    return backdrop;
  }

  private _drawBackdrop(
    backdrop: Backdrop,
    view: View3D,
    cube: CubeTexture,
    scene: EnvironmentScene,
    output: { toneMapping: number; exposure: number; encode: number },
  ): void {
    const { mesh, uniforms } = backdrop;
    mesh.visible = true;
    mesh.position.copyFrom(view.position);
    mesh.scale.set(view.width, view.height);
    mesh.shader!.resources.uCube = cube.source;
    mesh.shader!.resources.uCubeSampler = cube.source.style;

    const camera = view.camera as Camera3D & { aspect?: number | null };
    const aspect = typeof camera.aspect === 'number' ? camera.aspect : view.width / view.height;
    const tanY = Math.tan((camera.fov * MathUtils.DEG2RAD) / 2) / camera.zoom;
    const perspective = camera.mode !== 'orthographic';
    directionMatrix.set(
      perspective ? tanY * aspect : 0,
      0,
      0,
      0,
      0,
      perspective ? tanY : 0,
      0,
      0,
      0,
      0,
      -1,
      0,
      0,
      0,
      0,
      1,
    );
    camera.getGlobalTransform(cameraMatrix).extractRotation(cameraMatrix);
    sceneRotation(scene.backgroundRotation, rotationMatrix).multiply(cameraMatrix).multiply(directionMatrix);

    const values = uniforms.uniforms;
    (values.uDirection as Float32Array).set(rotationMatrix.elements);
    const blurriness = Math.min(1, Math.max(0, scene.backgroundBlurriness ?? 0));
    values.uLod = PMREM_MAX_LOD * blurriness * (2 - blurriness);
    values.uIntensity = scene.backgroundIntensity ?? 1;
    values.uToneMapping = output.toneMapping;
    values.uExposure = output.exposure;
    values.uEncode = output.encode;
  }
}

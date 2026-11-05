/*!
 * Adapted from react-three-fiber's packages/fiber/src/core/hooks/useEnvironment.tsx
 * MIT License, Copyright (c) 2019-2025 Poimandres
 */
import { HDRLoader } from '../../addons/environment/HDRLoader';
import { CubeReflectionMapping, EquirectangularReflectionMapping } from '../../catalog/constants';
import { CubeTextureLoader } from '../../loaders/CubeTextureLoader';
import { TextureLoader } from '../../loaders/TextureLoader';
import { presetsObj } from '../../r3f/src/core/components/Environment/environment-assets';
import { useLoader as coreUseLoader } from '../../r3f/src/core/hooks/useLoader';
import type { EnvironmentTexture } from '../environmentTexture';

/**
 * The environments `useEnvironment` and `<Environment preset>` name: r3f's ten Poly Haven `.hdr`
 * files, fetched from pmndrs' asset host
 * @category hooks
 * @advanced
 */
export type PresetsType = keyof typeof presetsObj;

/**
 * A loader `useEnvironment` uses, as its `extensions` callback gets it
 * @category hooks
 * @advanced
 */
export type EnvironmentLoader = CubeTextureLoader | HDRLoader | TextureLoader;

/**
 * Where an environment comes from: r3f's `EnvironmentLoaderProps`
 * @category hooks
 * @advanced
 */
export interface EnvironmentLoaderProps {
  /**
   * An `.hdr`, an image (`.png`, `.jpg`, `.webp`, `.avif`, `.gif`) holding an equirectangular map, or
   * six images of a cube in three's order +X, -X, +Y, -Y, +Z, -Z
   */
  files?: string | string[];
  /** Prefixed to every file */
  path?: string;
  /** One of r3f's presets, which needs the network */
  preset?: PresetsType;
  /** Called with the loader before it loads */
  extensions?: (loader: EnvironmentLoader) => void;
  /** three's colour space of the texels; an `.hdr` is linear and anything else sRGB when omitted */
  colorSpace?: string;
}

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';
const DEFAULT_FILES = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'];

type EnvironmentFormat = 'cube' | 'hdr' | 'ldr';

const LOADERS = { cube: CubeTextureLoader, hdr: HDRLoader, ldr: TextureLoader } as const;

type LoaderClass = (typeof LOADERS)[EnvironmentFormat];

/** core's `useLoader`, typed for the three environment loaders */
const useLoader = coreUseLoader as unknown as {
  (
    loader: LoaderClass,
    input: string | string[][],
    extensions?: (loader: EnvironmentLoader) => void,
  ): EnvironmentTexture | EnvironmentTexture[];
  preload(loader: LoaderClass, input: string | string[][], extensions?: (loader: EnvironmentLoader) => void): void;
  clear(loader: LoaderClass, input: string | string[][]): void;
};

function validatePreset(preset: string): void {
  if (!(preset in presetsObj)) throw new Error(`Preset must be one of: ${Object.keys(presetsObj).join(', ')}`);
}

/**
 * Which loader reads the files. A six-file set is a cube; one file is an equirectangular map, an `.hdr`
 * or an image. pixi-3d has no `.exr` decoder, and a `.jpg`'s Ultra HDR gain map is ignored.
 */
function getFormat(files: string | string[]): { format: EnvironmentFormat; isCubemap: boolean } {
  const isCubemap = Array.isArray(files) && files.length === 6;
  const first = Array.isArray(files) ? files[0] : files;
  const extension = first.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  if (isCubemap) {
    if (extension === 'hdr') throw new Error('useEnvironment: six .hdr faces are not supported; use one .hdr');
    return { format: 'cube', isCubemap };
  }
  if (extension === 'exr' || first.startsWith('data:application/exr')) {
    throw new Error('useEnvironment: .exr files are not supported; use an .hdr or an image');
  }
  if (extension === 'hdr' || first.startsWith('data:application/hdr')) return { format: 'hdr', isCubemap };
  if (
    /^data:image\/(png|jpeg|webp|avif|gif)[;,]/.test(first) ||
    ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'].includes(extension!)
  ) {
    return { format: 'ldr', isCubemap };
  }
  throw new Error(`useEnvironment: Unrecognized file extension: ${String(files)}`);
}

/** The loader, its input and its setup for a set of files */
function loadPlan(files: string | string[], path: string, extensions: EnvironmentLoaderProps['extensions']) {
  const { format, isCubemap } = getFormat(files);
  const loader = LOADERS[format];
  const input = Array.isArray(files) ? [files] : files;
  const setup = (instance: EnvironmentLoader): void => {
    instance.setPath(path);
    extensions?.(instance);
  };
  return { format, isCubemap, loader, input, setup };
}

/**
 * Resolves a preset to its file and the preset host
 * @param options - The files, path and preset asked for
 */
function resolveFiles({ files = DEFAULT_FILES, path = '', preset }: EnvironmentLoaderProps): {
  files: string | string[];
  path: string;
} {
  if (!preset) return { files, path };
  validatePreset(preset);
  return { files: presetsObj[preset], path: CUBEMAP_ROOT };
}

/**
 * The type of {@link useEnvironment}
 * @category hooks
 * @advanced
 */
export interface UseEnvironment {
  /** Loads an environment map and suspends until it is ready */
  (options?: EnvironmentLoaderProps): EnvironmentTexture;
  /** Starts loading an environment map into the cache without suspending */
  preload(options?: Omit<EnvironmentLoaderProps, 'colorSpace'>): void;
  /** Removes an environment map from the cache */
  clear(options?: Pick<EnvironmentLoaderProps, 'files' | 'preset'>): void;
}

/**
 * Loads an environment map for `scene.environment` and `scene.background`, r3f's `useEnvironment`
 *
 * The same arguments as r3f's. Six images load as a cube texture; an `.hdr` decodes on the CPU into
 * linear half floats; any other image loads as an equirectangular map. The texture gets three's
 * `mapping` and `colorSpace`. `.exr` files and six `.hdr` faces aren't supported, and a `.jpg` loads as
 * a plain image, without its Ultra HDR gain map. A `preset` fetches r3f's file from the network.
 * @example
 * ```tsx
 * const texture = useEnvironment({ files: '/sky.hdr' });
 * const scene = useThree((state) => state.scene);
 * useLayoutEffect(() => void (scene.environment = texture), [scene, texture]);
 * ```
 * @category hooks
 * @standard
 */
export const useEnvironment: UseEnvironment = Object.assign(
  ({ colorSpace, extensions, ...options }: EnvironmentLoaderProps = {}): EnvironmentTexture => {
    const { files, path } = resolveFiles(options);
    const { format, isCubemap, loader, input, setup } = loadPlan(files, path, extensions);
    const result = useLoader(loader, input, setup);
    const texture = Array.isArray(result) ? result[0] : result;
    texture.mapping = isCubemap ? CubeReflectionMapping : EquirectangularReflectionMapping;
    texture.colorSpace = colorSpace ?? (format === 'hdr' ? 'srgb-linear' : 'srgb');
    return texture;
  },
  {
    preload: ({ extensions, ...options }: Omit<EnvironmentLoaderProps, 'colorSpace'> = {}): void => {
      const { files, path } = resolveFiles(options);
      const { loader, input, setup } = loadPlan(files, path, extensions);
      useLoader.preload(loader, input, setup);
    },
    clear: (options: Pick<EnvironmentLoaderProps, 'files' | 'preset'> = {}): void => {
      const { files, path } = resolveFiles(options);
      const { loader, input } = loadPlan(files, path, undefined);
      useLoader.clear(loader, input);
    },
  },
);

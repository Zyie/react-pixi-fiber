import {
  applyProps,
  createPortal,
  getThree as coreGetThree,
  useFrame as coreUseFrame,
  useThree,
} from '@react-fiber/core';
import type { Euler, RootState } from '@react-fiber/core';
/*!
 * Adapted from react-three-fiber's packages/fiber/src/core/components/Environment/Environment.tsx
 * MIT License, Copyright (c) 2019-2025 Poimandres
 */
import * as React from 'react';

import type { PixiCatalog } from '../../catalog/catalog';
import type { Scene } from '../../catalog/scene/Scene';
import type { Color as ThreeColor, ColorRepresentation } from '../../math/Color';
import type { CubeCamera } from '../CubeCamera';
import type { EnvironmentTexture } from '../environmentTexture';
import { useEnvironment } from '../hooks/useEnvironment';
import type { EnvironmentLoaderProps } from '../hooks/useEnvironment';
import type { WebGLCubeRenderTarget } from '../WebGLCubeRenderTarget';

const useFrame = coreUseFrame as unknown as (callback: () => void) => void;
const getThree = coreGetThree as unknown as () => PixiCatalog;

/**
 * The props of {@link Environment}: r3f's `EnvironmentProps`, typed against this library's classes
 * @category core
 * @standard
 */
export interface EnvironmentProps extends EnvironmentLoaderProps {
  /** Rendered into a scene of their own and filmed by a cube camera, which becomes the environment */
  children?: React.ReactNode;
  /** How many frames the cube camera films the children: 1 for once, `Infinity` for every frame @default 1 */
  frames?: number;
  /** The cube camera's near clipping distance @default 0.1 */
  near?: number;
  /** The cube camera's far clipping distance @default 1000 */
  far?: number;
  /** The width of each face the children are filmed into @default 256 */
  resolution?: number;
  /** Also draw the environment behind the scene, or `'only'` to draw it without lighting with it @default false */
  background?: boolean | 'only';
  /** r3f's older name for `backgroundBlurriness` */
  blur?: number;
  /** Blurs the background, 0 to 1 @default 0 */
  backgroundBlurriness?: number;
  /** Scales the background @default 1 */
  backgroundIntensity?: number;
  /** Turns the background round the scene @default [0, 0, 0] */
  backgroundRotation?: Euler;
  /** Scales the light the environment gives @default 1 */
  environmentIntensity?: number;
  /** Turns the environment round the scene @default [0, 0, 0] */
  environmentRotation?: Euler;
  /** A texture to use as the environment, in place of files */
  map?: EnvironmentTexture;
  /** The scene to light, or a ref to it; the root's scene when omitted */
  scene?: Scene | React.RefObject<Scene | null>;
  /** Not supported: three's `GroundedSkybox` has no pixi-3d counterpart yet, so the environment is set without it */
  ground?: boolean | { radius?: number; height?: number; scale?: number };
  /** A plain colour to draw behind the scene, in place of files */
  color?: ColorRepresentation;
  /** Files to draw behind the scene when they differ from the ones that light it */
  backgroundFiles?: string | string[];
}

/** The scene fields `<Environment>` sets and puts back */
interface SceneEnvironmentProps {
  backgroundBlurriness?: number;
  backgroundIntensity?: number;
  backgroundRotation?: Euler;
  environmentIntensity?: number;
  environmentRotation?: Euler;
}

const isRef = (scene: Scene | React.RefObject<Scene | null>): scene is React.RefObject<Scene | null> =>
  !(scene as Scene).isScene && 'current' in scene;

const resolveScene = (scene: Scene | React.RefObject<Scene | null>): Scene => (isRef(scene) ? scene.current! : scene);

/**
 * Sets a texture as a scene's environment and, as asked, its background, with the fields that turn,
 * scale and blur them; returns what puts the scene back
 */
function setEnvProps(
  background: boolean | 'only',
  scene: Scene | React.RefObject<Scene | null> | undefined,
  defaultScene: Scene,
  texture: EnvironmentTexture,
  sceneProps: SceneEnvironmentProps = {},
): () => void {
  const props = {
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
    backgroundRotation: [0, 0, 0],
    environmentIntensity: 1,
    environmentRotation: [0, 0, 0],
    ...Object.fromEntries(Object.entries(sceneProps).filter(([, value]) => value !== undefined)),
  };

  const target = resolveScene(scene ?? defaultScene);
  const oldBackground = target.background;
  const oldEnvironment = target.environment;
  const oldProps = {
    backgroundBlurriness: target.backgroundBlurriness,
    backgroundIntensity: target.backgroundIntensity,
    backgroundRotation: target.backgroundRotation.clone(),
    environmentIntensity: target.environmentIntensity,
    environmentRotation: target.environmentRotation.clone(),
  };
  if (background !== 'only') target.environment = texture;
  if (background) target.background = texture;
  applyProps(target as never, props);

  return () => {
    if (background !== 'only') target.environment = oldEnvironment;
    if (background) target.background = oldBackground;
    applyProps(target as never, oldProps);
  };
}

/** Films a portal's scene into its cube target with `autoClear` on, as r3f's `EnvironmentPortal` does */
function filmEnvironment(renderer: RootState['renderer'], camera: CubeCamera, scene: Scene): void {
  const autoClear = renderer.autoClear;
  renderer.autoClear = true;
  camera.update(renderer, scene);
  renderer.autoClear = autoClear;
}

/** Frees a loaded texture's GPU memory, as three's `dispose` does, leaving it to load again from its pixels */
const unloadTexture = (texture: EnvironmentTexture): void => texture.source.unload();

/**
 * Sets an existing texture as the environment, r3f's `EnvironmentMap`
 * @param props - {@link EnvironmentProps}; `map` is the texture
 * @category core
 * @advanced
 */
export function EnvironmentMap({ scene, background = false, map, ...config }: EnvironmentProps): null {
  const defaultScene = useThree((state) => state.scene) as unknown as Scene;
  React.useLayoutEffect(() => {
    if (map) return setEnvProps(background, scene, defaultScene, map, config);
  });
  return null;
}

/**
 * Loads an environment from files or a preset and sets it, r3f's `EnvironmentCube`
 * @param props - {@link EnvironmentProps}
 * @category core
 * @advanced
 */
export function EnvironmentCube({
  background = false,
  scene,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  ...rest
}: EnvironmentProps): null {
  const texture = useEnvironment(rest);
  const defaultScene = useThree((state) => state.scene) as unknown as Scene;

  React.useLayoutEffect(() =>
    setEnvProps(background, scene, defaultScene, texture, {
      backgroundBlurriness: blur ?? backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation,
    }),
  );

  React.useEffect(() => () => unloadTexture(texture), [texture]);

  return null;
}

/**
 * Films its children with a cube camera and sets the result as the environment, r3f's
 * `EnvironmentPortal`. With `frames` above 1 the lighting is prefiltered again on every frame filmed.
 * @param props - {@link EnvironmentProps}
 * @category core
 * @advanced
 */
export function EnvironmentPortal({
  children,
  near = 0.1,
  far = 1000,
  resolution = 256,
  frames = 1,
  map,
  background = false,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  scene,
  files,
  path,
  preset,
  extensions,
}: EnvironmentProps): React.JSX.Element {
  const renderer = useThree((state) => state.renderer);
  const support = useThree((state) => state.internal.support);
  const defaultScene = useThree((state) => state.scene) as unknown as Scene;
  const camera = React.useRef<CubeCamera>(null!);
  const [virtualScene] = React.useState(() => new (getThree().Scene)());
  const fbo = React.useMemo(
    () =>
      new (support.CubeRenderTarget as typeof WebGLCubeRenderTarget)(resolution, { type: getThree().HalfFloatType }),
    [resolution, support],
  );

  React.useEffect(() => () => fbo.dispose(), [fbo]);

  React.useLayoutEffect(() => {
    if (frames === 1) filmEnvironment(renderer, camera.current, virtualScene);
    return setEnvProps(background, scene, defaultScene, fbo.texture, {
      backgroundBlurriness: blur ?? backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation,
    });
  }, [
    children,
    virtualScene,
    fbo.texture,
    scene,
    defaultScene,
    background,
    frames,
    renderer,
    blur,
    backgroundBlurriness,
    backgroundIntensity,
    backgroundRotation,
    environmentIntensity,
    environmentRotation,
  ]);

  const count = React.useRef(1);
  useFrame(() => {
    if (frames === Infinity || count.current < frames) {
      filmEnvironment(renderer, camera.current, virtualScene);
      count.current++;
    }
  });

  return (
    <>
      {createPortal(
        <>
          {children}
          <cubeCamera ref={camera} args={[near, far, fbo]} />
          {files || preset ? (
            <EnvironmentCube background files={files} preset={preset} path={path} extensions={extensions} />
          ) : map ? (
            <EnvironmentMap background map={map} extensions={extensions} />
          ) : null}
        </>,
        virtualScene as never,
      )}
    </>
  );
}

/**
 * Draws a plain colour behind the scene, leaving its lighting alone
 * @param props - {@link EnvironmentProps}; `color` is the colour
 */
function EnvironmentColor({ color, scene }: EnvironmentProps): null {
  const defaultScene = useThree((state) => state.scene) as unknown as Scene;
  React.useLayoutEffect(() => {
    if (color === undefined) return;
    const target = resolveScene(scene ?? defaultScene);
    const oldBackground = target.background;
    target.background = new (getThree().Color)(color) as ThreeColor;
    return () => {
      target.background = oldBackground;
    };
  });
  return null;
}

/**
 * Lights the scene with one set of files and draws another behind it
 * @param props - {@link EnvironmentProps}; `backgroundFiles` are the backdrop
 */
function EnvironmentDualSource(props: EnvironmentProps): React.JSX.Element {
  const { backgroundFiles, ...envProps } = props;
  return (
    <>
      {(envProps.files || envProps.preset) && <EnvironmentCube {...envProps} background={false} />}
      <EnvironmentCube {...props} files={backgroundFiles} preset={undefined} background="only" />
    </>
  );
}

/**
 * Lights a scene from its surroundings and draws them behind it, r3f's `<Environment>`
 *
 * The same props and routing as r3f's: `files` or a `preset` load an environment (six images for a
 * cube, or one `.hdr` or image for an equirectangular map), `map` takes a texture, children are filmed
 * by a cube camera, and `color` only sets the background. `background` draws the environment behind
 * the scene too; `environmentIntensity`, `environmentRotation`, `backgroundIntensity`,
 * `backgroundRotation` and `backgroundBlurriness` turn, scale and blur them. The lighting runs on
 * pixi-3d's image-based lighting, which prefilters each environment once. `ground` isn't supported
 * yet, and the environment is set without it. Presets need the network.
 * @example
 * ```tsx
 * <Environment files="/sky.hdr" background backgroundBlurriness={0.2} environmentIntensity={1.2} />
 *
 * <Environment files={['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']} path="/cube/" />
 *
 * <Environment background resolution={128}>
 *   <mesh scale={50}>
 *     <sphereGeometry />
 *     <meshBasicMaterial color="skyblue" side={BackSide} />
 *   </mesh>
 * </Environment>
 * ```
 * @param props - {@link EnvironmentProps}
 * @category core
 * @standard
 */
export function Environment(props: EnvironmentProps): React.JSX.Element {
  if (props.color !== undefined && !props.files && !props.preset && !props.map) return <EnvironmentColor {...props} />;
  if (props.backgroundFiles && props.backgroundFiles !== props.files) return <EnvironmentDualSource {...props} />;
  return props.map ? (
    <EnvironmentMap {...props} />
  ) : props.children ? (
    <EnvironmentPortal {...props} />
  ) : (
    <EnvironmentCube {...props} />
  );
}

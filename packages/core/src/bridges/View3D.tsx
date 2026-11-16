import { View3D as PixiView3D } from '@pixi/3d';
import type { Camera3D, Container3D } from '@pixi/3d';
import { Rectangle } from 'pixi.js';
import type { Container } from 'pixi.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { JSX, ReactNode, Ref } from 'react';

import { OrthographicCamera } from '../../catalog/scene/OrthographicCamera';
import { PerspectiveCamera } from '../../catalog/scene/PerspectiveCamera';
import { Scene } from '../../catalog/scene/Scene';
import { useThree as coreUseThree } from '../../r3f/src/core/hooks/useStore';
import { createPortal as coreCreatePortal } from '../../r3f/src/core/portal';
import { applyProps as coreApplyProps, updateCamera as coreUpdateCamera } from '../../r3f/src/core/utils';
import type { CameraProps } from '../../types/canvas';
import type { ThreeElement } from '../../types/elements';
import type { DomEvent } from '../../types/events';
import type { RootState, Size } from '../../types/state';
import { computeEmbedded } from '../hitTest';
import { VIEW_IN_LAYER_Z_INDEX, ensureScreen, layerOf, releaseScreen } from '../screen';

const useThree = coreUseThree as unknown as <T>(selector: (state: RootState) => T) => T;
const applyProps = coreApplyProps as unknown as (object: object, props: object) => void;
const updateCamera = coreUpdateCamera as unknown as (camera: Camera3D, size: Size) => void;
const createPortal = coreCreatePortal as unknown as (
  children: ReactNode,
  container: Container3D,
  state: {
    camera: Camera3D;
    size: Size;
    events: { compute: (event: DomEvent, state: RootState, previous?: RootState) => void };
  },
) => JSX.Element;

/**
 * The props of {@link View3D}: a 2D container's props, the view's size and its camera, and the 3D it draws
 * @category types
 * @standard
 */
export interface View3DProps extends Omit<
  ThreeElement<typeof Container>,
  'width' | 'height' | 'children' | 'args' | 'ref'
> {
  /** The view's width, in the 2D's pixels */
  width: number;
  /** The view's height, in the 2D's pixels */
  height: number;
  /**
   * The view's camera, or props for its own, as `<Canvas camera>` takes them: a perspective camera with a
   * fov of 50 at z 5, looking at the origin, unless `orthographic`. A camera passed in is added to the
   * view's scene.
   */
  camera?: CameraProps;
  /** Make the view's own camera orthographic, as `<Canvas orthographic>` @default false */
  orthographic?: boolean;
  /** The 3D to draw, in the view's own scene */
  children?: ReactNode;
  /** Receives the 2D container that holds the view */
  ref?: Ref<Container>;
}

/** What a {@link View3D} makes and frees: its scene, its screen layer, its pixi-3d view and its camera */
interface Embedded {
  readonly scene: Scene;
  readonly screen: Container;
  readonly view: PixiView3D;
  readonly camera: Camera3D;
  readonly ownCamera: boolean;
  readonly hitArea: Rectangle;
}

/** Whether camera props are a camera */
const isCamera = (props: CameraProps | undefined): props is CameraProps & Camera3D =>
  (props as { isCamera?: boolean } | undefined)?.isCamera === true;

/** Whether two prop objects hold the same values, one level deep */
const sameProps = (a: object | undefined, b: object | undefined): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false;
  }
  return true;
};

/**
 * Keeps the portal's `size` in step with the view's, so `useThree((state) => state.size)` and the 2D
 * in the view read the view's size after it changes
 * @param props - The view's size
 */
function SyncSize({ width, height }: { width: number; height: number }): null {
  const set = useThree((state) => state.set);
  useLayoutEffect(() => {
    set((state) =>
      state.size.width === width && state.size.height === height ? {} : { size: { ...state.size, width, height } },
    );
  }, [set, width, height]);
  return null;
}

/**
 * 3D drawn inside the 2D: a pixi-3d view of a scene of its own, placed in the 2D tree like any 2D
 * container, so a model inside a 2D card moves, scales, turns, fades, masks and filters with the card.
 *
 * Its children are the view's scene, rendered through r3f's `createPortal`, with its own camera and
 * `size`: `useThree` inside it gives that camera and the view's size, and `useFrame` runs as usual. The
 * view draws its scene as a `<Canvas>` draws one, with three's tone mapping and output, the scene's
 * lights, fog, environment and background (`<color attach="background">` fills the view's rect), and
 * 2D in it draws on its own screen layer over or, with a negative `zIndex`, under its 3D, as in a
 * Canvas. It draws in the same pass as the rest of the 2D, with no extra canvas or render target.
 *
 * Events reach its 3D and 2D through its own camera, at the place the view has in the 2D's draw order:
 * 2D over the view is hit first, and a mask or `hitArea` above it clips its hits. A click anywhere on
 * the view reaches its own handlers after the 3D and 2D inside it and before the 2D around it, as a
 * child's before its parent's, with that container as the event's `object`. Its 2D props and handlers
 * are those of the container holding the view, whose `ref` it takes. Unmounting it frees the
 * view; its scene's children are the elements', which free themselves.
 * @example
 * ```tsx
 * <container2D x={40} y={40}>
 *   <graphics2D draw={(g) => g.roundRect(0, 0, 200, 240, 12).fill('#1d3557')} />
 *   <View3D x={20} y={20} width={160} height={160} camera={{ position: [0, 0, 4] }}>
 *     <ambientLight intensity={0.5} />
 *     <directionalLight position={[2, 3, 4]} />
 *     <mesh>
 *       <boxGeometry />
 *       <meshStandardMaterial color="orange" />
 *     </mesh>
 *   </View3D>
 * </container2D>
 * ```
 * @category core
 * @standard
 */
export function View3D({
  width,
  height,
  camera: cameraProps,
  orthographic = false,
  children,
  ref,
  ...props
}: View3DProps): JSX.Element {
  const renderer = useThree((state) => state.renderer);
  const [generation, setGeneration] = useState(0);
  const holder = useRef<Container | null>(null);
  const size = useRef({ width, height });
  size.current.width = width;
  size.current.height = height;

  const passedCamera = isCamera(cameraProps) ? cameraProps : null;
  const embedded = useMemo((): Embedded => {
    const scene = new Scene();
    const screen = ensureScreen(scene);
    const camera =
      passedCamera ??
      (orthographic
        ? new OrthographicCamera(0, 0, 0, 0, 0.1, 1000)
        : new PerspectiveCamera(50, width / height, 0.1, 1000));
    if (!passedCamera) {
      camera.position.z = 5;
      (camera as PerspectiveCamera).lookAt(0, 0, 0);
    }
    const view = new PixiView3D({ root: scene, camera, autoResize: false, width, height });
    view.zIndex = VIEW_IN_LAYER_Z_INDEX;
    layerOf(screen)!.addChildAt(view, 0);
    const hitArea = new Rectangle(0, 0, width, height);
    screen.hitArea = hitArea;
    return { scene, screen, view, camera, ownCamera: !passedCamera, hitArea };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `generation` makes new parts after an unmount freed them; the size is set below
  }, [passedCamera, orthographic, generation]);

  const lastCameraProps = useRef<CameraProps | undefined>(undefined);
  useLayoutEffect(() => {
    const { camera, ownCamera } = embedded;
    if (ownCamera && cameraProps && !sameProps(lastCameraProps.current, cameraProps)) {
      applyProps(camera, cameraProps);
    }
    lastCameraProps.current = cameraProps;
  }, [embedded, cameraProps]);

  useLayoutEffect(() => {
    const { view, camera, hitArea } = embedded;
    view.setSize(width, height);
    hitArea.width = width;
    hitArea.height = height;
    updateCamera(camera, { width, height, top: 0, left: 0 });
  }, [embedded, width, height]);

  useLayoutEffect(() => {
    if (embedded.view.destroyed || !holder.current) return;
    renderer.embedView(embedded.view, embedded.scene, holder.current);
    return () => renderer.releaseEmbeddedView(embedded.view);
  }, [renderer, embedded]);

  useEffect(() => {
    if (embedded.view.destroyed) setGeneration((count) => count + 1);
    return () => {
      const { scene, view } = embedded;
      view.destroy();
      releaseScreen(scene);
      scene.destroy();
    };
  }, [embedded]);

  const compute = useCallback(
    (event: DomEvent, state: RootState, previous?: RootState) =>
      computeEmbedded(event, state, embedded.screen, size.current.width, size.current.height, previous),
    [embedded],
  );

  const setHolder = useCallback(
    (container: Container | null) => {
      holder.current = container;
      if (typeof ref === 'function') ref(container);
      else if (ref) ref.current = container;
    },
    [ref],
  );

  return (
    <container2D ref={setHolder} {...props}>
      <primitive object={embedded.screen} />
      {createPortal(
        <>
          <SyncSize width={width} height={height} />
          {children}
        </>,
        embedded.scene,
        { camera: embedded.camera, size: { width, height, top: 0, left: 0 }, events: { compute } },
      )}
    </container2D>
  );
}

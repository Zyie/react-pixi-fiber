/*!
 * Adapted from react-three-fiber's packages/fiber/src/web/Canvas.tsx
 * MIT License, Copyright (c) 2019-2025 Poimandres
 */
import { FiberProvider } from 'its-fine';
import * as React from 'react';
import useMeasure from 'react-use-measure';

import type { DomEvent, SetBlock } from '#types';

import type { Scene } from '../catalog/Scene';
import { createPointerEvents } from '../r3f/src/core/events';
import { notifyRootExtensionsHmr } from '../r3f/src/core/extensions';
import { useStore } from '../r3f/src/core/hooks/useStore';
import { _roots } from '../r3f/src/core/root';
import {
  Block,
  ErrorBoundary,
  isRef,
  useBridge,
  useIsomorphicLayoutEffect,
  useMutableCallback,
} from '../r3f/src/core/utils';
import { useGate } from '../r3f/src/core/utils/react';
import type { CanvasProps, ReconcilerRoot } from '../types/canvas';
import type { RootState } from '../types/state';
import { createRoot } from './createRoot';

/**
 * Keeps `scene.background` on the colour `<Canvas background>` names
 * @param props - The colour, or `undefined` to leave the scene's own
 * @internal
 */
function Background({ color }: { color: CanvasProps['background'] }): null {
  const store = useStore();
  useIsomorphicLayoutEffect(() => {
    if (color === undefined) return;
    const { scene, invalidate } = store.getState();
    const target = scene as unknown as Scene;
    const previous = target.background;
    target.background = color;
    invalidate();
    return () => {
      target.background = previous;
    };
  }, [store, color]);
  return null;
}

function CanvasImpl({
  ref,
  children,
  fallback,
  resize,
  style,
  id,
  gl,
  renderer,
  scheduler,
  events = createPointerEvents as unknown as NonNullable<CanvasProps['events']>,
  eventSource,
  eventPrefix,
  orthographic,
  frameloop,
  dpr,
  performance,
  raycaster,
  camera,
  scene,
  autoUpdateFrustum,
  onPointerMissed,
  onDragOverMissed,
  onDropMissed,
  onCreated,
  hmr,
  width,
  height,
  background,
  forceEven,
  primary: _primary,
  share: _share,
  occlusion: _occlusion,
  ...divProps
}: CanvasProps): React.JSX.Element {
  const Bridge = useBridge();

  const [hasInitialSize, setHasInitialSize] = React.useState(false);
  const measureConfig = React.useMemo(
    () =>
      hasInitialSize
        ? { scroll: true, debounce: { scroll: 50, resize: 0 }, ...resize }
        : { ...resize, scroll: resize?.scroll ?? true, debounce: 0 },
    [hasInitialSize, resize],
  );
  const [containerRef, containerRect] = useMeasure(measureConfig);

  const effectiveSize = React.useMemo(() => {
    let w = width ?? containerRect.width;
    let h = height ?? containerRect.height;
    if (forceEven) {
      w = Math.ceil(w / 2) * 2;
      h = Math.ceil(h / 2) * 2;
    }
    return { width: w, height: h, top: containerRect.top, left: containerRect.left };
  }, [width, height, containerRect, forceEven]);

  if (!hasInitialSize && effectiveSize.width > 0 && effectiveSize.height > 0) setHasInitialSize(true);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => canvasRef.current!);

  const handlePointerMissed = useMutableCallback(onPointerMissed);
  const handleDragOverMissed = useMutableCallback(onDragOverMissed);
  const handleDropMissed = useMutableCallback(onDropMissed);
  const [block, setBlock] = React.useState<SetBlock>(false);
  const [error, setError] = React.useState<unknown>(false);
  const [fallbackVisible, setFallbackVisible] = React.useState(false);

  if (block) throw block;
  if (error) throw error;

  const root = React.useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const [gate, waitFor] = useGate();
  const rootState = React.useRef<RootState | null>(null);
  const eventTarget = (): HTMLElement | null =>
    eventSource ? (isRef(eventSource) ? eventSource.current : eventSource) : divRef.current;
  const pointerMissed = React.useCallback(
    (event: MouseEvent) => handlePointerMissed.current?.(event),
    [handlePointerMissed],
  );
  const dragOverMissed = React.useCallback(
    (event: DragEvent) => handleDragOverMissed.current?.(event),
    [handleDragOverMissed],
  );
  const dropMissed = React.useCallback((event: DragEvent) => handleDropMissed.current?.(event), [handleDropMissed]);

  useIsomorphicLayoutEffect(() => {
    if (fallbackVisible) return;
    const canvas = canvasRef.current;
    if (!(effectiveSize.width > 0 && effectiveSize.height > 0 && canvas)) return;

    root.current ??= createRoot<HTMLCanvasElement>(canvas);
    const current = root.current;
    current
      .configure({
        id,
        scheduler,
        gl,
        renderer,
        scene,
        events,
        orthographic,
        frameloop,
        dpr,
        performance,
        raycaster,
        camera,
        autoUpdateFrustum,
        size: effectiveSize,
        ...({ _sizeProps: width !== undefined || height !== undefined ? { width, height } : null } as {}),
        forceEven,
        onPointerMissed: pointerMissed,
        onDragOverMissed: dragOverMissed,
        onDropMissed: dropMissed,
        onCreated: (state) => {
          rootState.current = state;
          const target = eventTarget() ?? divRef.current;
          if (target) state.events.connect?.(target);
          if (eventPrefix) {
            state.setEvents({
              compute: (event, state) => {
                const x = event[`${eventPrefix}X` as keyof DomEvent] as number;
                const y = event[`${eventPrefix}Y` as keyof DomEvent] as number;
                state.pointer.set((x / state.size.width) * 2 - 1, -(y / state.size.height) * 2 + 1);
                state.raycaster.setFromCamera(state.pointer, state.camera);
              },
            });
          }
          onCreated?.(state);
        },
      })
      .catch((setupError: unknown) => {
        if (root.current !== current) return;
        if (fallback != null) setFallbackVisible(true);
        else setError(setupError);
      });

    if (current.ready.status === 'fulfilled') {
      current.render(
        <Bridge>
          <ErrorBoundary set={setError}>
            <React.Suspense fallback={<Block set={setBlock} />}>
              <Background color={background} />
              {children ?? null}
            </React.Suspense>
          </ErrorBoundary>
        </Bridge>,
      );
    } else if (current.ready.status === 'pending') {
      waitFor(current.ready);
    }
  });

  useIsomorphicLayoutEffect(() => {
    const store = canvasRef.current && _roots.get(canvasRef.current)?.store;
    if (!store) return;
    const report = (): void => {
      const storeError = store.getState().error;
      if (storeError) setError(storeError);
    };
    report();
    return store.subscribe(report);
  });

  React.useEffect(() => {
    const state = rootState.current?.get();
    const target = eventTarget();
    if (state && target && state.events.connected !== target) state.events.connect?.(target);
  });

  const insertionMounted = React.useRef(false);
  React.useInsertionEffect(() => {
    insertionMounted.current = true;
    return () => {
      insertionMounted.current = false;
      queueMicrotask(() => {
        if (insertionMounted.current) return;
        const current = root.current;
        root.current = null;
        current?.unmount();
      });
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return () => {
      if (canvas.isConnected) return;
      const current = root.current;
      root.current = null;
      current?.unmount();
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const hot = import.meta.hot;
    if (hmr === false || !canvas || !hot) return;
    const handleHMR = (): void => {
      queueMicrotask(() => {
        const entry = _roots.get(canvas);
        if (entry?.store) notifyRootExtensionsHmr(entry.store);
      });
    };
    hot.on('vite:afterUpdate', handleHMR);
    return () => hot.off('vite:afterUpdate', handleHMR);
  }, [hmr]);

  return (
    <div
      ref={divRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: eventSource ? 'none' : 'auto',
        ...style,
      }}
      {...divProps}
    >
      {fallbackVisible ? (
        fallback
      ) : (
        <div ref={containerRef} className="r3f-canvas-container" style={{ width: '100%', height: '100%' }}>
          <canvas
            ref={canvasRef}
            id={id}
            className="r3f-canvas"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            {fallback}
          </canvas>
        </div>
      )}
      {gate}
    </div>
  );
}

/**
 * A canvas that renders its children with pixi-3d, r3f's `<Canvas>`
 *
 * It fills its parent, measures it, and creates a root on the canvas inside. The props are r3f's,
 * typed against pixi-3d. Unlike r3f's, it doesn't load three's `<Environment>`: `background` takes a
 * colour only. Every canvas gets its own renderer; `primary` and `share` are ignored.
 * @example
 * ```tsx
 * import { Canvas } from 'react-pixi-fiber';
 *
 * <Canvas camera={{ position: [0, 0, 5] }} background="#202025">
 *   <ambientLight intensity={0.5} />
 *   <mesh>
 *     <boxGeometry />
 *     <meshStandardMaterial color="hotpink" />
 *   </mesh>
 * </Canvas>;
 * ```
 * @param props - r3f's canvas props
 * @category core
 * @standard
 */
export function Canvas(props: CanvasProps): React.JSX.Element {
  return (
    <FiberProvider>
      <CanvasImpl {...props} />
    </FiberProvider>
  );
}

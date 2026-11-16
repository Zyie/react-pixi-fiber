import { Container3D } from '@pixi/3d';
import type { RenderTexture } from 'pixi.js';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { JSX, ReactNode, Ref } from 'react';

import { Scene } from '../../catalog/scene/Scene';
import { useRenderTarget } from '../../environment/hooks/useRenderTarget';
import type { RenderTargetOptions } from '../../environment/RenderTarget';
import type { WebGLRenderTarget } from '../../environment/WebGLRenderTarget';
import { IN_3D, drawOrder, layerOrderOf, setLayerOrder } from '../../events/hitOrder';
import { useFrame as coreUseFrame } from '../../r3f/src/core/hooks/useFrame';
import { createPortal as coreCreatePortal } from '../../r3f/src/core/portal';
import type { Instance } from '../../types/elements';
import type { DomEvent } from '../../types/events';
import type { RootState, Size } from '../../types/state';
import { ensureScreen } from '../screen';

type Compute = (event: DomEvent, state: RootState, previous?: RootState) => void;

const useFrame = coreUseFrame as unknown as (callback: (state: RootState) => void) => void;
const createPortal = coreCreatePortal as unknown as (
  children: ReactNode,
  container: Container3D,
  state: { size: Size; events: { compute: Compute } },
) => JSX.Element;

/**
 * What a {@link RenderTexture2D}'s `ref` receives
 * @category types
 * @standard
 */
export interface RenderTexture2DHandle {
  /** The texture the 2D is drawn into, which the 3D object's material shows */
  readonly texture: RenderTexture;
  /** The render target the texture belongs to */
  readonly target: WebGLRenderTarget;
  /**
   * Draws the 2D into the texture again, on the next frames
   * @param frames - How many frames to draw it on @default 1
   */
  invalidate(frames?: number): void;
}

/**
 * The props of {@link RenderTexture2D}
 * @category types
 * @standard
 */
export interface RenderTexture2DProps {
  /** The texture's width in pixels, which the 2D is laid out in */
  width: number;
  /** The texture's height in pixels */
  height: number;
  /** Where the texture attaches on the element it is inside, as r3f's `attach` @default 'map' */
  attach?: string;
  /**
   * How many frames to draw the 2D on after each render of this component; `Infinity` draws it every
   * frame. With a number, call the handle's `invalidate` when what the 2D shows changes. @default Infinity
   */
  frames?: number;
  /** The render target's settings, such as `samples` for smooth edges */
  options?: RenderTargetOptions;
  /**
   * How pointer events reach the 2D, as r3f's `events.compute`; the default finds the pointer through
   * the texture coordinates of the 3D object's hit, as drei's `<RenderTexture>` does
   */
  compute?: Compute;
  /** The 2D to draw, in CSS pixels from the texture's top-left corner */
  children?: ReactNode;
  /** Receives the texture, its target and `invalidate` */
  ref?: Ref<RenderTexture2DHandle>;
}

/**
 * The 3D object a texture attaches to, through the element tree: the mesh whose material holds it
 * @param texture - The texture
 */
function objectOf(texture: RenderTexture): Container3D | null {
  let instance = (texture as RenderTexture & { __r3f?: Instance }).__r3f?.parent ?? null;
  while (instance && !(instance.object instanceof Container3D)) instance = instance.parent;
  return (instance?.object as Container3D | undefined) ?? null;
}

/**
 * 2D drawn into a texture for 3D: a 2D UI on a 3D screen, a label texture that changes. Put it inside
 * a material and its texture becomes the material's `map`, or what `attach` names.
 *
 * Its children are a 2D scene of their own, rendered through r3f's `createPortal` with `size` set to the
 * texture's, so `useThree((state) => state.size)` gives the texture's size and 2D lays out in its
 * pixels from the top-left corner. It is drawn into the texture on every frame, before the canvas is,
 * or only on `frames` frames after each render and each `invalidate()`.
 *
 * Pointer events on the 3D object reach the 2D at the texture coordinates of the hit, as drei's
 * `<RenderTexture>` forwards them, and sort where the 3D object is hit: 3D in front of it, or a HUD
 * over it, is hit first. `global` on a 2D event is in the texture's pixels. The texture is freed when
 * it unmounts.
 * @example
 * ```tsx
 * <mesh>
 *   <planeGeometry args={[2, 1]} />
 *   <meshBasicMaterial>
 *     <RenderTexture2D width={512} height={256}>
 *       <graphics2D draw={(g) => g.rect(0, 0, 512, 256).fill('#1d3557')} />
 *       <text2D text="Hello" x={24} y={24} style={{ fill: 'white', fontSize: 64 }} />
 *     </RenderTexture2D>
 *   </meshBasicMaterial>
 * </mesh>
 * ```
 * @category core
 * @standard
 */
export function RenderTexture2D({
  width,
  height,
  attach = 'map',
  frames = Infinity,
  options,
  compute,
  children,
  ref,
}: RenderTexture2DProps): JSX.Element {
  const target = useRenderTarget(width, height, options);
  const [generation, setGeneration] = useState(0);
  const scene = useMemo(() => {
    const own = new Scene();
    ensureScreen(own);
    return own;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `generation` makes a new scene after an unmount freed it
  }, [generation]);
  const remaining = useRef(frames);

  useLayoutEffect(() => {
    remaining.current = Math.max(remaining.current, frames);
  });

  useEffect(() => {
    if (scene.destroyed) setGeneration((count) => count + 1);
    return () => scene.destroy();
  }, [scene]);

  useImperativeHandle(
    ref,
    () => ({
      texture: target.texture,
      target,
      invalidate: (count = 1) => {
        remaining.current = Math.max(remaining.current, count);
      },
    }),
    [target],
  );

  useFrame(({ renderer, camera }) => {
    if (remaining.current <= 0 || scene.destroyed) return;
    remaining.current--;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(previous);
  });

  const uvCompute = useCallback<Compute>(
    (event, state, previous) => {
      const object = objectOf(target.texture);
      if (!previous || !object) return;
      if (previous.raycaster.camera === undefined) {
        previous.events.compute?.(event, previous, previous.previousRoot?.getState());
      }
      const [hit] = previous.raycaster.intersectObject(object, true);
      if (!hit?.uv) return;
      state.pointer.set(hit.uv.x * 2 - 1, hit.uv.y * 2 - 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
      setLayerOrder(state.raycaster, drawOrder(layerOrderOf(previous.raycaster), IN_3D, hit.distance));
    },
    [target],
  );

  return (
    <>
      {createPortal(children, scene, {
        size: { width, height, top: 0, left: 0 },
        events: { compute: compute ?? uvCompute },
      })}
      <primitive object={target.texture} attach={attach} />
    </>
  );
}

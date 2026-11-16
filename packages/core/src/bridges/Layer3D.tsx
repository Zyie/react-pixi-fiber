import { useThree as coreUseThree } from '@react-fiber/r3f/src/core/hooks/useStore';
import type { Container } from 'pixi.js';
import { useLayoutEffect } from 'react';
import type { JSX, ReactNode, Ref } from 'react';

import { VIEW_Z_INDEX, ensureScreen, layerOf } from '../stage/screen';
import type { ThreeElement } from '../types/elements';
import type { RootState } from '../types/state';

const useThree = coreUseThree as unknown as <T>(selector: (state: RootState) => T) => T;

/**
 * The props of {@link Layer3D}: a 2D container's props, applied to the scene's 3D layer
 * @category types
 * @standard
 */
export interface Layer3DProps extends Omit<ThreeElement<typeof Container>, 'children' | 'args' | 'ref'> {
  /** Filters and a mask for the 3D layer: `<blurFilter2D attach="filters-0" />`, `<graphics2D attach="mask" />` */
  children?: ReactNode;
  /** Receives the 3D layer */
  ref?: Ref<Container>;
}

/**
 * Puts a 3D layer back as its screen layer made it, once no `<Layer3D>` sets it. It runs before r3f
 * detaches the filter children, which delete their entries from the list, so the filters are emptied
 * rather than taken away.
 * @param layer - The 3D layer
 */
function resetLayer(layer: Container): void {
  if (layer.destroyed) return;
  layer.position.set(0, 0);
  layer.scale.set(1, 1);
  layer.pivot.set(0, 0);
  layer.skew.set(0, 0);
  layer.rotation = 0;
  layer.alpha = 1;
  layer.visible = true;
  layer.zIndex = VIEW_Z_INDEX;
  layer.filters = [];
  layer.mask = null;
  layer.blendMode = 'inherit';
  layer.tint = 0xffffff;
}

/**
 * The scene's 3D as a 2D node: its props apply to the 3D layer, the pixi.js container that holds the
 * scene's view and the 2D anchored to its 3D. Move it to shake the screen, fade it, scale it into a
 * corner, and give it pixi's filters as post-processing (blur, colour matrix, displacement) or a mask.
 *
 * Its children attach to the layer: `<blurFilter2D attach="filters-0" />` or `<graphics2D attach="mask" />`.
 * Pointer events follow the layer's transform, so the 3D picks where it is drawn. It acts on the scene
 * of the canvas or portal it is in, wherever in the tree it is placed, and puts the layer back as it
 * was when it unmounts. Its `zIndex`, just under 0 by default, places the 3D among the screen's 2D.
 * @example
 * ```tsx
 * function Shake({ strength }: { strength: number }) {
 *   const layer = useRef<Container>(null);
 *   useFrame(({ elapsed }) => {
 *     layer.current!.x = Math.sin(elapsed * 60) * strength;
 *   });
 *   return (
 *     <Layer3D ref={layer}>
 *       <blurFilter2D attach="filters-0" strength={strength} />
 *     </Layer3D>
 *   );
 * }
 * ```
 * @category core
 * @standard
 */
export function Layer3D({ children, ref, ...props }: Layer3DProps): JSX.Element {
  const scene = useThree((state) => state.scene);
  const layer = layerOf(ensureScreen(scene))!;

  useLayoutEffect(() => () => resetLayer(layer), [layer]);

  return (
    <primitive object={layer} ref={ref} {...(props as Record<string, unknown>)}>
      {children}
    </primitive>
  );
}

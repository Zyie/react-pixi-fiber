import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';
import { useThree } from 'react-pixi-fiber';

import { Grid } from './grid';

/**
 * A camera in the scene that takes over as the default camera, as drei's `makeDefault` does: it sets
 * its aspect from the canvas and updates its projection, aims itself, and hands itself to
 * `set({ camera })`, giving the previous camera back when it unmounts
 */
export function DefaultCamera({ position, fov = 50 }: { position: [number, number, number]; fov?: number }) {
  const camera = useRef<ElementRef<'perspectiveCamera'>>(null);
  const set = useThree((state) => state.set);
  const get = useThree((state) => state.get);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    const own = camera.current!;
    own.aspect = size.width / size.height;
    own.updateProjectionMatrix();
    own.lookAt(0, 0, 0);
    const previous = get().camera;
    set({ camera: own });
    return () => set({ camera: previous });
  }, [get, set, size]);

  return <perspectiveCamera ref={camera} position={position} fov={fov} />;
}

/**
 * A `<perspectiveCamera>` made the default camera with `set({ camera })`: it looks at the grid from high
 * up and to the right, so the grid is seen from above at an angle, its right end nearer and larger
 */
export const scene: TestScene = {
  render: () => (
    <>
      <DefaultCamera position={[4, 4, 5]} fov={45} />
      <Grid />
    </>
  ),
};

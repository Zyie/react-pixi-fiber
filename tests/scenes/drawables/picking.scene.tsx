import type { TestScene } from '@test-scene';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useThree } from 'react-pixi-fiber';
import { BufferGeometry, Vector3 } from 'react-pixi-fiber/three';

/** A drawable that turns hot pink once clicked */
function useClicked(): [string, () => void] {
  const [clicked, setClicked] = useState(false);
  return [clicked ? '#ff4fa3' : '#9db4c0', () => setClicked(true)];
}

/** Sets the raycaster's point and line thresholds, as `<Canvas raycaster>` would */
function Thresholds() {
  const get = useThree((state) => state.get);
  useLayoutEffect(() => {
    const { params } = get().raycaster;
    params.Points.threshold = 0.1;
    params.Line.threshold = 0.1;
  }, [get]);
  return null;
}

function Cloud() {
  const [color, onClick] = useClicked();
  return (
    <points position={[-1.8, 0, 0]} onClick={onClick}>
      <sphereGeometry args={[0.9, 12, 8]} />
      <pointsMaterial size={0.15} color={color} />
    </points>
  );
}

function Zigzag() {
  const [color, onClick] = useClicked();
  const geometry = useMemo(
    () =>
      new BufferGeometry().setFromPoints([-1, 0, 1, 2].map((i) => new Vector3(i * 0.5 - 0.25, i % 2 ? 0.8 : -0.8, 0))),
    [],
  );
  return (
    <threeLine geometry={geometry} onClick={onClick}>
      <lineBasicMaterial color={color} />
    </threeLine>
  );
}

function Badge() {
  const [color, onClick] = useClicked();
  return (
    <sprite position={[1.8, 0, 0]} scale={[1.4, 1.4, 1]} onClick={onClick}>
      <spriteMaterial color={color} />
    </sprite>
  );
}

/**
 * Clicks pick points, lines and sprites through their own `raycast`, with three's thresholds:
 * `Points` within 0.1 of a point and `Line` within 0.1 of a segment (`raycaster.params`), and a sprite
 * anywhere on its camera-facing quad. Each turns pink when it is hit; a click beside the line misses.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Thresholds />
      <Cloud />
      <Zigzag />
      <Badge />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(59, 150);
    await frames();
    await mouse.click(200, 150);
    await frames();
    await mouse.click(316, 150);
    await frames();
  },
};

import { setRenderOverride, useStore } from '@react-fiber/threejs-compat';
import { PerspectiveCamera } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useMemo } from 'react';

/** Replaces the root's render with one from a camera above the scene, through `setRenderOverride` */
function TopView() {
  const store = useStore();
  const camera = useMemo(() => {
    const top = new PerspectiveCamera(50, 4 / 3, 0.1, 100);
    top.position.set(0, 7, 0.01);
    top.lookAt(0, 0, 0);
    return top;
  }, []);

  useLayoutEffect(() => {
    setRenderOverride(store, () => {
      const { renderer, scene } = store.getState();
      renderer.render(scene, camera);
    });
    return () => setRenderOverride(store, null);
  }, [store, camera]);

  return null;
}

/**
 * `setRenderOverride` takes the root's render over: the three boxes in a row along X, seen from straight
 * above rather than from the default camera in front
 */
export const scene: TestScene = {
  frames: 2,
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 5, 3]} intensity={2} />
      {['#e63946', '#2a9d8f', '#457b9d'].map((color, index) => (
        <mesh key={color} position={[(index - 1) * 1.8, 0, index === 1 ? -1 : 0]}>
          <boxGeometry />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <TopView />
    </>
  ),
};

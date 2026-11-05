import type { TestScene } from '@test-scene';
import { useMemo } from 'react';
import { useFrame } from 'react-pixi-fiber';
import { PerspectiveCamera } from 'react-pixi-fiber/three';

/** Where each quarter sits, from the bottom-left corner, what it clears to and where its camera stands */
const QUARTERS: { x: number; y: number; clear: string; eye: [number, number, number] }[] = [
  { x: 0, y: 0, clear: '#264653', eye: [0, 0, 6] },
  { x: 1, y: 0, clear: '#e9c46a', eye: [6, 0, 0] },
  { x: 0, y: 1, clear: '#2a9d8f', eye: [0, 6, 0.01] },
  { x: 1, y: 1, clear: '#f4a261', eye: [-4, 3, 4] },
];

/**
 * r3f's MultiView pattern: a job in the render phase draws the scene four times, each into a quarter of
 * the canvas with `setViewport`, `setScissor` and `setScissorTest`, clearing its quarter to its own colour
 */
function Quarters() {
  const cameras = useMemo(
    () =>
      QUARTERS.map(({ eye }) => {
        const camera = new PerspectiveCamera(50, 4 / 3, 0.1, 100);
        camera.position.set(...eye);
        camera.lookAt(0, 0, 0);
        return camera;
      }),
    [],
  );

  useFrame(
    ({ renderer, scene, size }) => {
      const width = size.width / 2;
      const height = size.height / 2;
      QUARTERS.forEach(({ x, y, clear }, index) => {
        renderer.setViewport(x * width, y * height, width, height);
        renderer.setScissor(x * width, y * height, width, height);
        renderer.setScissorTest(true);
        renderer.setClearColor(clear);
        renderer.render(scene, cameras[index]);
      });
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, size.width, size.height);
    },
    { phase: 'render' },
  );

  return null;
}

/**
 * One scene seen four ways: from the front on dark teal at the bottom left, from the right on yellow at
 * the bottom right, from above on teal at the top left and from a corner on orange at the top right.
 * Each quarter keeps its own clear colour, which only works if a scissored clear stays in its quarter.
 */
export const scene: TestScene = {
  frames: 2,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <mesh>
        <boxGeometry args={[1.6, 1, 1]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.4, 32, 16]} />
        <meshStandardMaterial color="#f1faee" />
      </mesh>
      <Quarters />
    </>
  ),
};

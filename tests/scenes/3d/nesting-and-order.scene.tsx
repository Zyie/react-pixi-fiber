import type { Container3D } from '@pixi/3d';
import { useFrame } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useRef } from 'react';

const COLORS: Record<string, string> = { red: '#e6194b', green: '#3cb44b', blue: '#4363d8', yellow: '#ffe119' };

/** Cubes laid out left to right in the order the container holds them, read from its children each frame */
function Row({ keys }: { keys: string[] }) {
  const row = useRef<Container3D>(null);

  useFrame(() => {
    const { children } = row.current!;
    children.forEach((child, index) => child.position.set((index - (children.length - 1) / 2) * 1.3, 0, 0));
  });

  return (
    <container3D ref={row} position={[0, -1.1, 0]}>
      {keys.map((key) => (
        <mesh3D key={key} angle={[20, 30, 0]}>
          <cubeGeometry3D args={[{ width: 0.9, height: 0.9, depth: 0.9 }]} />
          <phongMaterial3D baseColor={COLORS[key]} />
        </mesh3D>
      ))}
    </container3D>
  );
}

/** Two levels of containers: the outer one turned 30 degrees around z, the inner one moved along its x */
function Nested() {
  return (
    <container3D position={[0, 1.1, 0]} angle={[0, 0, 30]}>
      <mesh3D scale={0.5}>
        <sphereGeometry3D />
        <phongMaterial3D baseColor="#f58231" />
      </mesh3D>
      <container3D position={[1.6, 0, 0]} scale={0.5}>
        <mesh3D>
          <sphereGeometry3D />
          <phongMaterial3D baseColor="#911eb4" />
        </mesh3D>
      </container3D>
    </container3D>
  );
}

/**
 * Nesting and order. Above: an orange sphere in a container turned 30 degrees around z, and a smaller
 * purple sphere in a container inside it moved 1.6 along its parent's x, so the pair rises to the
 * right. Below: a row of cubes placed by their index among the container's children. It starts red,
 * blue; a green cube is inserted before blue; then the keys are reordered to yellow (new), blue, red,
 * green, which r3f does with `add` before a sibling. Left to right at the end: yellow, blue, red, green.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Nested />
      <Row keys={['red', 'blue']} />
    </>
  ),
  act: async ({ update, frames }) => {
    const scene = (keys: string[]) => (
      <>
        <ambientLight3D intensity={0.3} />
        <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
        <Nested />
        <Row keys={keys} />
      </>
    );
    await update(scene(['red', 'green', 'blue']));
    await frames();
    await update(scene(['yellow', 'blue', 'red', 'green']));
  },
};

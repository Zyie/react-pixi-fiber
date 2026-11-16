import type { Mesh3D } from '@pixi/3d';
import { useFrame, useThree } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { useRef } from 'react';

/** A cube that turns half a turn a second around y, by `useFrame`'s delta */
function Spinner() {
  const mesh = useRef<Mesh3D>(null);
  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta * Math.PI;
  });
  return (
    <mesh3D ref={mesh} angle={[25, 0, 0]}>
      <cubeGeometry3D args={[{ width: 1.4, height: 1.4, depth: 1.4 }]} />
      <phongMaterial3D baseColor="#4363d8" />
    </mesh3D>
  );
}

/** A small sphere put at the right edge of the viewport at z = 0, from `useThree`'s viewport */
function EdgeMarker() {
  const width = useThree((state) => state.viewport.width);
  return (
    <mesh3D position={[width / 2 - 0.4, 0, 0]} scale={0.3}>
      <sphereGeometry3D />
      <flatMaterial3D baseColor="#ffe119" />
    </mesh3D>
  );
}

/**
 * `useFrame` and `useThree` on @pixi/3d's default camera: a blue cube tilted toward the camera and
 * turned a quarter turn plus 45 degrees around y by `useFrame` over 45 frames, so a corner faces the
 * camera; and a yellow disc whose x comes from `useThree`'s viewport, its right side just inside the
 * right edge of the canvas.
 */
export const scene: TestScene = {
  frames: 46,
  render: () => (
    <>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <Spinner />
      <EdgeMarker />
    </>
  ),
};

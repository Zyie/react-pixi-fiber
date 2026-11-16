import type { Mesh3D } from '@pixi/3d';
import { useFrame } from '@react-fiber/core';
import type { ThreeElements } from '@react-fiber/core';
import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useRef } from 'react';

/** A tag drawn over a 3D object: a dark rounded box with white text, its bottom middle on the point */
function Tag({ text, ...props }: { text: string } & Omit<ThreeElements['anchor2D'], 'children'>) {
  return (
    <anchor2D center={[0.5, 1]} point={[0, 0.7, 0]} {...props}>
      <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 90, 30, 8).fill({ color: 0x111111, alpha: 0.85 })} />
      <text2D text={text} anchor={0.5} x={45} y={15} style={{ fill: 'white', fontSize: 16, fontFamily: 'Arial' }} />
    </anchor2D>
  );
}

/** A cube that `useFrame` moves from one side to the other on every frame, and its tag */
function Jumper() {
  const mesh = useRef<Mesh3D>(null);
  useFrame(({ elapsed }) => {
    mesh.current!.position.x = Math.round(elapsed * 60) % 2 === 0 ? -1.4 : 1.4;
  });

  return (
    <mesh3D ref={mesh} position={[-1.4, -1.2, 0]} scale={0.6}>
      <cubeGeometry3D />
      <phongMaterial3D baseColor="#e9c46a" />
      <Tag text="moving" />
    </mesh3D>
  );
}

/**
 * `<anchor2D>` on @pixi/3d's nodes. Each cube carries a tag whose bottom middle sits 0.7 above its
 * centre: "near" over the blue cube at the left, which also holds a bare `<sprite2D>`, a white square at
 * its centre; "far" over the orange cube set back on the right, drawn smaller by `distanceFactor`;
 * "moving" over the yellow cube at the bottom right, which `useFrame` moves between the left and the
 * right on every frame, so the tag is in the same frame as the 3D. The red cube's tag is hidden: its
 * point, the cube's centre, is behind the green slab, which `occlude` finds with core's raycaster.
 */
export const scene: TestScene = {
  frames: 28,
  render: () => (
    <>
      <ambientLight3D intensity={0.4} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2.5} />
      <mesh3D position={[-1.6, 0.4, 0]} scale={0.8}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#457b9d" />
        <Tag text="near" />
        <sprite2D texture={Texture.WHITE} width={12} height={12} anchor={0.5} />
      </mesh3D>
      <mesh3D position={[2.2, 0.8, -3]} scale={0.8}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#f4a261" />
        <Tag text="far" distanceFactor={4} />
      </mesh3D>
      <mesh3D position={[0.1, 0, 1]}>
        <cubeGeometry3D args={[{ width: 1, height: 1, depth: 0.4 }]} />
        <phongMaterial3D baseColor="#2a9d8f" />
      </mesh3D>
      <mesh3D position={[1, 0, -2]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor="#e6194b" />
        <Tag text="occluded" point={[0, 0, 0]} occlude />
      </mesh3D>
      <Jumper />
    </>
  ),
};

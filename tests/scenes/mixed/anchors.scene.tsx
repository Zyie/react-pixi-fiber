import { useFrame } from '@react-fiber/core';
import type { ThreeElements } from '@react-fiber/core';
import type { Mesh } from '@react-fiber/threejs-compat/three';
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

/**
 * A box that `useFrame` moves from one side to the other on every frame, and its tag, which sits over
 * it only if it follows in the same frame: a frame late, it would be on the other side
 */
function Jumper() {
  const mesh = useRef<Mesh>(null);
  useFrame(({ elapsed }) => {
    mesh.current!.position.x = Math.round(elapsed * 60) % 2 === 0 ? -1.4 : 1.4;
  });

  return (
    <mesh ref={mesh} position={[-1.4, -1.2, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#e9c46a" />
      <Tag text="moving" />
    </mesh>
  );
}

/**
 * 2D anchored to 3D. Each box carries an `<anchor2D>` tag whose bottom middle sits 0.7 above its
 * centre: "near" over the blue box at the left; "far" over the orange box set back on the right, drawn
 * smaller by `distanceFactor`; "moving" over the yellow box at the bottom right, which `useFrame` moves
 * between the left and the right on every frame, so the tag is in the same frame as the 3D. The blue box
 * also holds a bare `<sprite2D>`, a white square at its centre. Three tags are hidden: the red box's,
 * whose centre is behind the green box, which `occlude` finds; one whose point is behind the camera; one
 * inside a group set invisible.
 */
export const scene: TestScene = {
  frames: 28,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <mesh position={[-1.6, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#457b9d" />
        <Tag text="near" />
        <sprite2D texture={Texture.WHITE} width={12} height={12} anchor={0.5} />
      </mesh>
      <mesh position={[2.2, 0.8, -3]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#f4a261" />
        <Tag text="far" distanceFactor={4} />
      </mesh>
      <mesh position={[0.1, 0, 1]}>
        <boxGeometry args={[1, 1, 0.4]} />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>
      <mesh position={[1, 0, -2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
        <Tag text="occluded" point={[0, 0, 0]} occlude />
      </mesh>
      <group visible={false}>
        <mesh position={[1.6, -1, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <Tag text="invisible" />
        </mesh>
      </group>
      <Tag text="behind" point={[0, 0, 7]} />
      <Jumper />
    </>
  ),
};

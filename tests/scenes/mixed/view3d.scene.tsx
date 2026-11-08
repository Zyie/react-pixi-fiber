import type { TestScene } from '@test-scene';
import { Texture } from 'pixi.js';
import { useRef } from 'react';
import { View3D, useFrame } from 'react-pixi-fiber';
import type { Mesh } from 'react-pixi-fiber/three';

/** A lit box that `useFrame` turns, in whatever scene it is rendered into */
function Spinner({ color }: { color: string }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} />
      <mesh ref={mesh} rotation-x={0.5}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

/**
 * 3D inside 2D. The canvas draws its own green box in the middle. Each card is a 2D container holding a
 * `<View3D>` of a scene of its own. The left card is turned 8 degrees and faded to 80%; its view has a
 * dark blue `<color attach="background">`, which fills the view's rect, an orange box, a white 2D bar
 * over its 3D and a pink 2D disc behind it (`zIndex={-1}`). The right card's view, a purple box on
 * nothing, is in a container masked by a circle, so only a round window of it shows.
 */
export const scene: TestScene = {
  frames: 30,
  render: () => (
    <>
      <Spinner color="#5ec27a" />
      <container2D x={30} y={60} angle={8} alpha={0.8}>
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 130, 170, 10).fill('#e0e0e0')} />
        <View3D x={10} y={10} width={110} height={110}>
          <color attach="background" args={['#1d3557']} />
          <Spinner color="#f4a261" />
          <sprite2D texture={Texture.WHITE} x={10} y={90} width={90} height={10} />
          <graphics2D zIndex={-1} draw={(graphics) => graphics.circle(80, 25, 22).fill('hotpink')} />
        </View3D>
      </container2D>
      <container2D x={250} y={70}>
        <graphics2D draw={(graphics) => graphics.roundRect(0, 0, 130, 150, 10).fill('#3a3a3a')} />
        <container2D x={10} y={10}>
          <graphics2D attach="mask" draw={(graphics) => graphics.circle(55, 55, 36).fill('white')} />
          <View3D width={110} height={110} camera={{ position: [0, 0, 3.5] }}>
            <Spinner color="#9b5de5" />
          </View3D>
        </container2D>
      </container2D>
    </>
  ),
};

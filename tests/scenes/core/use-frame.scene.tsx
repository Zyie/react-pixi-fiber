import type { TestScene } from '@test-scene';
import { useRef } from 'react';
import type { ElementRef } from 'react';
import { useFrame } from 'react-pixi-fiber';

/** Turns a box by one radian a second of the scene's clock */
function Spinner() {
  const mesh = useRef<ElementRef<'mesh'>>(null);

  useFrame((_, delta) => {
    mesh.current!.rotation.y += delta;
  });

  return (
    <mesh ref={mesh} rotation={[0.4, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#5ec27a" />
    </mesh>
  );
}

/**
 * `useFrame` after 46 frames: the first has a delta of 0 and each after it a sixtieth of a second, so
 * the box has turned by 0.75 radians about y
 */
export const scene: TestScene = {
  frames: 46,
  render: () => (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 4]} />
      <Spinner />
    </>
  ),
};

import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

type Spot = ElementRef<'spotLight'>;

/** A spot light whose target is moved with `target-position`, then refreshed with `updateMatrixWorld()` */
function MovedTarget() {
  const light = useRef<Spot>(null);

  useLayoutEffect(() => light.current!.target.updateMatrixWorld(), []);

  return <spotLight ref={light} position={[-2.2, 4, 0]} angle={0.3} intensity={40} target-position={[-2.2, 0, 0]} />;
}

/** A spot light aimed at a marker in the scene, by setting its `target` once both have mounted */
function AimedSpot() {
  const light = useRef<Spot>(null);
  const marker = useRef<ElementRef<'mesh'>>(null);

  useLayoutEffect(() => {
    light.current!.target = marker.current!;
  }, []);

  return (
    <>
      <spotLight ref={light} position={[1.5, 4, -1]} args={['#ffb347', 50, 0, 0.45, 0.5]} />
      <mesh ref={marker} position={[2, 0.15, 0.6]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </>
  );
}

/**
 * Three spot lights over a grey floor with a dim ambient light, aimed the three ways three allows. The
 * left one is white with a hard edge; its `target-position` is under it and `updateMatrixWorld()` makes
 * the target take it, so it draws a round pool below. The middle one is blue; its `target-position` is
 * under it too, but its target is in no scene and never updated, so, as in three, it still aims at the
 * origin, and its pool is a long ellipse reaching from the back toward the middle. The right one is
 * orange and soft-edged (`penumbra` 0.5), aimed at the small box in the scene, which it lights from above.
 */
export const scene: TestScene = {
  camera: { position: [0, 6, 6] },
  render: () => (
    <>
      <ambientLight intensity={0.05} />
      <MovedTarget />
      <spotLight position={[0, 3, -2.5]} color="#7fb8ff" angle={0.3} intensity={30} target-position={[0, 0, -2.5]} />
      <AimedSpot />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  ),
};

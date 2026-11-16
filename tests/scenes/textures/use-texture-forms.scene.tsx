import { useTexture } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

function FromArray() {
  const [quadrants, checker] = useTexture(['/textures/quadrants.png?forms', '/textures/checker.png?forms']);

  return (
    <>
      <mesh position={[-2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial map={quadrants} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial map={checker} />
      </mesh>
    </>
  );
}

function FromRecord() {
  const props = useTexture({ map: '/textures/quadrants.png?forms-record' });

  return (
    <mesh position={[2, 0, 0]} rotation={[0, -0.5, 0]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

/**
 * `useTexture` with a list of URLs, one texture each in order (left and middle), and with a record,
 * whose result spreads into a lit material as its `map` (right, turned away from the light)
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[1, 2, 4]} intensity={2} />
      <FromArray />
      <FromRecord />
    </>
  ),
};

import { Environment } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';

/** `<Environment color>` only sets a plain background: teal behind an unlit-by-environment orange box */
export const scene: TestScene = {
  render: () => (
    <>
      <Environment color="#2a9d8f" />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <mesh rotation={[0.4, 0.6, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#f4a261" />
      </mesh>
    </>
  ),
};

import type { TestScene } from '@test-scene';

const DEPTHS = [0, -3, -6, -9, -12];

function FoggyRow({ color, near, far }: { color: string; near: number; far: number }) {
  return (
    <>
      <color attach="background" args={[color]} />
      <fog attach="fog" args={['white', 1, 100]} color={color} near={near} far={far} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      {DEPTHS.map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
      ))}
    </>
  );
}

/**
 * Fog changed while the scene runs: it starts dark blue and thin (near 10, far 40), then a second render
 * makes it maroon and thick (near 2, far 9), with the background following. After the change only the
 * front two boxes show, the second one half in the fog.
 */
export const scene: TestScene = {
  camera: { position: [2.5, 1.5, 5] },
  render: () => <FoggyRow color="#1b2a4a" near={10} far={40} />,
  act: async ({ update }) => {
    await update(<FoggyRow color="#4a1b24" near={2} far={9} />);
  },
};

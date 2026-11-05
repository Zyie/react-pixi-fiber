import type { TestScene } from '@test-scene';

/** Two boxes in a list; the left one, keyed `a`, is rendered only when `withA` */
function List({ withA }: { withA: boolean }) {
  return (
    <>
      {withA && (
        <mesh key="a" position={[-1.5, 0, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshBasicMaterial color="#e05d5d" />
        </mesh>
      )}
      <mesh key="b" position={[1.5, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshBasicMaterial color="#5d9de0" />
      </mesh>
    </>
  );
}

/**
 * A mesh inserted before a sibling that is already mounted, which r3f does by splicing the parent's
 * children: both boxes are drawn, the red one on the left
 */
export const scene: TestScene = {
  render: () => <List withA={false} />,
  act: async ({ update }) => {
    await update(<List withA />);
  },
};

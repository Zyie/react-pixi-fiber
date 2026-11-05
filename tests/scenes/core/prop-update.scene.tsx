import type { TestScene } from '@test-scene';

/** An unlit box at a position, in a colour */
function Box({ x, color }: { x: number; color: string }) {
  return (
    <mesh position={[x, 0, 0]}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** A second render with new props moves the box from left to right and turns it from blue to orange */
export const scene: TestScene = {
  render: () => <Box x={-1.5} color="royalblue" />,
  act: async ({ update }) => {
    await update(<Box x={1.5} color="orange" />);
  },
};

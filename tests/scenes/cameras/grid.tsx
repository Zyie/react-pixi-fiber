const COLORS = ['#d9534f', '#f0ad4e', '#5cb85c', '#5bc0de', '#428bca'];

/** A 5 by 3 grid of unlit boxes in the z = 0 plane, one unit apart, coloured by column, for camera scenes to frame */
export function Grid() {
  return (
    <>
      {[-1, 0, 1].flatMap((y) =>
        [-2, -1, 0, 1, 2].map((x) => (
          <mesh key={`${x},${y}`} position={[x * 1.2, y * 1.2, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshBasicMaterial color={COLORS[x + 2]} />
          </mesh>
        )),
      )}
    </>
  );
}

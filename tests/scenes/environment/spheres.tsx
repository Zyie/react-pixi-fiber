/** A grid of spheres from rough (left) to smooth (right), dielectric on the top row and metal on the bottom one */
export function Spheres({ color = '#ffffff', metalness = [0, 1] }: { color?: string; metalness?: number[] }) {
  const roughness = [1, 0.6, 0.3, 0.05];
  return (
    <>
      {metalness.map((metal, row) =>
        roughness.map((rough, column) => (
          <mesh
            key={`${row}-${column}`}
            position={[(column - 1.5) * 1.15, (metalness.length - 1) * 0.6 - row * 1.2, 0]}
          >
            <sphereGeometry args={[0.5, 48, 24]} />
            <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
          </mesh>
        )),
      )}
    </>
  );
}

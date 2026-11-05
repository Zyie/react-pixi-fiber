const COLORS = ['#ffffff', '#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0'];

/**
 * Five spheres, white and four colours, under a strong light and a dim ambient one, on a dark floor: the
 * lit sides run past full brightness, so each tone curve rolls them off its own way
 */
export function ToneScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 5]} intensity={5} />
      {COLORS.map((color, index) => (
        <mesh key={color} position={[(index - 2) * 1.3, 0, 0]}>
          <sphereGeometry args={[0.6, 48, 24]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#303030" />
      </mesh>
    </>
  );
}

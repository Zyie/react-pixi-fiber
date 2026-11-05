/** A box above a floor, lit from above and to the right by a light that casts shadows */
export function ShadowedBox() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 2]} intensity={2} castShadow />
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#f0ad4e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  );
}

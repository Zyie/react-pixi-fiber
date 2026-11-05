import type { TestScene } from '@test-scene';

/** three.js element names, positional `args`, a scalar `scale` and material props renamed for pixi-3d */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[1, 2, 3]} />
      <mesh position={[0, 0.25, 0]} rotation={[0.4, 0.6, 0]} scale={1.2}>
        <boxGeometry args={[1, 2, 3]} />
        <meshStandardMaterial color="hotpink" roughness={0.25} metalness={0.5} />
      </mesh>
    </>
  ),
  // Metalness 0.5 sets pixi-3d apart from three.js (metalness 0 matches). pixi-3d's directly lit metal
  // faces are darker and less saturated than three's, and its weakly lit face is lighter: its PBR has
  // neither three's multi-scatter energy compensation on direct specular nor its energy-conserving cut
  // of ambient diffuse on metal (pixi-3d's pbrLightingBit).
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};

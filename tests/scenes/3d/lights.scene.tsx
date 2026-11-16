import type { TestScene } from '@test-scene';

/**
 * The four lights `@react-fiber/3d` names, on a grey floor seen from above and in front, with three
 * white spheres: a faint ambient light; a dim white directional light from the upper left; a red point
 * light just above the left sphere, which lights its top and pools red on the floor around it, and
 * tints the middle sphere's left side; and a blue spot light above the right sphere, aimed straight
 * down, which lights its top and draws a blue circle on the floor around it.
 */
export const scene: TestScene = {
  camera: { position: [0, 4, 7] },
  render: () => (
    <>
      <ambientLight3D intensity={0.15} />
      <directionalLight3D angle={[-50, -30, 0]} intensity={0.6} />
      <pointLight3D position={[-2.2, 1.4, 0]} color="#ff3020" intensity={12} range={6} />
      <spotLight3D position={[2.2, 3, 0]} angle={[-90, 0, 0]} color="#3060ff" intensity={40} coneAngle={30} range={8} />
      <mesh3D angle={[-90, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry3D args={[{ width: 9, height: 6 }]} />
        <material3D baseColor="#9a9a9a" roughness={0.9} metallic={0} />
      </mesh3D>
      {[-2.2, 0, 2.2].map((x) => (
        <mesh3D key={x} position={[x, 0, 0]} scale={0.6}>
          <sphereGeometry3D />
          <material3D baseColor="#ffffff" roughness={0.6} metallic={0} />
        </mesh3D>
      ))}
    </>
  ),
};

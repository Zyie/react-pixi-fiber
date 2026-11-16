import type { TestScene } from '@test-scene';

/**
 * The three materials `@react-fiber/3d` names, on spheres under an ambient and a directional light:
 * left, a PBR `<material3D>` (rough red plastic with a soft highlight); middle, a `<phongMaterial3D>`
 * (green, shaded from the upper left); right, an unlit `<flatMaterial3D>`, a flat blue disc with no
 * shading. Below them, a dark PBR sphere whose emissive feature, set through `args`, glows an even
 * orange.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7] },
  render: () => (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-30, 40, 0]} intensity={3} />
      <mesh3D position={[-2.2, 0.8, 0]}>
        <sphereGeometry3D />
        <material3D baseColor="#d0402b" roughness={0.7} metallic={0} />
      </mesh3D>
      <mesh3D position={[0, 0.8, 0]}>
        <sphereGeometry3D />
        <phongMaterial3D baseColor="#3fae5a" shininess={80} specularStrength={1} />
      </mesh3D>
      <mesh3D position={[2.2, 0.8, 0]}>
        <sphereGeometry3D />
        <flatMaterial3D baseColor="#3d7fe8" />
      </mesh3D>
      <mesh3D position={[0, -1.5, 0]} scale={0.6}>
        <sphereGeometry3D />
        <material3D
          args={[{ emissive: { color: '#ff7a1a', strength: 1 } }]}
          baseColor="#222222"
          roughness={0.5}
          metallic={0}
        />
      </mesh3D>
    </>
  ),
};

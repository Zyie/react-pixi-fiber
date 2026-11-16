import type { TestScene } from '@test-scene';

/**
 * The shadows of @pixi/3d itself, with no renderer setting: a directional light shining down from the front right
 * with `castShadow`, an orange cube over a grey floor with `castShadow`, and the floor with
 * `receiveShadow`, so the cube's shadow falls on the floor behind and to the left of it. The blue ball on
 * the left has `castShadow={false}` and casts none.
 */
export const scene: TestScene = {
  camera: { position: [0, 3, 6] },
  render: () => (
    <>
      <ambientLight3D intensity={0.2} />
      <directionalLight3D angle={[-60, 20, 0]} intensity={3} castShadow />
      <mesh3D position={[0, 0.8, 0]} castShadow>
        <cubeGeometry3D />
        <material3D baseColor="orange" />
      </mesh3D>
      <mesh3D position={[-1.6, 0.6, 0.6]} castShadow={false}>
        <sphereGeometry3D args={[{ radius: 0.35 }]} />
        <material3D baseColor="#4363d8" />
      </mesh3D>
      <mesh3D angle={[-90, 0, 0]} receiveShadow>
        <planeGeometry3D args={[{ width: 8, height: 8 }]} />
        <material3D baseColor="#888888" />
      </mesh3D>
    </>
  ),
};

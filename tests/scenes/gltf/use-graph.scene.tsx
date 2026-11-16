import { useGraph, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';

function Pieces() {
  const gltf = useLoader(GLTFLoader, '/models/box.glb?graph');
  const { nodes, materials } = useGraph(gltf.scene);
  const box = nodes.Box as Mesh;
  const base = nodes.Base as Mesh;

  return (
    <group position={[0, -0.6, 0]}>
      <mesh geometry={base.geometry} material={materials.Blue} />
      <mesh geometry={box.geometry} material={materials.Red} position={[-0.7, 0.6, 0]} />
      <mesh geometry={box.geometry} position={[0.7, 0.6, 0]} rotation={[0, 0.6, 0]} scale={0.7}>
        <meshStandardMaterial color="orange" />
      </mesh>
    </group>
  );
}

/**
 * gltfjsx's pattern: `useGraph` on the loaded scene gives `nodes` and `materials` by name, and the
 * file's geometry and materials go on new meshes: the slab with its own material, a red box, and a
 * smaller orange box with a material of its own
 */
export const scene: TestScene = {
  camera: { position: [0, 2, 4] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Pieces />
    </>
  ),
};

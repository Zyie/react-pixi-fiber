// #region result
import { useLoader } from 'react-pixi-fiber';
import { GLTFLoader } from 'react-pixi-fiber/addons';
import type { Mesh } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
export function Model(props: { position?: [number, number, number] }) {
  const { nodes, materials } = useLoader(GLTFLoader, '/models/box.glb');

  return (
    <group {...props} dispose={null}>
      <mesh geometry={(nodes.Base as Mesh).geometry} material={materials.Blue} />
      <mesh
        geometry={(nodes.Box as Mesh).geometry}
        material={materials.Red}
        position={[0, 0.6, 0]}
        rotation={[0, 0.5, 0]}
      />
    </group>
  );
}

useLoader.preload(GLTFLoader, '/models/box.glb');
// #endregion result

/** The model as gltfjsx writes it: each mesh in JSX, with the file's geometry and materials by name */
export const example: Example = {
  title: 'A glTF model as JSX',
  camera: { position: [0, 2, 4] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={2} />
      <Model position={[0, -0.6, 0]} />
    </>
  ),
};

import { useFrame, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
import type { Group, SkinnedMesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useEffect, useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Column() {
  const group = useRef<Group>(null!);
  const { nodes, materials, animations } = useLoader(GLTFLoader, '/models/skinned.glb');
  const column = nodes.Column as SkinnedMesh;
  const [mixer] = useState(() => new AnimationMixer(null!));

  useEffect(() => {
    mixer.clipAction(animations[0], group.current)!.play();

    return () => void mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => mixer.update(delta));

  return (
    <group ref={group} dispose={null}>
      <group name="Armature" position={[0, -1, 0]}>
        <primitive object={nodes.Root} />
        <skinnedMesh geometry={column.geometry} material={materials.Skin} skeleton={column.skeleton} />
      </group>
    </group>
  );
}
// #endregion result

/** A skinned column in gltfjsx's shape, its root bone through `<primitive>`, bending with its `Bend` clip */
export const example: Example = {
  title: 'A skinned glTF model as JSX',
  frames: 46,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Column />
    </>
  ),
};

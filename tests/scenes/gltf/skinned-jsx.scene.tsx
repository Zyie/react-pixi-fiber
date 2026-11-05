import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useLoader } from 'react-pixi-fiber';
import { GLTFLoader } from 'react-pixi-fiber/addons';
import { AnimationMixer } from 'react-pixi-fiber/three';
import type { Group, SkinnedMesh } from 'react-pixi-fiber/three';

function Column() {
  const { nodes, materials, animations } = useLoader(GLTFLoader, '/models/skinned.glb?jsx');
  const column = nodes.Column as SkinnedMesh;
  const group = useRef<Group>(null!);
  const [mixer] = useState(() => new AnimationMixer(null!));

  useLayoutEffect(() => {
    mixer.clipAction(animations[0], group.current)!.play();

    return () => void mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => void mixer.update(delta));

  return (
    <group ref={group} position={[1, 0, 0]}>
      <group name="Armature" position={[0, -1, 0]}>
        <primitive object={nodes.Root} />
        <skinnedMesh name="Column" geometry={column.geometry} material={materials.Skin} skeleton={column.skeleton} />
      </group>
    </group>
  );
}

/**
 * The skinned column as gltfjsx writes it: the root bone through `<primitive>`, and a `<skinnedMesh>`
 * with the file's geometry, material and skeleton beside it, moved one unit right. Its `Bend` clip,
 * half a second in, bends it halfway.
 */
export const scene: TestScene = {
  frames: 31,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Column />
    </>
  ),
};

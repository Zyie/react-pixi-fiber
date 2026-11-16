import { useFrame, useGraph, useLoader } from '@react-fiber/threejs-compat';
import { GLTFLoader } from '@react-fiber/threejs-compat/addons';
import { AnimationMixer } from '@react-fiber/threejs-compat/three';
import type { Mesh } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useState } from 'react';

const URL = '/models/morph.glb?morph';

function Blobs() {
  const gltf = useLoader(GLTFLoader, URL);
  const { nodes, materials } = useGraph(gltf.scene);
  const blob = nodes.Blob as Mesh;
  const [mixer] = useState(() => new AnimationMixer(gltf.scene));

  useLayoutEffect(() => {
    mixer.clipAction(gltf.animations[0])!.play();

    return () => {
      mixer.stopAllAction();
      useLoader.clear(GLTFLoader, URL);
    };
  }, [mixer, gltf]);

  useFrame((_, delta) => void mixer.update(delta));

  return (
    <>
      <primitive object={gltf.scene} position={[-1.3, -0.3, 0]} />
      <mesh
        geometry={blob.geometry}
        material={materials.Clay}
        morphTargetDictionary={blob.morphTargetDictionary}
        morphTargetInfluences={[0, 1]}
        position={[1.3, -0.3, 0]}
        rotation={[0.35, 0, 0]}
      />
    </>
  );
}

/**
 * Morph targets: the file's box with its `Morph` clip 1.5 seconds in, half tall and half wide (left),
 * and its geometry on a new mesh with `morphTargetInfluences={[0, 1]}`, fully wide (right). The model
 * leaves the cache on unmount: pixi-3d morphs a geometry on the first renderer that draws it only, so
 * the next renderer loads its own.
 */
export const scene: TestScene = {
  frames: 91,
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={2} />
      <Blobs />
    </>
  ),
};

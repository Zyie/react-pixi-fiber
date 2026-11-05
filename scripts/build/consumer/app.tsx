import { Suspense, useRef } from 'react';
import type { ElementRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, Environment, useFrame, useLoader, useRenderTarget, useTexture, useThree } from 'react-pixi-fiber';
import { GLTFLoader, OrbitControls } from 'react-pixi-fiber/addons';
import * as THREE from 'react-pixi-fiber/three';

function Model() {
  const gltf = useLoader(GLTFLoader, '/model.glb');
  return <primitive object={gltf.scene} />;
}

function Box() {
  const mesh = useRef<ElementRef<'mesh'>>(null);
  const map = useTexture('/texture.png');
  const fbo = useRenderTarget(256, 256, { samples: 4 });

  useFrame(({ renderer, scene, camera }, delta) => {
    mesh.current!.rotation.y += delta;
    renderer.setRenderTarget(fbo);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  });

  return (
    <mesh ref={mesh} position={new THREE.Vector3(1, 2, 3)} quaternion={new THREE.Quaternion()}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={map} color="orange" emissive="#202020" normalScale={[1, 1]} />
    </mesh>
  );
}

function Controls() {
  const { camera, renderer } = useThree();
  return <primitive object={new OrbitControls(camera, renderer.domElement)} />;
}

const light = new THREE.SpotLight(new THREE.Color('white'), 2);
light.angle = Math.PI / 6;
const SIDES: Record<'front' | 'double', THREE.Side> = { front: THREE.FrontSide, double: THREE.DoubleSide };
const wrap: THREE.Wrapping = THREE.RepeatWrapping;
const material = new THREE.MeshPhysicalMaterial({ clearcoat: 1, side: SIDES.double });
material.sheen = 0.5;
material.blending = THREE.AdditiveBlending satisfies THREE.Blending;
const onAdded = (event: THREE.Event<'added', THREE.Object3D>): string => event.type;
const childAdded: keyof THREE.Object3DEventMap = 'childadded';

createRoot(document.getElementById('root')!).render(
  <Canvas>
    <ambientLight intensity={0.5} color="white" />
    <directionalLight position={[2, 3, 4]} />
    <hemisphereLight args={['white', 'black', 1]} />
    <pointLight color={0xff0000} />
    <primitive object={light} />
    <primitive object={new THREE.Group()} name={`${wrap} ${onAdded.name} ${childAdded}`} />
    <Suspense fallback={null}>
      <Environment files="/sky.hdr" />
      <Model />
      <Box />
    </Suspense>
    <instancedMesh args={[null, null, 10]}>
      <sphereGeometry />
      <primitive object={material} attach="material" />
    </instancedMesh>
    <Controls />
  </Canvas>,
);

import type { Mesh3D, Scene3DSource } from '@pixi/3d';
import { Canvas, View3D, useAsset, useFrame, useThree } from '@react-fiber/core';
import type { ThreeEvent } from '@react-fiber/core';
import '@react-fiber/2d';
import '@react-fiber/3d';
import { Texture } from 'pixi.js';
import { Suspense, useRef } from 'react';
import { createRoot } from 'react-dom/client';

function Model() {
  const source = useAsset<Scene3DSource>('/model.glb');
  return <model3D args={[source]} position={[2, 0, 0]} />;
}

function Spinner() {
  const mesh = useRef<Mesh3D>(null);
  const fov = useThree((state) => state.camera.fov);

  useFrame(({ camera }, delta) => {
    mesh.current!.rotation.y += delta;
    camera.position.z = 6 + Math.sin(fov);
  });

  return (
    <mesh3D
      ref={mesh}
      position={[-1, 0, 0]}
      scale={0.8}
      onClick={(event: ThreeEvent<MouseEvent>) => event.object.position.set(0, event.point.y, 0)}
    >
      <sphereGeometry3D args={[{ radius: 1, widthSegments: 24 }]} />
      <phongMaterial3D baseColor="tomato" shininess={40} />
    </mesh3D>
  );
}

function App() {
  return (
    <Canvas camera={{ fov: 50, position: [0, 1, 6] }}>
      <ambientLight3D intensity={0.3} />
      <directionalLight3D angle={[-35, 30, 0]} color="white" intensity={2} />
      <Spinner />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <sprite2D texture={Texture.WHITE} tint="orange" width={40} height={40} />
      <View3D x={20} y={20} width={120} height={90}>
        <mesh3D>
          <cubeGeometry3D />
          <flatMaterial3D baseColor={0x3366ff} />
        </mesh3D>
      </View3D>
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

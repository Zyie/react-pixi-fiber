// #region result
import { useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, extend, useFrame, useThree } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
import { OrbitControls } from 'react-pixi-fiber/addons';
import { Matrix4, OrthographicCamera, Scene } from 'react-pixi-fiber/three';
import type { Mesh } from 'react-pixi-fiber/three';

extend({ OrbitControls });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    orbitControls: ThreeElement<typeof OrbitControls>;
  }
}
// #endregion result

import type { Example } from '../example';

// #region result
function Viewcube() {
  const { scene: defaultScene, camera: defaultCamera, size, events } = useThree();
  const scene = useMemo(() => new Scene(), []);
  const camera = useMemo(() => {
    const hud = new OrthographicCamera(-size.width / 2, size.width / 2, size.height / 2, -size.height / 2, 0.1, 1000);
    hud.position.set(0, 0, 100);
    return hud;
  }, [size]);
  const matrix = useMemo(() => new Matrix4(), []);
  const cube = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  // #region render
  useFrame(
    ({ renderer }) => {
      matrix.copy(defaultCamera.matrix).invert();
      cube.current.quaternion.setFromRotationMatrix(matrix);
      renderer.autoClear = true;
      renderer.render(defaultScene, defaultCamera);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, camera);
    },
    { phase: 'render' },
  );
  // #endregion render

  return createPortal(
    <>
      <mesh
        ref={cube}
        position={[size.width / 2 - 70, size.height / 2 - 70, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[60, 60, 60]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'white'} />
      </mesh>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
    </>,
    scene,
    { camera, events: { priority: events.priority + 1 } },
  );
}

function Controls() {
  const { camera, renderer } = useThree();
  return <orbitControls args={[camera, renderer.domElement]} />;
}

function Model() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 32, 16]} />
        <meshStandardMaterial color="#e9c46a" />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Model />
      <Viewcube />
      <Controls />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's Viewcube demo: a heads-up cube in its own scene, drawn over the main scene with a second render
 * after `clearDepth`, turning with the camera. A drag turns the view, and the cube with it; the pointer
 * then rests on the cube, which turns pink.
 */
export const example: Example = {
  title: 'A view cube drawn over the scene',
  render: () => (
    <>
      <Model />
      <Viewcube />
      <Controls />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.move(160, 160);
    await mouse.down();
    for (let step = 1; step <= 4; step++) await mouse.move(160 - step * 8, 160 - step * 5);
    await mouse.up();
    await mouse.move(330, 70);
    await frames();
  },
};

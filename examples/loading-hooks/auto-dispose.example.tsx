import { Canvas, useFrame } from '@react-fiber/threejs-compat';
import type { ThreeElements } from '@react-fiber/threejs-compat';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
type BoxProps = { setActive: (active: boolean) => void; active: boolean };

function Box1({ setActive, active, ...props }: BoxProps & ThreeElements['mesh']) {
  const mesh = useRef<Mesh>(null!);
  const [hovered, setHover] = useState(false);

  useFrame((state) => void (mesh.current.position.y = Math.sin(state.elapsed)));

  return (
    <mesh
      {...props}
      ref={mesh}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function Box2({ setActive, active, ...props }: BoxProps & ThreeElements['group']) {
  const mesh = useRef<Mesh>(null!);
  const [hovered, setHover] = useState(false);

  useFrame((state) => void (mesh.current.position.y = Math.sin(state.elapsed)));

  return (
    <group {...props}>
      <mesh
        ref={mesh}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry />
        <meshStandardMaterial color={hovered ? 'green' : 'blue'} />
      </mesh>
    </group>
  );
}

function Switcher() {
  const [active, setActive] = useState(false);

  return (
    <>
      {active && <Box1 active={active} setActive={setActive} position={[-0.5, 0, 0]} />}
      {!active && <Box2 active={active} setActive={setActive} position={[0.25, 0, 0]} />}
    </>
  );
}

export function App() {
  return (
    <Canvas orthographic camera={{ zoom: 100 }}>
      <ambientLight intensity={Math.PI} />
      <Switcher />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's AutoDispose demo: a click swaps one box for another, and r3f disposes the geometry and material
 * of the one that unmounts. The picture is taken after a click on the blue box, on the orange one.
 */
export const example: Example = {
  title: 'Swapping objects that dispose themselves',
  camera: { zoom: 100 },
  canvas: { orthographic: true },
  render: () => (
    <>
      <ambientLight intensity={Math.PI} />
      <Switcher />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(225, 150);
    await frames();
    await mouse.move(5, 5);
    await frames();
  },
};

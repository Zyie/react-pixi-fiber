// #region result
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from 'react-pixi-fiber';
import type { ThreeElements } from 'react-pixi-fiber';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
function Box(props: ThreeElements['mesh']) {
  const ref = useRef<Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    ref.current.position.y = Math.sin(state.elapsed) / 3;
  });

  return (
    <mesh
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(!clicked)}
      scale={clicked ? [1.5, 1.5, 1.5] : [1, 1, 1]}
      {...props}
    >
      <boxGeometry />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'aquamarine'} />
    </mesh>
  );
}

// #region primitive
function Box2(props: ThreeElements['group']) {
  const group = useMemo(() => {
    const group = new Group();

    group.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color: 'red' })));
    return group;
  }, []);

  return <primitive object={group} {...props} onClick={() => console.log('hi')} />;
}
// #endregion primitive

export function App() {
  return (
    <Canvas>
      <group>
        <Box position={[-0.5, 0, 0]} />
      </group>
      <Box2 position={[0.5, 0, 0]} />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's ClickAndHover demo: a box that bobs, turns pink under the pointer and grows when clicked,
 * beside a red box built in code and mounted with `<primitive>`. The left box has been clicked and the
 * pointer rests on it.
 */
export const example: Example = {
  title: 'Click and hover',
  render: () => (
    <>
      <group>
        <Box position={[-0.5, 0, 0]} />
      </group>
      <Box2 position={[0.5, 0, 0]} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(160, 150);
    await frames();
  },
};

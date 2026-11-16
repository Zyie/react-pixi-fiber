import { useFrame } from '@react-fiber/threejs-compat';
import type { TestScene } from '@test-scene';
import { useRef, useState } from 'react';
import type { ElementRef } from 'react';

/** react-three-fiber's README demo: a box that turns, grows when clicked and turns pink under the pointer */
function Box(props: { position: [number, number, number] }) {
  const meshRef = useRef<ElementRef<'mesh'>>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  useFrame((_, delta) => (meshRef.current!.rotation.x += delta));
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

/**
 * react-three-fiber's README demo as it is, after a 1-1 swap of its imports: two orange boxes turned half
 * a radian about x, lit by an ambient light, a spot light from the top right front and a point light from
 * the bottom left back, both ten units away with `decay={0}`. On three.js the spot light brightens the
 * faces turned up and to the right. pixi-3d's lights always fall off with the square of the distance,
 * three's `decay` of 2, so the spot and point lights add about a three-hundredth of three's and every face
 * shows the ambient light alone.
 */
export const scene: TestScene = {
  frames: 31,
  render: () => (
    <>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      <Box position={[-1.2, 0, 0]} />
      <Box position={[1.2, 0, 0]} />
    </>
  ),
  // pixi-3d has no light decay exponent (docs/feasibility.md, B4 and ask 5): decay={0} is kept on the
  // lights and changes nothing, so the spot and point lights are about 300 times dimmer than three's.
  fails: { webgl: 'differ from three.js', webgpu: 'differ from three.js' },
};

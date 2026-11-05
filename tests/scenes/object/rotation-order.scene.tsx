import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';
import type { ThreeElements } from 'react-pixi-fiber';
import { Euler, Quaternion, Vector3 } from 'react-pixi-fiber/three';
import type { EulerOrder } from 'react-pixi-fiber/three';

type Mesh = ElementRef<'mesh'>;

const ORDERS: EulerOrder[] = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
const ANGLES = [0.9, 0.7, 0.5] as const;

/** A box with a stripe on its +X face and a cap on its +Y face, so its turn reads from the front */
function Marked(props: ThreeElements['mesh']) {
  return (
    <mesh {...props}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="#5b8def" />
      <mesh position={[0.31, 0, 0]}>
        <boxGeometry args={[0.02, 0.6, 0.2]} />
        <meshBasicMaterial color="#f0ad4e" />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.6]} />
        <meshBasicMaterial color="#e05d5d" />
      </mesh>
    </mesh>
  );
}

/**
 * The rotation the bottom row reaches by other routes: a quaternion set from a ZYX Euler, a rotation
 * read back after `rotateY` turned the quaternion, `rotation.reorder`, and `setRotationFromAxisAngle`
 */
function Routes() {
  const fromQuaternion = useRef<Mesh>(null);
  const readBack = useRef<Mesh>(null);
  const reordered = useRef<Mesh>(null);
  const axisAngle = useRef<Mesh>(null);

  useLayoutEffect(() => {
    fromQuaternion.current!.quaternion.copy(new Quaternion().setFromEuler(new Euler(...ANGLES, 'ZYX')));

    const turned = readBack.current!;
    turned.rotateY(0.8);
    turned.rotation.x += 0.4;

    const flipped = reordered.current!;
    flipped.rotation.set(...ANGLES, 'XYZ');
    flipped.rotation.reorder('ZXY');
    flipped.rotation.z += 0.3;

    axisAngle.current!.setRotationFromAxisAngle(new Vector3(1, 1, 0).normalize(), 1.1);
  }, []);

  return (
    <>
      <Marked ref={fromQuaternion} position={[-2.1, -1.2, 0]} />
      <Marked ref={readBack} position={[-0.7, -1.2, 0]} />
      <Marked ref={reordered} position={[0.7, -1.2, 0]} />
      <Marked ref={axisAngle} position={[2.1, -1.2, 0]} />
    </>
  );
}

/**
 * The same three angles turned in each of three's six axis orders, `rotation={[x, y, z, order]}`, in
 * the top two rows; each order turns the box differently, as in three. The bottom row turns boxes by
 * the routes in `Routes`, which keep `rotation` and `quaternion` in step.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 7], fov: 50 },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 5]} intensity={1.4} />
      {ORDERS.map((order, i) => (
        <Marked key={order} position={[(i % 3) * 1.6 - 1.6, i < 3 ? 1.9 : 0.4, 0]} rotation={[...ANGLES, order]} />
      ))}
      <Routes />
    </>
  ),
};

import { Euler, Matrix4, Quaternion, Vector3 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

type Mesh = ElementRef<'mesh'>;

const composed = new Matrix4().compose(
  new Vector3(-1.6, 0.8, 0),
  new Quaternion().setFromEuler(new Euler(0.4, 0.8, 0)),
  new Vector3(1, 1.6, 1),
);

/**
 * Boxes whose matrix `matrixAutoUpdate={false}` leaves alone: one whose `updateMatrix` ran after its
 * position changed, one whose position changed without it, so it stays where its matrix last put it, and
 * one moved by `applyMatrix4`, which keeps the result in its position, rotation and scale
 */
function Updates() {
  const updated = useRef<Mesh>(null);
  const stale = useRef<Mesh>(null);
  const applied = useRef<Mesh>(null);

  useLayoutEffect(() => {
    updated.current!.position.set(1.6, 0.8, 0);
    updated.current!.updateMatrix();
    stale.current!.position.set(1.6, -0.8, 0);
    applied.current!.applyMatrix4(new Matrix4().makeRotationZ(0.5).setPosition(-1.6, -1, 0));
  }, []);

  return (
    <>
      <mesh ref={updated} matrixAutoUpdate={false}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#5ec27a" />
      </mesh>
      <mesh ref={stale} matrixAutoUpdate={false} position={[0, -0.8, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#e05d5d" />
      </mesh>
      <mesh ref={applied} scale={[1.4, 0.5, 0.5]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#a77bd8" />
      </mesh>
    </>
  );
}

/**
 * `matrixAutoUpdate={false}` and three's matrix API: the blue box takes a matrix built with `compose`
 * through its `matrix` prop and ignores its `position` prop; the green one sits where `updateMatrix`
 * put it; the red one stays at the origin, where its matrix was when it stopped updating, as three's
 * does; and the purple bar is turned and moved by `applyMatrix4`.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <mesh matrixAutoUpdate={false} matrix={composed} position={[5, 5, 5]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#5b8def" />
      </mesh>
      <Updates />
    </>
  ),
};

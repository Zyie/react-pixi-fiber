import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';
import { Vector3 } from 'react-pixi-fiber/three';

type Group = ElementRef<'group'>;

interface PointerProps {
  position: [number, number, number];
  color: string;
  /** An up other than (0, 1, 0), which turns the fin about the line to the target */
  up?: [number, number, number];
  /** Aim with three numbers instead of a vector */
  numbers?: boolean;
}

/**
 * A long box that points along its local +Z, with a fin on its local +Y, turned by `lookAt` to face
 * the origin: three turns a node's +Z toward the target, keeping its +Y as close to `up` as it can
 */
function Pointer({ position, color, up, numbers }: PointerProps) {
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    const pointer = group.current!;
    if (up) pointer.up.set(...up);
    if (numbers) pointer.lookAt(0, 0, 0);
    else pointer.lookAt(new Vector3(0, 0, 0));
  }, [up, numbers]);

  return (
    <group ref={group} position={position}>
      <mesh position={[0, 0, 0.35]}>
        <boxGeometry args={[0.18, 0.18, 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.16, 0.1]}>
        <boxGeometry args={[0.04, 0.24, 0.3]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
}

/**
 * `lookAt` from five places around a sphere at the origin: each pointer's long box aims at the sphere
 * with its fin up, the one on the right with `up` along +Z, so its fin turns toward the camera, and the
 * one at the bottom aimed with three numbers. Matches three's `Object3D.lookAt`, where +Z faces the target.
 */
export const scene: TestScene = {
  camera: { position: [0, 1.2, 6], fov: 45 },
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 5]} intensity={1.6} />
      <mesh>
        <sphereGeometry args={[0.25, 32, 16]} />
        <meshStandardMaterial color="#e05d5d" />
      </mesh>
      <Pointer position={[-2, 1, 0]} color="#5b8def" />
      <Pointer position={[2, 1, 0]} color="#5ec27a" up={[0, 0, 1]} />
      <Pointer position={[-1.5, -1, 1.5]} color="#f0ad4e" />
      <Pointer position={[1.5, -0.8, -1.5]} color="#a77bd8" />
      <Pointer position={[0, -1.6, 0.5]} color="#45c0c9" numbers />
    </>
  ),
};

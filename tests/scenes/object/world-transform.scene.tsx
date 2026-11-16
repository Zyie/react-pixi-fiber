import { Quaternion, Vector3 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

type Mesh = ElementRef<'mesh'>;
type Group = ElementRef<'group'>;

/**
 * A plate three groups deep, each group moved, turned and scaled, and markers placed from its world
 * transform: a sphere at `getWorldPosition`, a second plate turned by `getWorldQuaternion`, and a small
 * sphere where `localToWorld` puts a point one unit along the deep plate's local +X
 */
function Nested() {
  const outer = useRef<Group>(null);
  const deep = useRef<Mesh>(null);
  const marker = useRef<Mesh>(null);
  const twin = useRef<Mesh>(null);
  const tip = useRef<Mesh>(null);

  useLayoutEffect(() => {
    const plate = deep.current!;
    marker.current!.position.copy(plate.getWorldPosition(new Vector3()));
    twin.current!.quaternion.copy(plate.getWorldQuaternion(new Quaternion()));
    tip.current!.position.copy(plate.localToWorld(new Vector3(1, 0, 0)));

    const back = outer.current!.worldToLocal(plate.getWorldPosition(new Vector3()));
    twin.current!.position.set(back.x - 3.2, back.y - 1.2, 0);
  }, []);

  return (
    <>
      <group ref={outer} position={[-0.6, -0.3, 0]} rotation={[0, 0, 0.4]} scale={1.2}>
        <group position={[1, 0.2, 0]} rotation={[0.3, 0.5, 0]}>
          <group position={[0.3, 0.6, 0]} scale={0.8}>
            <mesh ref={deep} position={[0.4, 0, 0]} rotation={[0, 0, 0.5]}>
              <boxGeometry args={[0.6, 0.9, 0.1]} />
              <meshStandardMaterial color="#5b8def" />
            </mesh>
          </group>
        </group>
      </group>
      <mesh ref={marker}>
        <sphereGeometry args={[0.12, 24, 12]} />
        <meshBasicMaterial color="#f0ad4e" />
      </mesh>
      <mesh ref={tip}>
        <sphereGeometry args={[0.08, 24, 12]} />
        <meshBasicMaterial color="#e05d5d" />
      </mesh>
      <mesh ref={twin}>
        <boxGeometry args={[0.6, 0.9, 0.1]} />
        <meshStandardMaterial color="#5ec27a" />
      </mesh>
    </>
  );
}

/**
 * Nested transforms with three's world-space getters: the orange sphere pokes through the centre of
 * the blue plate, which is three groups deep; the red one sits at the plate's local (1, 0, 0); and the
 * green plate to the lower left has the blue plate's world rotation, at a place `worldToLocal` worked
 * out. The groups scale uniformly: a sheared world transform shades differently (`sheared-normals`).
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <Nested />
    </>
  ),
};

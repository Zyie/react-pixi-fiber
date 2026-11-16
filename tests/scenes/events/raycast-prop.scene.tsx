import { Sphere, Vector3 } from '@react-fiber/threejs-compat/three';
import type { Intersection, Raycaster } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useState } from 'react';
import type { ElementRef } from 'react';

const bounds = new Sphere();
const hit = new Vector3();

/** Picks a mesh by a sphere twice its size around its centre, in place of its triangles */
function sphereRaycast(this: ElementRef<'mesh'>, raycaster: Raycaster, intersects: Intersection[]) {
  bounds.center.set(0, 0, 0).applyMatrix4(this.matrixWorld);
  bounds.radius = 1;
  if (!raycaster.ray.intersectSphere(bounds, hit)) return;
  intersects.push({ distance: raycaster.ray.origin.distanceTo(hit), point: hit.clone(), object: this, face: null });
}

/** A box that turns its colour on once clicked */
function Box({
  position,
  size,
  color,
  raycast,
}: {
  position: [number, number, number];
  size: number;
  color: string;
  raycast?: ElementRef<'mesh'>['raycast'];
}) {
  const [clicked, setClicked] = useState(false);

  return (
    <mesh position={position} raycast={raycast} onClick={() => setClicked(true)}>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial color={clicked ? color : '#3a3f4b'} />
    </mesh>
  );
}

/**
 * The `raycast` prop. Left: a small box with `raycast={() => null}` in front of a large one; a click
 * on the small box goes through it to the large box, which turns green, and the small one stays grey.
 * Right: a small box whose `raycast` tests a sphere of radius 1 around it; a click well beside the box,
 * inside that sphere, hits it and turns it orange.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <Box position={[-1.4, 0, 1]} size={0.6} color="hotpink" raycast={() => null} />
      <Box position={[-1.4, 0, -1]} size={1.6} color="limegreen" />
      <Box position={[1.4, 0, 0]} size={0.5} color="orange" raycast={sphereRaycast} />
    </>
  ),
  act: async ({ mouse, frames }) => {
    await mouse.click(103, 150);
    await mouse.click(318, 120);
    await frames();
  },
};

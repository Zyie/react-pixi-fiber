import { Vector2 } from '@react-fiber/threejs-compat/three';
import type { ReactNode } from 'react';

const LATHE_PROFILE = [
  new Vector2(0.05, -0.7),
  new Vector2(0.55, -0.55),
  new Vector2(0.35, 0),
  new Vector2(0.5, 0.45),
  new Vector2(0.2, 0.7),
];

/** Every generated geometry of the catalog, in the order the gallery lays them out, four to a row */
export const GEOMETRIES: ReactNode[] = [
  <boxGeometry key="box" args={[1.1, 1.1, 1.1, 2, 2, 2]} />,
  <sphereGeometry key="sphere" args={[0.7, 24, 16]} />,
  <planeGeometry key="plane" args={[1.3, 1.3, 2, 2]} />,
  <cylinderGeometry key="cylinder" args={[0.5, 0.6, 1.2, 20]} />,
  <coneGeometry key="cone" args={[0.65, 1.3, 20]} />,
  <capsuleGeometry key="capsule" args={[0.4, 0.6, 6, 16]} />,
  <torusGeometry key="torus" args={[0.5, 0.22, 12, 32]} />,
  <torusKnotGeometry key="torus-knot" args={[0.45, 0.15, 64, 8]} />,
  <icosahedronGeometry key="icosahedron" args={[0.75]} />,
  <octahedronGeometry key="octahedron" args={[0.8]} />,
  <tetrahedronGeometry key="tetrahedron" args={[0.85]} />,
  <dodecahedronGeometry key="dodecahedron" args={[0.75]} />,
  <circleGeometry key="circle" args={[0.7, 24]} />,
  <ringGeometry key="ring" args={[0.3, 0.7, 24, 2]} />,
  <latheGeometry key="lathe" args={[LATHE_PROFILE, 20]} />,
  <sphereGeometry key="sphere-slice" args={[0.7, 24, 16, 0, Math.PI * 1.5, 0.3, Math.PI * 0.6]} />,
];

/**
 * Where the gallery puts geometry `index`: four columns, four rows, centred on the origin
 * @param index - The geometry's place in {@link GEOMETRIES}
 */
export function galleryPosition(index: number): [number, number, number] {
  return [(index % 4) * 2.7 - 4.05, 3 - Math.floor(index / 4) * 2, 0];
}

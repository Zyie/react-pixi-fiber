import type { TestScene } from '@test-scene';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ElementRef } from 'react';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  TorusGeometry,
} from 'react-pixi-fiber/three';

/** A four-sided pyramid as raw positions and an index, with a colour per corner */
const PYRAMID_POSITIONS = new Float32Array([
  0, 0.9, 0, -0.8, -0.6, 0.8, 0.8, -0.6, 0.8, 0.8, -0.6, -0.8, -0.8, -0.6, -0.8,
]);
const PYRAMID_COLORS = new Float32Array([1, 1, 1, 1, 0.2, 0.2, 0.2, 1, 0.2, 0.2, 0.4, 1, 1, 0.8, 0.1]);
const PYRAMID_INDEX = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 4, 3, 1, 3, 2]);

/** The pyramid declared in JSX, its normals worked out once its attributes are attached */
function Pyramid() {
  const geometry = useRef<ElementRef<'bufferGeometry'>>(null);
  useLayoutEffect(() => {
    geometry.current!.toNonIndexed();
    geometry.current!.computeVertexNormals();
  }, []);

  return (
    <mesh position={[-3, 0.2, 0]} rotation={[0.3, 0.6, 0]}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute attach="attributes-position" args={[PYRAMID_POSITIONS, 3]} />
        <bufferAttribute attach="attributes-color" args={[PYRAMID_COLORS, 3]} />
        <bufferAttribute attach="index" args={[PYRAMID_INDEX, 1]} />
      </bufferGeometry>
      <meshStandardMaterial vertexColors />
    </mesh>
  );
}

/** A box turned, scaled and moved in its own vertices, then centred again */
function TransformedBox() {
  const geometry = useMemo(
    () => new BoxGeometry(1, 1, 1).rotateX(0.6).rotateY(0.5).scale(1.4, 0.8, 0.8).translate(3, 2, 0).center(),
    [],
  );

  return (
    <mesh geometry={geometry} position={[-1, 0, 0]}>
      <meshStandardMaterial color="#6fc3df" />
    </mesh>
  );
}

/** A non-indexed fan of flat-shaded triangles from `setFromPoints`, with normals from `computeVertexNormals` */
function Fan() {
  const geometry = useMemo(() => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = ((i + 1) / 6) * Math.PI * 2;
      points.push(
        { x: 0, y: 0, z: 0.4 },
        { x: Math.cos(a), y: Math.sin(a), z: 0 },
        { x: Math.cos(b), y: Math.sin(b), z: 0 },
      );
    }
    const fan = new BufferGeometry().setFromPoints(points);
    fan.computeVertexNormals();
    return fan;
  }, []);

  return (
    <mesh geometry={geometry} position={[1.1, 0.2, 0]} rotation={[-0.5, 0, 0]}>
      <meshStandardMaterial color="#f2a65a" />
    </mesh>
  );
}

/** A torus with a gradient written into its own colour attribute */
function TintedTorus() {
  const geometry = useMemo(() => {
    const torus = new TorusGeometry(0.7, 0.28, 16, 48);
    const position = torus.getAttribute('position')!;
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const t = (position.getX(i) + 1) / 2;
      colors.set([t, 0.3, 1 - t], i * 3);
    }
    torus.setAttribute('color', new BufferAttribute(colors, 3));
    return torus;
  }, []);

  return (
    <mesh geometry={geometry} position={[3.1, 0.2, 0]} rotation={[0.5, 0, 0]}>
      <meshBasicMaterial vertexColors />
    </mesh>
  );
}

/** Two quads from one geometry: `setDrawRange` draws only the first */
function DrawRange() {
  const geometry = useMemo(() => {
    const quads = new BufferGeometry();
    quads.setAttribute(
      'position',
      new Float32BufferAttribute(
        [-1, -0.4, 0, 0, -0.4, 0, 0, 0.4, 0, -1, 0.4, 0, 0.2, -0.4, 0, 1.2, -0.4, 0, 1.2, 0.4, 0, 0.2, 0.4, 0],
        3,
      ),
    );
    quads.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    quads.setDrawRange(0, 6);
    return quads;
  }, []);

  return (
    <mesh geometry={geometry} position={[0, -2, 0]}>
      <meshBasicMaterial color="#c792ea" />
    </mesh>
  );
}

/**
 * three's `BufferGeometry` API. Left to right: a pyramid declared with `<bufferAttribute>` children
 * (position, colour and index) and lit by normals from `computeVertexNormals`, a box turned, scaled
 * and moved in its vertices and centred again, a fan from `setFromPoints`, and a torus tinted by a
 * colour attribute added with `setAttribute`. Below, one of two quads of a geometry, kept by
 * `setDrawRange`.
 */
export const scene: TestScene = {
  camera: { position: [0, 0, 8] },
  render: () => (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <Pyramid />
      <TransformedBox />
      <Fan />
      <TintedTorus />
      <DrawRange />
    </>
  ),
};

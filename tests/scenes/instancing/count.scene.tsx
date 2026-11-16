import { useFrame } from '@react-fiber/threejs-compat';
import { BoxGeometry, Color, Matrix4, MeshBasicMaterial, Vector3 } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ElementRef } from 'react';

const COUNT = 8;
const GREENS = new Float32Array(Array.from({ length: COUNT }, (_, i) => [0.1, 0.3 + i * 0.09, 0.2]).flat());

type Point = [number, number, number];

/**
 * A row built from `args` with a geometry and material made in code, its matrices written straight
 * into `instanceMatrix.array`, and a second row coloured by an `instancedBufferAttribute` child
 */
function Rows({ count }: { count: number }) {
  const geometry = useMemo(() => new BoxGeometry(0.5, 0.5, 0.5), []);
  const material = useMemo(() => new MeshBasicMaterial({ color: 'orange' }), []);
  const top = useRef<ElementRef<'instancedMesh'>>(null);
  const bottom = useRef<ElementRef<'instancedMesh'>>(null);
  const [readBack, setReadBack] = useState<{ corners: Point[]; third: Point; color: string } | null>(null);
  const frame = useRef(0);

  useLayoutEffect(() => {
    for (const mesh of [top.current!, bottom.current!]) {
      const array = mesh.instanceMatrix.array;

      for (let i = 0; i < COUNT; i++) {
        array.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, (i - (COUNT - 1) / 2) * 0.7, 0, 0, 1], i * 16);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(() => {
    if (++frame.current !== 4) return;

    const mesh = top.current!;
    const matrix = new Matrix4();
    const position = new Vector3();
    const color = new Color();

    mesh.computeBoundingBox();
    const { min, max } = mesh.boundingBox!;
    const corners: Point[] = [
      [min.x, max.y, max.z],
      [max.x, max.y, max.z],
      [min.x, min.y, max.z],
      [max.x, min.y, max.z],
    ];

    mesh.getMatrixAt(2, matrix);
    position.setFromMatrixPosition(matrix);
    bottom.current!.getColorAt(COUNT - 1, color);
    setReadBack({ corners, third: [position.x, position.y + 0.55, position.z], color: `#${color.getHexString()}` });
  });

  return (
    <>
      <instancedMesh ref={top} args={[geometry, material, COUNT]} count={count} position={[0, 0.7, 0]} />
      <instancedMesh ref={bottom} args={[undefined, undefined, COUNT]} position={[0, -0.5, 0]}>
        <instancedBufferAttribute attach="instanceColor" args={[GREENS, 3]} />
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial />
      </instancedMesh>
      {readBack?.corners.map((corner, index) => (
        <mesh key={index} position={[corner[0], corner[1] + 0.7, corner[2]]}>
          <sphereGeometry args={[0.06, 12, 6]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
      {readBack && (
        <>
          <mesh position={[readBack.third[0], readBack.third[1] + 0.7, readBack.third[2]]}>
            <sphereGeometry args={[0.1, 16, 8]} />
            <meshBasicMaterial color="hotpink" />
          </mesh>
          <mesh position={[0, -1.6, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshBasicMaterial color={readBack.color} />
          </mesh>
        </>
      )}
    </>
  );
}

/**
 * The rest of `InstancedMesh`. Top: eight orange boxes from `args={[geometry, material, 8]}`, placed by
 * writing into `instanceMatrix.array` and setting `needsUpdate`, then cut to five with `count`; white
 * dots mark the front corners of `boundingBox` from `computeBoundingBox`, around the five that remain,
 * and a pink dot sits over the third box, from `getMatrixAt`. Bottom: eight boxes in greens growing
 * lighter to the right, from an `<instancedBufferAttribute attach="instanceColor">` child; the box under
 * the rows has the last instance's colour, read back with `getColorAt`.
 */
export const scene: TestScene = {
  frames: 3,
  render: () => <Rows count={COUNT} />,
  act: async ({ frames, update }) => {
    await update(<Rows count={5} />);
    await frames();
  },
};

import { Mesh } from '@react-fiber/threejs-compat/three';
import type { MeshStandardMaterial } from '@react-fiber/threejs-compat/three';
import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';

type Group = ElementRef<'group'>;

const RING = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

const colorOf = (node: unknown) => (node instanceof Mesh ? (node.material as MeshStandardMaterial).color : null);

/**
 * A ring of grey boxes around a hidden group of grey spheres, recoloured from their parent: `traverse`
 * reaches every mesh and paints it white, `traverseVisible` then reaches only the boxes and paints
 * them a rainbow, and `getObjectByName` finds the box named `'top'` and darkens it. The spheres are
 * shown afterwards, still white.
 */
function Ring() {
  const root = useRef<Group>(null);

  useLayoutEffect(() => {
    const group = root.current!;
    group.traverse((node) => colorOf(node)?.set('white'));

    let visible = 0;
    group.traverseVisible((node) => colorOf(node)?.setHSL(visible++ / RING.length, 0.7, 0.5));

    colorOf(group.getObjectByName('top'))?.set('#303030');
    group.getObjectByName('inner')!.visible = true;
  }, []);

  return (
    <group ref={root} rotation={[0.5, 0, 0]}>
      {RING.map((angle, i) => (
        <mesh
          key={angle}
          name={i === 2 ? 'top' : `box-${i}`}
          position={[Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0]}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#808080" />
        </mesh>
      ))}
      <group name="inner" visible={false}>
        {RING.slice(0, 4).map((angle) => (
          <mesh key={angle} position={[Math.cos(angle + 0.8) * 0.8, Math.sin(angle + 0.8) * 0.8, 0]}>
            <sphereGeometry args={[0.25, 24, 12]} />
            <meshStandardMaterial color="#808080" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Walking the scene graph with three's `traverse`, `traverseVisible` and `getObjectByName`, and
 * colouring through `material.color`: eight boxes in a rainbow by walk order with the top one dark,
 * and four white spheres inside, which only `traverse` reached because their group was hidden
 */
export const scene: TestScene = {
  render: () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      <Ring />
    </>
  ),
};

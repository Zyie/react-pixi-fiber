import type { TestScene } from '@test-scene';
import { useLayoutEffect, useRef } from 'react';
import type { ElementRef } from 'react';
import type { ThreeEvent } from 'react-pixi-fiber';
import { Color, Matrix4 } from 'react-pixi-fiber/three';

const COUNT = 5;
const grey = new Color('#3a3f4b');
const hover = new Color('hotpink');
const picked = new Color('limegreen');

/** A row of instances that turn pink under the pointer and green once clicked, found by `instanceId` */
function Row() {
  const mesh = useRef<ElementRef<'instancedMesh'>>(null);
  const clicked = useRef(new Set<number>());

  useLayoutEffect(() => {
    const matrix = new Matrix4();

    for (let i = 0; i < COUNT; i++) {
      mesh.current!.setMatrixAt(i, matrix.makeTranslation((i - (COUNT - 1) / 2) * 1.05, 0, 0));
      mesh.current!.setColorAt(i, grey);
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
  }, []);

  const paint = (id: number, color: Color) => {
    mesh.current!.setColorAt(id, color);
    mesh.current!.instanceColor!.needsUpdate = true;
  };

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        for (let i = 0; i < COUNT; i++) {
          if (!clicked.current.has(i)) paint(i, i === event.instanceId ? hover : grey);
        }
      }}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        if (!clicked.current.has(event.instanceId!)) paint(event.instanceId!, grey);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        clicked.current.add(event.instanceId!);
        paint(event.instanceId!, picked);
      }}
    >
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

/**
 * Picking instances: a row of five boxes from one instanced mesh, each found by the event's
 * `instanceId`. A click on the second box turns it green; the pointer then rests on the fourth, which
 * turns pink. The rest stay grey.
 */
export const scene: TestScene = {
  render: () => <Row />,
  act: async ({ mouse, frames }) => {
    await mouse.click(132, 150);
    await mouse.move(268, 150);
    await frames();
  },
};

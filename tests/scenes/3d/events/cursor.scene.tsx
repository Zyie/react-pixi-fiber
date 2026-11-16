import type { TestScene } from '@test-scene';

/** A lamp under the cubes that is green when lit */
function Lamp({ x, lit }: { x: number; lit: boolean }) {
  return (
    <mesh3D position={[x, -1.6, 0]}>
      <cubeGeometry3D args={[{ width: 0.3, height: 0.3, depth: 0.3 }]} />
      <flatMaterial3D baseColor={lit ? '#3cb44b' : '#2a2a2a'} />
    </mesh3D>
  );
}

interface Lit {
  pointer?: boolean;
  grab?: boolean;
  cleared?: boolean;
}

function Scene({ right = true, lit = {} }: { right?: boolean; lit?: Lit }) {
  return (
    <>
      <container3D cursor="grab">
        <mesh3D position={[-1.2, 0.3, 0]} onClick={() => {}}>
          <cubeGeometry3D />
          <flatMaterial3D baseColor="#4363d8" />
        </mesh3D>
      </container3D>
      {right && (
        <mesh3D position={[1.2, 0.3, 0]} cursor="pointer" onClick={() => {}}>
          <cubeGeometry3D />
          <flatMaterial3D baseColor="#f58231" />
        </mesh3D>
      )}
      <Lamp x={-0.6} lit={!!lit.pointer} />
      <Lamp x={0} lit={!!lit.grab} />
      <Lamp x={0.6} lit={!!lit.cleared} />
    </>
  );
}

/**
 * The canvas's cursor over 3D nodes with handlers, as pixi sets it over 2D. The pointer rests on the orange
 * cube on the right, whose `cursor` is `pointer`, which lights the left lamp; then on the blue cube on the
 * left, which has no cursor of its own but sits in a container whose `cursor` is `grab`, which lights the
 * middle lamp. Back on the orange cube, it unmounts under the resting pointer and the cursor clears at
 * once, which lights the right lamp; the orange cube is gone.
 */
export const scene: TestScene = {
  render: () => <Scene />,
  act: async ({ mouse, frames, update }, state) => {
    const canvas = state.renderer.domElement as HTMLCanvasElement;
    const lit: Lit = {};
    await mouse.move(277, 131);
    await frames();
    lit.pointer = canvas.style.cursor === 'pointer';
    await mouse.move(123, 131);
    await frames();
    lit.grab = canvas.style.cursor === 'grab';
    await mouse.move(277, 131);
    await frames();
    await update(<Scene right={false} lit={lit} />);
    await frames();
    await update(<Scene right={false} lit={{ ...lit, cleared: canvas.style.cursor === '' }} />);
  },
};

import type { TestScene } from '@test-scene';
import { useMemo } from 'react';
import { BackSide, BufferAttribute, DoubleSide, FrontSide, SphereGeometry } from 'react-pixi-fiber/three';

interface ShellProps {
  side: number;
  flatShading: boolean;
  vertexColors: boolean;
  transparent: boolean;
  color: string;
}

/** A sphere with a wedge cut out, so `side` shows, and a colour per vertex from its normal */
function useShellGeometry() {
  return useMemo(() => {
    const geometry = new SphereGeometry(1.1, 18, 12, 0, Math.PI * 1.5);
    const normal = geometry.getAttribute('normal');
    const colors = new Float32Array(normal.count * 3);
    for (let i = 0; i < normal.count; i++) {
      colors.set([normal.getX(i) * 0.5 + 0.5, normal.getY(i) * 0.5 + 0.5, normal.getZ(i) * 0.5 + 0.5], i * 3);
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    return geometry;
  }, []);
}

function Shells(props: ShellProps) {
  const geometry = useShellGeometry();

  return (
    <>
      {[-1.6, 1.6].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={geometry} rotation-y={Math.PI * 0.75 - 0.5}>
            <meshStandardMaterial
              color={props.color}
              side={props.side}
              flatShading={props.flatShading}
              vertexColors={props.vertexColors}
              transparent={props.transparent}
              opacity={0.45}
              roughness={0.5}
            />
          </mesh>
          <mesh>
            <torusKnotGeometry args={[0.35, 0.11, 96, 12]} />
            <meshStandardMaterial color="#ff9f1c" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </>
  );
}

const START: ShellProps = {
  side: FrontSide,
  flatShading: false,
  vertexColors: false,
  transparent: false,
  color: '#ffffff',
};

/**
 * Props three compiles into the shader, changed after the first frame with no `needsUpdate`, as r3f
 * v10's AutoNeedsUpdate demo does: the shells start front-sided, smooth, white and opaque, then turn
 * double-sided, faceted, coloured by vertex, see-through and pale blue, then back-sided
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 5.5], fov: 45 },
  render: () => (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2.5} />
      <Shells {...START} />
    </>
  ),
  act: async ({ update, frames }) => {
    await update(
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2.5} />
        <Shells side={DoubleSide} flatShading vertexColors transparent color="#dbe9ff" />
      </>,
    );
    await frames();
    await update(
      <>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2.5} />
        <Shells side={BackSide} flatShading vertexColors={false} transparent={false} color="#dbe9ff" />
      </>,
    );
  },
};

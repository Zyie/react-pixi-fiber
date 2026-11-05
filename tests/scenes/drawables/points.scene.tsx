import type { TestScene } from '@test-scene';
import { useMemo } from 'react';

/** A spiral of points coloured from red to blue, as positions and colours */
function useSpiral(count: number): [Float32Array, Float32Array] {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6;
      positions.set([Math.cos(angle) * (0.3 + t * 1.2), (t - 0.5) * 2.4, Math.sin(angle) * (0.3 + t * 1.2)], i * 3);
      colors.set([1 - t, 0.3, t], i * 3);
    }
    return [positions, colors];
  }, [count]);
}

function Spiral() {
  const [positions, colors] = useSpiral(120);

  return (
    <points position={[1.8, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={6} sizeAttenuation={false} vertexColors />
    </points>
  );
}

/**
 * `<points>` with a `<pointsMaterial>`: the vertices of a sphere as squares that shrink with distance
 * (`size` 0.12 in world units) on the left, and a spiral of 6 pixel squares coloured per vertex
 * (`sizeAttenuation={false}`, `vertexColors`) on the right
 */
export const scene: TestScene = {
  camera: { position: [0, 1, 6] },
  render: () => (
    <>
      <points position={[-1.6, 0, 0]} rotation={[0.4, 0.3, 0]}>
        <sphereGeometry args={[1.2, 16, 10]} />
        <pointsMaterial size={0.12} color="#ffd166" />
      </points>
      <Spiral />
    </>
  ),
};

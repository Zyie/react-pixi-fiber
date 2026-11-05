import type { TestScene } from '@test-scene';

function Post({ z }: { z: number }) {
  return (
    <mesh position={[0, 0.75, z]} castShadow>
      <boxGeometry args={[0.4, 1.5, 0.4]} />
      <meshStandardMaterial color="#f0ad4e" />
    </mesh>
  );
}

/**
 * A directional light's shadow camera, set through piercing: `shadow-camera-left`, `-right`, `-top` and
 * `-bottom` shrink it to a 3 by 3 box around the light's line to the origin, and `shadow-mapSize` raises
 * the map to 1024. The light shines from the right, and of the three posts in a line from back to front
 * only the middle one is inside the box: it casts a shadow to its left, and the back and front posts
 * cast none, as in three.
 */
export const scene: TestScene = {
  camera: { position: [0, 7, 5] },
  canvas: { renderer: { shadows: true } },
  render: () => (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[3, 6, 0]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-1.5}
        shadow-camera-right={1.5}
        shadow-camera-top={1.5}
        shadow-camera-bottom={-1.5}
      />
      <Post z={-2.5} />
      <Post z={0} />
      <Post z={2.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
    </>
  ),
};

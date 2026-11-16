import type { TestScene } from '@test-scene';

/** Two meshes whose props, `args` and material change between frames */
function Changing({ step }: { step: number }) {
  const after = step > 0;
  return (
    <>
      <ambientLight3D intensity={after ? 0.6 : 0.2} />
      <directionalLight3D angle={[-35, 30, 0]} intensity={2} />
      <mesh3D position={after ? [-1.2, 0.6, 0] : [-2, -0.6, 0]} scale={after ? 1.2 : 0.6} angle={[20, 30, 0]}>
        <cubeGeometry3D />
        <phongMaterial3D baseColor={after ? '#4363d8' : '#e6194b'} />
      </mesh3D>
      <mesh3D position={[1.6, 0, 0]}>
        <sphereGeometry3D args={[{ radius: after ? 1.1 : 0.4 }]} />
        {after ? <flatMaterial3D baseColor="#3cb44b" /> : <phongMaterial3D baseColor="#f58231" />}
      </mesh3D>
    </>
  );
}

/**
 * Props changing between frames. It starts with a small red cube low on the left, a small orange phong
 * sphere on the right, and a dim ambient light; after two updates a frame apart: the cube is blue,
 * larger, higher and nearer the middle; the sphere is rebuilt from new `args` with a radius of 1.1 and
 * drawn with a flat green material that replaced the phong one; and the ambient light is brighter.
 */
export const scene: TestScene = {
  render: () => <Changing step={0} />,
  act: async ({ update, frames }) => {
    await frames(2);
    await update(<Changing step={1} />);
    await frames(2);
    await update(<Changing step={2} />);
  },
};

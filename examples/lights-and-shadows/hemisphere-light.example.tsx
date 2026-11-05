import type { Example } from '../example';

// #region scene
function Scene() {
  return (
    <>
      <hemisphereLight args={['#bde0ff', '#4a3826', 2]} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} />
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  );
}
// #endregion scene

/** A white ball lit blue from the sky above and brown from the ground below, with a sun to one side */
export const example: Example = {
  title: 'A hemisphere light',
  render: () => <Scene />,
};

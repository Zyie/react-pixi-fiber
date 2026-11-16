import { Canvas, createPortal, useFrame, useRenderTarget } from '@react-fiber/threejs-compat';
import { Color, PerspectiveCamera, Scene } from '@react-fiber/threejs-compat/three';
import type { Mesh } from '@react-fiber/threejs-compat/three';
// #region result
import { useRef, useState } from 'react';
// #endregion result

import type { Example } from '../example';

// #region result
function Monitor() {
  // #region target
  const fbo = useRenderTarget(512, 512);
  // #endregion target
  const [scene] = useState(() => {
    const virtual = new Scene();
    virtual.background = new Color('#1d3557');
    return virtual;
  });
  const [camera] = useState(() => {
    const lens = new PerspectiveCamera(50, 1, 0.1, 100);
    lens.position.set(0, 0, 4);
    return lens;
  });
  const box = useRef<Mesh>(null!);

  // #region frame
  useFrame(({ renderer }, delta) => {
    box.current.rotation.x += delta;
    box.current.rotation.y += delta * 0.6;
    renderer.setRenderTarget(fbo);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  });
  // #endregion frame

  return (
    <>
      {createPortal(
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 4]} intensity={2} />
          <mesh ref={box}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
        </>,
        scene,
      )}
      <mesh rotation={[0, -0.3, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshBasicMaterial map={fbo.texture} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Monitor />
    </Canvas>
  );
}
// #endregion result

/** A box spinning in a scene of its own, drawn into a render target and shown on a plane */
export const example: Example = {
  title: 'A scene drawn into a render target',
  frames: 30,
  render: () => <Monitor />,
};

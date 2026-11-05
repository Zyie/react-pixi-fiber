// #region result
import { Suspense, useLayoutEffect } from 'react';
import { Canvas, useEnvironment, useThree } from 'react-pixi-fiber';
import type { EnvironmentTexture, Scene } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
// #region hook
/** Lights a scene with a texture and draws it behind, until the returned function puts the scene back */
function showSky(scene: Scene, texture: EnvironmentTexture): () => void {
  const { background, environment } = scene;
  scene.background = texture;
  scene.environment = texture;
  return () => {
    scene.background = background;
    scene.environment = environment;
  };
}

function Sky() {
  const texture = useEnvironment({ files: '/environment/equirect.png' });
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => showSky(scene, texture), [scene, texture]);

  return null;
}
// #endregion hook

function Model() {
  return (
    <>
      <Sky />
      <mesh rotation={[0.4, 0.5, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#e9c46a" roughness={0.4} />
      </mesh>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** `useEnvironment` loads the map, and the component sets the scene's `environment` and `background` itself */
export const example: Example = {
  title: 'useEnvironment and the scene',
  render: () => <Model />,
};

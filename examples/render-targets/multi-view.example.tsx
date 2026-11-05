// #region result
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, createPortal, useFrame, useThree } from 'react-pixi-fiber';
import type { Vector2 } from 'react-pixi-fiber';
import { Color, OrthographicCamera, PerspectiveCamera, Scene } from 'react-pixi-fiber/three';
// #endregion result

import type { Example } from '../example';

// #region result
type Placement = 'bottomleft' | 'bottomright' | 'topleft' | 'topright';

const CORNERS: Record<Placement, Vector2> = {
  bottomleft: [0, 0],
  bottomright: [1, 0],
  topleft: [0, 1],
  topright: [1, 1],
};

// #region container
function Container({ clearColor, corner }: { clearColor: Color; corner: Vector2 }) {
  const { size, camera, scene } = useThree();
  const [x, y] = corner as [number, number];

  useFrame(
    ({ renderer }) => {
      const left = Math.floor(size.width * x);
      const bottom = Math.floor(size.height * y);
      renderer.setViewport(left, bottom, size.width, size.height);
      renderer.setScissor(left, bottom, size.width, size.height);
      renderer.setScissorTest(true);
      renderer.setClearColor(clearColor);
      renderer.render(scene, camera);
    },
    { phase: 'render' },
  );

  return null;
}
// #endregion container

function View({
  placement,
  clearColor,
  camera,
  children,
}: {
  placement: Placement;
  clearColor: string;
  camera: PerspectiveCamera | OrthographicCamera;
  children: ReactNode;
}) {
  const size = useThree((state) => state.size);
  const [scene] = useState(() => new Scene());
  const background = useMemo(() => new Color(clearColor), [clearColor]);

  return createPortal(
    <>
      <Container clearColor={background} corner={CORNERS[placement]} />
      {children}
    </>,
    scene,
    { camera, size: { width: size.width / 2, height: size.height / 2, top: 0, left: 0 } },
  );
}

function Stage() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      {[-1, 0, 1].map((x) => (
        <mesh key={x} position={[x * 1.1, x === 0 ? 0.4 : 0, 0]}>
          <boxGeometry args={[0.8, 1.6, 0.8]} />
          <meshStandardMaterial color={x === 0 ? '#e63946' : '#2a9d8f'} />
        </mesh>
      ))}
    </>
  );
}

function Views() {
  const cameras = useMemo(() => {
    const front = new PerspectiveCamera(50, 4 / 3, 0.1, 100);
    front.position.set(0, 0, 5);
    const side = new PerspectiveCamera(50, 4 / 3, 0.1, 100);
    side.position.set(5, 1, 0);
    side.lookAt(0, 0, 0);
    const top = new OrthographicCamera(-100, 100, 75, -75, 0.1, 100);
    top.zoom = 40;
    top.position.set(0, 5, 0.01);
    top.lookAt(0, 0, 0);
    const corner = new PerspectiveCamera(50, 4 / 3, 0.1, 100);
    corner.position.set(-3, 3, 4);
    corner.lookAt(0, 0, 0);
    return { front, side, top, corner };
  }, []);

  return (
    <>
      <View placement="bottomleft" clearColor="orange" camera={cameras.top}>
        <Stage />
      </View>
      <View placement="bottomright" clearColor="hotpink" camera={cameras.front}>
        <Stage />
      </View>
      <View placement="topleft" clearColor="aquamarine" camera={cameras.corner}>
        <Stage />
      </View>
      <View placement="topright" clearColor="lightblue" camera={cameras.side}>
        <Stage />
      </View>
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Views />
    </Canvas>
  );
}
// #endregion result

/**
 * r3f's MultiView demo, without its drei controls and models: four portals with their own scene, camera
 * and half-size `size`, each drawn by a render-phase job into its quarter of the canvas with
 * `setViewport` and `setScissor`, on its own clear colour
 */
export const example: Example = {
  title: 'Four views of one canvas',
  frames: 2,
  render: () => <Views />,
};

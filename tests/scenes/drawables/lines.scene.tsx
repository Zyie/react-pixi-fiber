import type { TestScene } from '@test-scene';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { ElementRef } from 'react';
import { BoxGeometry, BoxHelper, BufferGeometry, Vector3 } from 'react-pixi-fiber/three';

function Helix() {
  const geometry = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      points.push(new Vector3(Math.cos(t * Math.PI * 4) * 0.6, t * 1.8 - 0.9, Math.sin(t * Math.PI * 4) * 0.6));
    }
    return new BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <threeLine geometry={geometry} position={[-3.2, 0.9, 0]}>
      <lineBasicMaterial color="#ff6b6b" />
    </threeLine>
  );
}

/** A box outlined by a `BoxHelper`, made once the box is in the scene */
function Outlined() {
  const mesh = useRef<ElementRef<'mesh'>>(null);
  const group = useRef<ElementRef<'group'>>(null);
  useLayoutEffect(() => {
    const parent = group.current!;
    const helper = new BoxHelper(mesh.current!, '#ffe66d');
    parent.add(helper);
    return () => {
      parent.remove(helper);
      helper.dispose();
    };
  }, []);

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[3.2, 0.9, 0]} rotation={[0.3, 0.5, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshBasicMaterial color="#2b2d42" />
      </mesh>
    </group>
  );
}

/**
 * The line objects and helpers. Top: a helix as a `<threeLine>` strip, a box's edges as
 * `<lineSegments>` with an `<edgesGeometry>`, a circle's rim as a `<lineLoop>`, and a box outlined by a
 * `BoxHelper`. Bottom: a `<gridHelper>`, an `<axesHelper>` and an `<arrowHelper>`.
 */
export const scene: TestScene = {
  camera: { position: [0, 1.5, 8] },
  render: () => (
    <>
      <Helix />
      <lineSegments position={[-1.1, 0.9, 0]} rotation={[0.4, 0.6, 0]}>
        <edgesGeometry args={[new BoxGeometry(1.1, 1.1, 1.1)]} />
        <lineBasicMaterial color="#4ecdc4" />
      </lineSegments>
      <lineLoop position={[1.1, 0.9, 0]}>
        <circleGeometry args={[0.7, 12]} />
        <lineBasicMaterial color="#c7f464" />
      </lineLoop>
      <Outlined />
      <gridHelper args={[4, 8, '#ffffff', '#5c6b73']} position={[-1.5, -1.2, 0]} />
      <axesHelper args={[1.2]} position={[1.6, -1.2, 0]} />
      <arrowHelper args={[new Vector3(0.5, 0.8, 0.3).normalize(), new Vector3(3.2, -1.4, 0), 1.6, '#ff9f1c']} />
    </>
  ),
  // WebGPU rasterises 1 pixel lines by its own rule, putting scattered pixels along each line one
  // pixel over from WebGL's and three's (6% of this scene's drawn pixels); WebGL matches at 0.0%.
  parity: { maxDiff: 0.07 },
};

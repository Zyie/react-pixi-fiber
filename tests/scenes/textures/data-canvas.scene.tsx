import type { TestScene } from '@test-scene';
import { useMemo } from 'react';
import { CanvasTexture, DataTexture } from 'react-pixi-fiber/three';

/** A 4 by 2 texture from bytes: its first row is red, green, blue, white, its second black to grey */
function DataPanel() {
  const texture = useMemo(() => {
    const data = new Uint8Array([
      ...[255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255],
      ...[0, 0, 0, 255, 60, 60, 60, 255, 120, 120, 120, 255, 180, 180, 180, 255],
    ]);
    const map = new DataTexture(data, 4, 2);

    map.needsUpdate = true;

    return map;
  }, []);

  return (
    <mesh position={[-1.1, 0, 0]}>
      <planeGeometry args={[1.9, 1.9]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/** A canvas drawn in 2D: an orange disc on teal, with a dark bar along its top */
function CanvasPanel() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = canvas.height = 64;
    context.fillStyle = '#1f8a8a';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#202040';
    context.fillRect(0, 0, 64, 12);
    context.fillStyle = '#ff9020';
    context.beginPath();
    context.arc(32, 38, 18, 0, Math.PI * 2);
    context.fill();

    return new CanvasTexture(canvas);
  }, []);

  return (
    <mesh position={[1.1, 0, 0]}>
      <planeGeometry args={[1.9, 1.9]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/**
 * A `DataTexture` (left), whose first row of bytes lands at the bottom of the plane as in three, and
 * a `CanvasTexture` (right), which shows the canvas the right way up
 */
export const scene: TestScene = {
  render: () => (
    <>
      <DataPanel />
      <CanvasPanel />
    </>
  ),
};

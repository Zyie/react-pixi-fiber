import { useRef, useState } from 'react';
import { useFrame } from 'react-pixi-fiber';
import type { RootState } from 'react-pixi-fiber';

/** Where a hit is, as a marker draws it */
export type MarkerPoint = [number, number, number];

/** The marker colour of each hit by its place in the sorted list: red for the nearest, then orange, yellow, ... */
export const ORDER_COLORS = ['#e6194b', '#f58231', '#ffe119', '#3cb44b', '#42d4f4', '#4363d8', '#911eb4', '#f032e6'];

/**
 * Runs a raycast once, on a frame after the first render, when every renderer has worked out the world
 * matrices it picks with, and returns what it found
 * @param cast - Casts and returns the marker points, in the order to colour them
 * @param frame - The frame to cast on
 */
export function useCastOnFrame(cast: (state: RootState) => MarkerPoint[], frame = 2): MarkerPoint[] {
  const count = useRef(0);
  const [points, setPoints] = useState<MarkerPoint[]>([]);

  useFrame((state) => {
    if (++count.current === frame) setPoints(cast(state));
  });

  return points;
}

/** A small sphere at each point, coloured by its place in the list */
export function HitMarkers({ points, radius = 0.09 }: { points: MarkerPoint[]; radius?: number }) {
  return (
    <>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[radius, 16, 8]} />
          <meshBasicMaterial color={ORDER_COLORS[index % ORDER_COLORS.length]} />
        </mesh>
      ))}
    </>
  );
}

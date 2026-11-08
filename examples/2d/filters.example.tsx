// #region result
import { DropShadowFilter, GlowFilter } from 'pixi-filters';
import type { Spritesheet } from 'pixi.js';
import { Suspense, useMemo } from 'react';
import { Canvas, extend, once, useAsset, useTexture } from 'react-pixi-fiber';
import type { ThreeElement } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
// #region extend
extend({ DropShadowFilter2D: DropShadowFilter, GlowFilter2D: GlowFilter });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    dropShadowFilter2D: ThreeElement<typeof DropShadowFilter>;
    glowFilter2D: ThreeElement<typeof GlowFilter>;
  }
}
// #endregion extend

// #region glow
const GLOW = { distance: 16, outerStrength: 2.5, color: '#ffd166', quality: 1 };

function Coin() {
  const sheet = useAsset<Spritesheet>('/sprites/coin.json');

  return (
    <animatedSprite2D
      args={[sheet.animations.spin]}
      playing
      animationSpeed={0.15}
      anchor={0.5}
      x={200}
      y={130}
      scale={2}
    >
      <glowFilter2D attach="filters-0" args={[GLOW]} />
    </animatedSprite2D>
  );
}
// #endregion glow

function Card() {
  const bricks = useTexture('/textures/bricks.png');
  const panel = useTexture('/textures/panel.png');
  const slices = useMemo(
    () => ({ texture: panel, leftWidth: 14, topHeight: 14, rightWidth: 14, bottomHeight: 14 }),
    [panel],
  );

  return (
    <>
      {/* #region blur */}
      <tilingSprite2D texture={bricks} width={400} height={300}>
        <blurFilter2D attach="filters-0" strength={3} />
        <colorMatrixFilter2D attach="filters-1" brightness={once(0.5, false)} />
      </tilingSprite2D>
      {/* #endregion blur */}
      {/* #region shadow */}
      <nineSliceSprite2D args={[slices]} x={90} y={50} width={220} height={200}>
        <dropShadowFilter2D attach="filters-0" offsetX={8} offsetY={10} alpha={0.6} blur={3} />
      </nineSliceSprite2D>
      {/* #endregion shadow */}
      <text2D
        text="BONUS"
        anchor={0.5}
        x={200}
        y={215}
        style={{ fill: '#f4d35e', fontFamily: 'Arial', fontSize: 30, fontWeight: 'bold' }}
      />
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Card />
        <Coin />
      </Suspense>
    </Canvas>
  );
}
// #endregion result

/** A glowing coin on a card with a drop shadow, over a blurred and darkened brick wall */
export const example: Example = {
  title: 'Filters, built in and from pixi-filters',
  render: () => (
    <>
      <Card />
      <Coin />
    </>
  ),
};

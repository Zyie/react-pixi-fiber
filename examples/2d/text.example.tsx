// #region result
import { BitmapFont, TextStyle } from 'pixi.js';
import type { BitmapText } from 'pixi.js';
import { useRef } from 'react';
import { Canvas, useFrame } from 'react-pixi-fiber';
// #endregion result

import type { Example } from '../example';

// #region result
// #region style
const TITLE = new TextStyle({
  fill: '#ffffff',
  fontFamily: 'Arial',
  fontSize: 44,
  fontWeight: 'bold',
  stroke: { color: '#e63946', width: 6, join: 'round' },
  dropShadow: { color: '#000000', alpha: 0.5, angle: Math.PI / 3, distance: 6, blur: 4 },
});
// #endregion style

// #region bitmap
BitmapFont.install({
  name: 'Score',
  style: { fontFamily: 'Arial', fontSize: 36, fill: '#ffd166', fontWeight: 'bold' },
  chars: [['0', '9']],
});

function Score() {
  const text = useRef<BitmapText>(null);
  const score = useRef(0);

  useFrame(() => {
    score.current += 7;
    text.current!.text = String(score.current).padStart(6, '0');
  });

  return <bitmapText2D ref={text} text="000000" anchor={0.5} x={200} y={160} style={{ fontFamily: 'Score' }} />;
}
// #endregion bitmap

function Hud() {
  return (
    <>
      <text2D text="GAME OVER" anchor={0.5} x={200} y={90} style={TITLE} />
      <Score />
      {/* #region wrap */}
      <text2D
        text="Press any key to play again, or wait for the attract mode to start"
        anchor={0.5}
        x={200}
        y={235}
        style={{
          fill: '#a8dadc',
          fontFamily: 'Arial',
          fontSize: 16,
          wordWrap: true,
          wordWrapWidth: 260,
          align: 'center',
        }}
      />
      {/* #endregion wrap */}
    </>
  );
}

export function App() {
  return (
    <Canvas>
      <Hud />
    </Canvas>
  );
}
// #endregion result

/** A game-over screen: a styled title, a bitmap-font score counting up every frame, and wrapped text */
export const example: Example = {
  title: 'Text, bitmap text and wrapping',
  frames: 30,
  render: () => <Hud />,
};

import type { TestScene } from '@test-scene';
import { FillGradient, TextStyle } from 'pixi.js';

const GRADIENT = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [
    { offset: 0, color: 0xffe119 },
    { offset: 1, color: 0xe6194b },
  ],
});

/** One style object two texts share; changing it restyles both */
const LABEL = new TextStyle({ fill: 0x46f0f0, fontSize: 18, fontFamily: 'Arial', letterSpacing: 4 });

/**
 * Text styles: a white title stroked in blue with a red drop shadow; a yellow-to-red `FillGradient`
 * fill in bold italic; a paragraph wrapped at 170 pixels and centred; two labels sharing one
 * `TextStyle` with letter spacing, where the second's `style-fontSize={26}` pierces into the shared
 * style, so both are 26 pixels; and a number as `text`.
 */
export const scene: TestScene = {
  render: () => (
    <>
      <text2D
        text="Outlined"
        x={20}
        y={14}
        style={{
          fill: 'white',
          fontSize: 40,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          stroke: { color: 0x4363d8, width: 6, join: 'round' },
          dropShadow: { color: 0xe6194b, alpha: 0.8, angle: Math.PI / 4, distance: 5, blur: 2 },
        }}
      />
      <text2D
        text="Gradient"
        x={220}
        y={14}
        style={{ fill: GRADIENT, fontSize: 40, fontFamily: 'Arial', fontWeight: 'bold', fontStyle: 'italic' }}
      />
      <text2D
        text="A paragraph that wraps inside its width and centres each line"
        x={20}
        y={90}
        style={{
          fill: 'white',
          fontSize: 18,
          fontFamily: 'Arial',
          wordWrap: true,
          wordWrapWidth: 170,
          align: 'center',
        }}
      />
      <text2D text="SHARED" x={230} y={100} style={LABEL} />
      <text2D text="STYLE" x={230} y={130} style={LABEL} style-fontSize={26} />
      <text2D text={2048} x={20} y={210} style={{ fill: 0xf58231, fontSize: 48, fontFamily: 'Arial' }} />
    </>
  ),
};

import type { TestScene } from '@test-scene';
import { BitmapFont } from 'pixi.js';
import type { BitmapText, Text } from 'pixi.js';
import { useRef, useState } from 'react';
import { useAsset, useFrame } from 'react-pixi-fiber';

BitmapFont.install({
  name: 'Digits',
  style: { fontFamily: 'Arial', fontSize: 40, fill: 0xffe119, fontWeight: 'bold' },
  chars: [['0', '9'], ' :.'],
});

/** A frame counter written into the text through its ref, which re-renders nothing */
function Counter() {
  const text = useRef<BitmapText>(null);
  const frames = useRef(0);

  useFrame(() => {
    text.current!.text = `${++frames.current}`.padStart(4, '0');
  });

  return <bitmapText2D ref={text} text="0000" x={20} y={20} style={{ fontFamily: 'Digits', fontSize: 40 }} />;
}

/** A clock in canvas text, whose `text` prop React sets from state on every tenth frame */
function Clock() {
  const [seconds, setSeconds] = useState(0);
  const frames = useRef(0);

  useFrame((state) => {
    if (++frames.current % 10 === 0) setSeconds(state.elapsed);
  });

  return (
    <text2D
      text={`${seconds.toFixed(2)} s`}
      x={220}
      y={24}
      style={{ fill: 'white', fontSize: 32, fontFamily: 'Arial' }}
    />
  );
}

/** The width of a line measured after it renders, read from the text's ref */
function Measured() {
  const text = useRef<Text>(null);
  const [width, setWidth] = useState(0);

  useFrame(() => {
    if (width === 0) setWidth(text.current!.width);
  });

  return (
    <>
      <text2D
        ref={text}
        text="measure me"
        x={20}
        y={200}
        style={{ fill: '#3cb4e8', fontSize: 30, fontFamily: 'Arial' }}
      />
      <graphics2D draw={(graphics) => graphics.rect(20, 240, width, 6).fill(0x3cb4e8)} />
    </>
  );
}

function Loaded() {
  useAsset('/fonts/blocks.fnt');

  return (
    <>
      <bitmapText2D
        text="PIXI 2D"
        x={20}
        y={100}
        style={{ fontFamily: 'Blocks', fontSize: 28, fill: 'white' }}
        tint={0xf032e6}
      />
      <bitmapText2D text="PIXI" x={205} y={95} style={{ fontFamily: 'Blocks', fontSize: 56, fill: 'white' }} />
    </>
  );
}

/**
 * Bitmap and dynamic text after 25 frames. A yellow counter in `Digits`, a font `BitmapFont.install`
 * built from a canvas style, reads 0025: `useFrame` writes its count into the text through its ref. A
 * canvas clock reads 0.32 s, the root's `elapsed` set from state on the twentieth frame. Below, the
 * `Blocks` font, loaded through `useAsset` and filled white, reads "PIXI 2D" tinted pink, and "PIXI" at
 * twice its 28 pixels. At the bottom a
 * blue bar as wide as the line above it, from the text's measured `width`.
 */
export const scene: TestScene = {
  frames: 25,
  render: () => (
    <>
      <Counter />
      <Clock />
      <Loaded />
      <Measured />
    </>
  ),
};

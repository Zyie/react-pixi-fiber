# Text

pixi.js has three kinds of text, and each is an element: `<text2D>` draws with the browser's canvas, `<bitmapText2D>` from a bitmap font's glyphs, and `<htmlText2D>` renders HTML and CSS. All three take `text` and `style` props.

## Text and styles

`style` takes a `TextStyle`, or its options as an object: font, fill, stroke, drop shadow, word wrap and alignment. A `TextStyle` made once can be shared by several texts, and changing it restyles them all:

<!-- snippet: examples/2d/text.example.tsx#style -->

```tsx
const TITLE = new TextStyle({
  fill: '#ffffff',
  fontFamily: 'Arial',
  fontSize: 44,
  fontWeight: 'bold',
  stroke: { color: '#e63946', width: 6, join: 'round' },
  dropShadow: { color: '#000000', alpha: 0.5, angle: Math.PI / 3, distance: 6, blur: 4 },
});
```

Word wrap needs `wordWrap` and a `wordWrapWidth`; `align` lines the wrapped lines up:

<!-- snippet: examples/2d/text.example.tsx#wrap -->

```tsx
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
```

A dash pierces into the style, as into any field: `style-fill="hotpink"` or `style-fontSize={24}`. Piercing changes the style object itself, so on a shared `TextStyle` it changes every text that uses it.

An object written inline in `style={{ ... }}` is a new object on every render, and pixi rebuilds the text from it each time. That's fine for text that renders rarely; for text in a component that renders often, hoist the style or wrap it in `useMemo`.

## Bitmap text

Canvas text is drawn into a texture again whenever its text changes, which is slow for text that changes every frame, such as a score or a timer. A bitmap font draws each glyph from one texture, so changing the text costs almost nothing. `BitmapFont.install` builds a font from a canvas style, for the characters you name:

<!-- snippet: examples/2d/text.example.tsx#bitmap -->

```tsx
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
```

![A game-over screen: a white title outlined in red, a yellow score in a bitmap font, and wrapped text](../../../tests/snapshots/docs/2d/text.webgl.png)

`useFrame` writes the text through a ref here, so the score changes every frame without rendering the component. A bitmap font from a file (`.fnt` or `.xml`) loads with `useAsset` and is used by the name it declares; see [Loading 2D assets](loading-2d.md). A loaded font's glyphs are multiplied by the style's `fill`, which is black by default, so give it `fill: 'white'` and colour it with `fill` or `tint`.

## HTML text

`<htmlText2D>` lays text out as HTML, so it can mix styles inside a line. `tagStyles` styles the tags its `text` uses:

```tsx
<htmlText2D
  text="Some <b>bold</b> and <i>italic</i> text"
  style={{
    fill: 'white',
    fontSize: 28,
    tagStyles: { b: { fill: '#f58231', fontWeight: 'bold' }, i: { fill: '#3cb4e8', fontStyle: 'italic' } },
  }}
/>
```

pixi renders HTML text through an SVG image, which the browser decodes on its own time, so a change shows a frame or two later than canvas text.

## Measuring

A text's `width` and `height` are known once pixi has laid it out. Read them from the ref in `useFrame` or an effect, rather than during render.

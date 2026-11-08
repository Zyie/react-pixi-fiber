# Filters, masks and blend modes

Filters, masks and blend modes change how a 2D element is drawn: a filter runs a shader over its picture, a mask cuts it to a shape, and a blend mode mixes it with what is under it.

## Filters

A filter is an element that attaches to the `filters` of its parent: `attach="filters-0"` first, `filters-1` second, and so on. Its props are the filter's own, and unmounting it takes it off again. pixi.js's filters are elements already: `<blurFilter2D>`, `<alphaFilter2D>`, `<colorMatrixFilter2D>`, `<displacementFilter2D>`, `<noiseFilter2D>` and `<filter2D>`.

<!-- snippet: examples/2d/filters.example.tsx#blur -->

```tsx
<tilingSprite2D texture={bricks} width={400} height={300}>
  <blurFilter2D attach="filters-0" strength={3} />
  <colorMatrixFilter2D attach="filters-1" brightness={once(0.5, false)} />
</tilingSprite2D>
```

A colour matrix is set by methods, `brightness()`, `sepia()`, `hue()`, `greyscale()`. r3f's `once()` calls a method when the element mounts, with the arguments it is given.

A filter on a container filters the container's picture as a whole. An `<alphaFilter2D>` fades a group as one, so where its children overlap, the one in front hides the one behind, which the group's `alpha` wouldn't do.

`filters` is a prop too, for filters made elsewhere: `filters={blur}` or `filters={[blur, glow]}`. A filter passed this way isn't React's to destroy.

## Filters from other packages

A filter class from another package, such as [pixi-filters](https://github.com/pixijs/filters), becomes an element with `extend`, under a name ending in `2D`, as any class of your own does (see [Your own 2D classes](extend-2d.md)):

<!-- snippet: examples/2d/filters.example.tsx#extend -->

```tsx
extend({ DropShadowFilter2D: DropShadowFilter, GlowFilter2D: GlowFilter });

declare module 'react-pixi-fiber' {
  interface ThreeElements {
    dropShadowFilter2D: ThreeElement<typeof DropShadowFilter>;
    glowFilter2D: ThreeElement<typeof GlowFilter>;
  }
}
```

<!-- snippet: examples/2d/filters.example.tsx#shadow -->

```tsx
<nineSliceSprite2D args={[slices]} x={90} y={50} width={220} height={200}>
  <dropShadowFilter2D attach="filters-0" offsetX={8} offsetY={10} alpha={0.6} blur={3} />
</nineSliceSprite2D>
```

Some filters build their shader from their options, as `GlowFilter` does from `distance` and `quality`: pass those in `args`, which are the constructor's, and keep the object outside the component so it isn't rebuilt:

<!-- snippet: examples/2d/filters.example.tsx#glow -->

```tsx
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
```

![A glowing gold coin on a navy card with a drop shadow, over a blurred brick wall](../../../tests/snapshots/docs/2d/filters.webgl.png)

## Masks

A mask hides the parts of an element outside a shape. The simplest is a child with `attach="mask"`, which masks its parent, in the parent's own space:

```tsx
<container2D x={210} y={60}>
  <sprite2D texture={texture} width={160} height={160} />
  <graphics2D attach="mask" draw={(graphics) => graphics.circle(80, 80, 70).fill('white')} />
</container2D>
```

`mask` is a prop too. It takes another element, a graphics for a shape or a sprite, whose red channel says how much shows through. That element is drawn only as a mask, not on its own. Keep its ref in state, which renders again once the ref is set:

```tsx
const [shape, setShape] = useState<Graphics | null>(null);

<>
  <graphics2D ref={setShape} draw={(graphics) => graphics.circle(75, 75, 50).fill('white')} />
  <sprite2D texture={texture} mask={shape} />
</>;
```

### Inverse masks

`mask` also takes pixi's mask options, as `setMask` does. `inverse: true` shows everything outside the mask instead of inside it. Options without a `mask` keep the one there is, such as an `attach="mask"` child's, so a spotlight is darkness with an inverse circle cut out of it:

<!-- snippet: examples/2d/masks.example.tsx#inverse -->

```tsx
const drawDark = (graphics: Graphics) => graphics.rect(0, 0, 400, 300).fill({ color: '#05050a', alpha: 0.92 });
const drawSpot = (graphics: Graphics) => graphics.circle(0, 0, 70).fill('white');

function Darkness({ spot }: { spot: RefObject<Graphics | null> }) {
  return (
    <container2D mask={{ inverse: true }}>
      <graphics2D draw={drawDark} />
      <graphics2D ref={spot} attach="mask" x={200} y={150} draw={drawSpot} />
    </container2D>
  );
}
```

![Dark bricks with a circle of light over a gold coin](../../../tests/snapshots/docs/2d/masks.webgl.png)

With a mask element, pass both: `mask={shape && { mask: shape, inverse: true }}`.

## Blend modes

`blendMode` mixes an element with what is drawn under it: `'add'`, `'multiply'`, `'screen'`, `'erase'` and `'normal'` are built in. The others, such as `'overlay'`, `'difference'` and `'color-burn'`, need `import 'pixi.js/advanced-blend-modes'` once, and on WebGL a back buffer to read from, which the canvas's renderer settings turn on:

```tsx
import 'pixi.js/advanced-blend-modes';

<Canvas renderer={{ useBackBuffer: true }}>
  <sprite2D texture={texture} blendMode="overlay" />
</Canvas>;
```

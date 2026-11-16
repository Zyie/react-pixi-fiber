# 2D performance

2D follows the same rules as [3D in r3f](../../__docs__/scaling-performance.md): render on demand when nothing moves, change objects in `useFrame` rather than through state, and reuse what can be reused. This page adds what is particular to pixi.js.

## Change objects, not React state

`useFrame` with a ref changes an object without rendering its component. Setting state every frame renders the component and diffs its props every frame. Keep state for what changes the tree, such as which elements exist, and refs for what moves.

## Keep args and options stable

`args` are constructor arguments: when one of them changes, r3f builds the object again. pixi.js's constructors take an options object, and an object written inline in `args={[{ ... }]}` is a new object on every render, so the element is rebuilt every time its component renders, losing its state, such as an animated sprite's frame. Pass what can change as props, and keep the options object outside the component or in `useMemo`:

```tsx
const slices = useMemo(() => ({ texture, leftWidth: 12, topHeight: 12, rightWidth: 12, bottomHeight: 12 }), [texture]);

<nineSliceSprite2D args={[slices]} width={width} height={height} />;
```

The same goes for a `draw` function, which redraws the graphics when it is new, and for a `style` object, which rebuilds the text.

## Share textures and contexts

A texture is loaded once per URL, however many sprites use it. A `GraphicsContext` shared by many graphics is built once and drawn by all of them, each with its own transform and tint ([Graphics](graphics-2d.md#sharing-a-context)). Spritesheets put many frames in one texture, which lets pixi batch the sprites that use them.

## Cache what doesn't change

`cacheAsTexture` draws a container and its children into a texture once, then draws that texture each frame. A board of many tiles, or a panel of text and icons, costs one quad:

<!-- snippet: examples/2d/cache.example.tsx#cached -->

```tsx
function Board() {
  return (
    <container2D cacheAsTexture x={20} y={20}>
      {Array.from({ length: 70 }, (_, i) => (
        <graphics2D key={i} context={TILE} x={(i % 10) * 36} y={Math.floor(i / 10) * 36} />
      ))}
    </container2D>
  );
}
```

![A grid of navy tiles with a gold coin over them](../../../tests/snapshots/docs/2d/cache.webgl.png)

The texture isn't redrawn when the children change: call `updateCacheTexture()` on the container's ref after a change, in a `useLayoutEffect` so it is redrawn in the same frame. `cacheAsTexture={{ resolution: 0.5 }}` caches at a lower resolution. A container that moves as a whole but changes inside can be a render group instead, `isRenderGroup`, which pixi transforms on the GPU.

## Particles and bitmap text

A `<particleContainer2D>` draws thousands of quads in one call ([Particles](particles-2d.md)). Text that changes every frame, such as a score, is cheaper as `<bitmapText2D>` than as `<text2D>`, which redraws its texture on each change ([Text](text-2d.md#bitmap-text)).

## Culling

Culling skips what is off the canvas. pixi.js turns it on with its `CullerPlugin`, as for a pixi `Application`: once registered, each canvas culls its 2D before drawing, and an element with `cullable` that is off the canvas isn't drawn. `cullArea` gives a rectangle to test in place of the element's bounds, which is quicker for an element with many children.

```tsx
import { CullerPlugin, extensions } from 'pixi.js';

extensions.add(CullerPlugin);

<container2D cullable>{/* a level larger than the canvas */}</container2D>;
```

Culling walks the 2D tree every frame, so register it when much of the scene is off the canvas.

The bridges between 2D and 3D have costs of their own, such as a pixi-3d view per `<View3D>` and a filter pass over the 3D for `<Layer3D>`; [Mixing 2D and 3D](mixing-2d-and-3d.md#what-they-cost) measures them.

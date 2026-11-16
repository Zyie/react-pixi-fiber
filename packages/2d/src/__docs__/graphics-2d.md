# Graphics

`<graphics2D>` is pixi.js's `Graphics`: shapes drawn with pixi's chained calls, `rect`, `circle`, `poly`, `moveTo` and `bezierCurveTo`, then filled or stroked. In React the drawing goes in the `draw` prop.

## The draw prop

`draw` is a function that gets the graphics, cleared, and draws into it. It runs when the element mounts and whenever a new function is passed, so a drawing that closes over props or state follows them:

```tsx
<graphics2D draw={(graphics) => graphics.circle(0, 0, radius).fill(color)} />
```

A function written inline is new on every render, so the graphics is redrawn whenever its component renders. That is right while the drawing depends on what changed, and wasted work when it doesn't: hoist a fixed drawing out of the component, or wrap it in `useCallback`.

## Fills, strokes and gradients

`fill` and `stroke` take a colour or pixi's fill options. A stroke's `alignment` puts it inside the shape (1), on its edge (0.5) or outside it (0). A `FillGradient` fills with a linear or radial gradient, and a `texture` with a picture, placed by a `matrix`. Make gradients once, outside the component or in `useMemo`, since each holds a texture:

<!-- snippet: examples/2d/graphics.example.tsx#gradients -->

```tsx
const SKY = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [
    { offset: 0, color: '#0b1026' },
    { offset: 1, color: '#3b2667' },
  ],
});

const HILLS = new FillGradient({
  type: 'linear',
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
  colorStops: [
    { offset: 0, color: '#2a9d8f' },
    { offset: 1, color: '#14423c' },
  ],
});
```

## Holes

`cut()` cuts the shape drawn last out of the one before it, and each further `cut()` adds another hole. A hole has to lie inside the shape it's cut from: one that crosses its edge doesn't triangulate. The moon's craters are circles cut from it, so the sky shows through:

<!-- snippet: examples/2d/graphics.example.tsx#holes -->

```tsx
const drawMoon = (graphics: Graphics) =>
  graphics.circle(0, 0, 34).fill('#f4f1de').circle(-11, -9, 8).cut().circle(12, 4, 10).cut().circle(-6, 17, 5).cut();

function Moon() {
  return <graphics2D x={300} y={70} draw={drawMoon} />;
}
```

## Sharing a context

What a graphics draws lives in its `GraphicsContext`. Several graphics can share one, so the shape is built once and drawn many times, each graphics with its own position, scale and `tint`. Pass the context as the `context` prop, or in `args`:

<!-- snippet: examples/2d/graphics.example.tsx#context -->

```tsx
const STAR = new GraphicsContext().star(0, 0, 4, 5, 2).fill('#fff6c2');

const STARS = [
  [40, 40, 1],
  [110, 70, 0.6],
  [170, 30, 0.8],
  [240, 90, 0.5],
  [345, 150, 1.1],
  [360, 110, 0.7],
  [70, 120, 0.5],
  [210, 140, 0.9],
] as const;

function Stars() {
  return (
    <>
      {STARS.map(([x, y, scale]) => (
        <graphics2D key={`${x},${y}`} context={STAR} x={x} y={y} scale={scale} />
      ))}
    </>
  );
}
```

![A night sky with a gradient, stars sharing one context, a moon with craters and green hills](../../../../tests/snapshots/docs/2d/graphics.webgl.png)

A context you make yourself is yours to free: React doesn't destroy a context passed in as a prop. Call `context.destroy()` when nothing uses it any more, as in an effect's cleanup.

A context can also be an element, `<graphicsContext2D>`, with its own `draw` prop. React owns it, destroying it on unmount, so it can be kept in state and shared, or attached to a single graphics with `attach="context"`:

```tsx
const [badge, setBadge] = useState<GraphicsContext | null>(null);

<container2D>
  <graphicsContext2D ref={setBadge} draw={(context) => context.star(0, 0, 5, 30).fill('white')} />
  <graphics2D context={badge ?? undefined} tint="red" />
  <graphics2D context={badge ?? undefined} tint="blue" x={70} />
</container2D>;
```

A context element isn't drawn on its own; put it among 2D elements, where it is kept without joining the display list.

## SVG

`graphics.svg()` parses an SVG string into shapes, with their fills and strokes:

```tsx
<graphics2D draw={(graphics) => graphics.svg(icon)} scale={2} />
```

For an SVG drawn many times, parse it once into a `GraphicsContext` (`new GraphicsContext().svg(icon)`) and share that.

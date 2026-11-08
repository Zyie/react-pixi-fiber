# Animating 2D

2D animates the way [3D does in r3f](../../__docs__/basic-animations.md): `useFrame` runs a callback before every frame, with the root's state and the frame's `delta`, and the callback changes objects through their refs. Changing them there, instead of through React state, re-renders nothing.

## Through a ref

<!-- snippet: examples/2d/animation.example.tsx#ref -->

```tsx
function Bobbing() {
  const sprite = useRef<Sprite>(null);

  useFrame((state) => {
    sprite.current!.y = 150 + Math.sin(state.elapsed * 4) * 60;
    sprite.current!.rotation += 0.05;
  });

  return <sprite2D ref={sprite} texture={Texture.WHITE} tint="hotpink" width={60} height={60} anchor={0.5} x={120} />;
}
```

## Redrawing a graphics

A shape that changes every frame is redrawn the same way: clear the graphics through its ref and draw it again in `useFrame`. The `draw` prop is for drawings that follow props and state; setting state every frame would re-render the component each time for nothing, as [r3f's pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls#avoid-setstate-in-loops) warn:

<!-- snippet: examples/2d/animation.example.tsx#draw -->

```tsx
function Pulse() {
  const graphics = useRef<Graphics>(null);

  useFrame((state) => {
    const radius = 40 + Math.sin(state.elapsed * 3) * 20;
    graphics.current!.clear().circle(0, 0, radius).fill('royalblue');
  });

  return <graphics2D ref={graphics} x={280} y={150} />;
}
```

![A pink square bobbing and turning, and a blue circle growing and shrinking](../../../tests/snapshots/docs/2d/animation.webgl.png)

pixi's `Ticker` isn't what draws: the root's frameloop is, so `frameloop="demand"` and `invalidate()` work for 2D as for 3D. Animated sprites play on the same clock: `<animatedSprite2D playing animationSpeed={0.2} />` advances with the root's frames, and a playing sprite keeps a `demand` canvas drawing ([Sprites and spritesheets](sprites-2d.md#animated-sprites)).

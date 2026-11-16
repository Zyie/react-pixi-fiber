# Particles

A `<particleContainer2D>` draws thousands of textured quads in one batch, far faster than as many sprites. What it draws are particles, which are lighter than sprites: no children, no events, no filters, and no transform of their own beyond position, scale, rotation and anchor.

## Particle elements

A particle is not a container, so it isn't a child in pixi's scene graph; React still puts it in the tree as a child, with `<particle2D>` inside a `<particleContainer2D>`. Its props are the particle's: `texture`, `x`, `y`, `scaleX`, `scaleY`, `anchorX`, `anchorY`, `rotation`, `tint` and `alpha`. Keyed particles are added, removed and reordered as React's list changes.

<!-- snippet: examples/2d/particles.example.tsx#galaxy -->

```tsx
function Galaxy() {
  const container = useRef<ParticleContainer>(null);

  useFrame((state) => {
    const particles = container.current!.particleChildren;
    for (let i = 0; i < particles.length; i++) {
      const star = STARS[i];
      const angle = star.angle + state.elapsed * (40 / star.distance);
      particles[i].x = Math.cos(angle) * star.distance;
      particles[i].y = Math.sin(angle) * star.distance * 0.6;
    }
  });

  return (
    <particleContainer2D ref={container} x={200} y={150}>
      {STARS.map((star, i) => (
        <particle2D
          key={i}
          texture={Texture.WHITE}
          scaleX={star.size}
          scaleY={star.size}
          anchorX={0.5}
          anchorY={0.5}
          tint={star.tint}
        />
      ))}
    </particleContainer2D>
  );
}
```

![A spiral galaxy of small coloured squares](../../../tests/snapshots/docs/2d/particles.webgl.png)

To move many particles, change them in `useFrame` through the container's `particleChildren`, as above, rather than through React state: rendering hundreds of elements every frame is what the container exists to avoid.

## Dynamic properties

A particle container uploads only its particles' positions every frame. The other properties, `vertex` (scale and anchor), `rotation`, `uvs` (the texture's frame) and `color` (tint and alpha), are uploaded when particles are added or removed, or when you call `update()`. When React or `useFrame` changes one of them, make it dynamic, in the container's options:

```tsx
const OPTIONS = { dynamicProperties: { color: true, rotation: true } };

<particleContainer2D args={[OPTIONS]}>
  {stars.map((star) => (
    <particle2D key={star.id} texture={texture} x={star.x} y={star.y} tint={star.tint} />
  ))}
</particleContainer2D>;
```

Each dynamic property costs an upload every frame, so make dynamic only what changes.

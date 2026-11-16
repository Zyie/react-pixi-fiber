# 2D objects, properties and arguments

2D elements follow react-three-fiber's rules for [objects, properties and arguments](../../../threejs-compat/src/__docs__/objects.md): the element makes the object, `args` are its constructor's arguments, props set its fields, dashes pierce into nested objects, and `attach` puts a child somewhere on its parent other than among its children.

## Arguments

`args` is the list of arguments the class's constructor takes, any of its forms. pixi.js's constructors take an options object:

<!-- snippet: examples/2d/args-and-props.example.tsx#args -->

```tsx
<text2D args={[{ text: 'From args', style: { fill: 'white', fontSize: 32 } }]} x={20} y={20} />
```

The object is built again when an item of `args` changes, as in r3f, so use them for what a class needs at construction, such as a mesh's geometry or an animated sprite's frames, and props for the rest. An options object written inline is a new object on every render, which builds the object again each time its component renders: keep it outside the component, or in `useMemo` ([2D performance](performance-2d.md#keep-args-and-options-stable)).

## Properties

A prop sets the field of the same name: `x`, `y`, `alpha`, `tint`, `rotation`, `angle`, `zIndex`, `visible`, `blendMode`, `eventMode`, `cursor`, `hitArea`, `mask`, `texture`, `text`, `style`. A point takes r3f's forms: one number for both axes (`anchor={0.5}`, `scale={2}`), an array (`position={[10, 20]}`), or a point. A colour, such as `tint`, a fill or a text style's `fill`, takes anything pixi's `Color` takes, and a three `Color` from `@react-fiber/threejs-compat/three` too, as a material's `color` does.

A few of pixi's methods are props as well, so they can be declared: `cacheAsTexture` caches a container as a texture ([2D performance](performance-2d.md#cache-what-doesnt-change)), `renderLayer` draws it in a render layer (below), `mask` takes pixi's mask options as `setMask` does ([Masks](filters-and-masks-2d.md#masks)), and an animated sprite's `playing` plays or stops it. For other methods, r3f's `once()` calls a method when the element mounts: `<colorMatrixFilter2D sepia={once()} />`.

<!-- snippet: examples/2d/args-and-props.example.tsx#props -->

```tsx
<text2D text="From props" style={{ fill: 'white', fontSize: 32 }} anchor={[1, 0]} position={[380, 80]} />
```

## Piercing

A dash sets a field of a field: `scale-x`, `pivot-y`, `style-fill`, `style-fontSize`.

<!-- snippet: examples/2d/args-and-props.example.tsx#pierce -->

```tsx
<text2D text="Pierced" style={{ fontSize: 32 }} style-fill="hotpink" scale-x={1.5} x={20} y={140} angle={-8} />
```

![Text from args, text from props anchored at its right edge, and pink text whose fill is pierced](../../../../tests/snapshots/docs/2d/args-and-props.webgl.png)

## Children

2D children of a 2D element are its pixi children, in React's order. Keyed children move when their keys do, and `zIndex` sorts children in a container with `sortableChildren`. pixi.js 8 lets only containers hold children, so nest under `<container2D>`.

## Attach

A filter, a mask or a graphics context is no child: it attaches to a field of its parent. `attach="filters-0"` puts a filter first in the parent's `filters`, `filters-1` second, and unmounting one takes it out again. `attach="mask"` makes a 2D element the parent's mask, drawn in the parent's own space.

<!-- snippet: examples/2d/attach.example.tsx#filters -->

```tsx
<sprite2D texture={texture} x={30} y={60} width={160} height={160}>
  <blurFilter2D attach="filters-0" strength={4} />
  <alphaFilter2D attach="filters-1" alpha={0.6} />
</sprite2D>
```

<!-- snippet: examples/2d/attach.example.tsx#mask -->

```tsx
<container2D x={210} y={60}>
  <sprite2D texture={texture} width={160} height={160} />
  <graphics2D attach="mask" draw={(graphics) => graphics.circle(80, 80, 70).fill('white')} />
</container2D>
```

![A blurred and faded picture with two filters, and the same picture masked to a circle](../../../../tests/snapshots/docs/2d/attach.webgl.png)

`<graphicsContext2D attach="context" draw={...} />` gives a graphics a context of its own. To share one context between several graphics, pass it as their `context` ([Graphics](graphics-2d.md#sharing-a-context)). [Filters, masks and blend modes](filters-and-masks-2d.md) has more on both.

## Render layers

A `<renderLayer2D>` draws the elements attached to it where the layer is in the tree, not where they are, so a tooltip deep in a list can draw over everything after it. `renderLayer` attaches an element, and `null` detaches it. The layer usually comes after what it lifts, so keep its ref in state, which renders the elements again once it is set:

```tsx
const [layer, setLayer] = useState<RenderLayer | null>(null);

<>
  <container2D>
    <sprite2D texture={card} renderLayer={layer} />
    <sprite2D texture={card} x={30} />
  </container2D>
  <renderLayer2D ref={setLayer} />
</>;
```

## Your own classes

A class of your own, extending one of pixi.js's, becomes an element with r3f's `extend`, under a name ending in `2D`: `extend({ Button2D: Button })` makes `<button2D>`. [Your own 2D classes](extend-2d.md) shows it, with its types and a filter of your own.

## Disposal

Unmounting an element destroys its object and its children's, with the filters and contexts attached to it, as r3f disposes three objects. A texture or a context passed in as a prop or in `args` is left alone, since something else may use it. `dispose={null}` keeps an element's object alive, and `<primitive object={sprite} />` puts an object you made in the tree without React owning it.

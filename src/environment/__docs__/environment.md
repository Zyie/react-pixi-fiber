# Environment

`<Environment>` lights a scene from its surroundings and can draw them behind it: image-based lighting, the way PBR materials pick up reflections and soft light from a whole sky. react-pixi-fiber has r3f v10's `<Environment>` with the same props, on pixi-3d's image-based lighting.

## From a file

Pass a Radiance `.hdr`, or an image holding an equirectangular map:

<!-- snippet: examples/environment/files.example.tsx#environment -->

```tsx
<Environment files="/environment/equirect.hdr" background />
```

![Three white spheres, dielectric, rough metal and polished metal, lit by a sky drawn behind them](../../../tests/snapshots/docs/environment/files.webgl.png)

`background` draws the environment behind the scene as well; `background="only"` draws it without lighting with it. The component suspends while the file loads, so it sits under a `<Suspense>`.

The files `<Environment>` reads:

- **`.hdr`**: linear radiance, decoded on the CPU into half floats, as three's `HDRLoader` does. `HDRLoader` and its older name `RGBELoader` come from `react-pixi-fiber/addons`.
- **`.png`, `.jpg`, `.webp`, `.avif`, `.gif`**: an equirectangular image in sRGB. A `.jpg` loads as a plain image; its Ultra HDR gain map, if it has one, is ignored.
- **Six images**: a cube, in three's order +X, -X, +Y, -Y, +Z, -Z, through `CubeTextureLoader` from `react-pixi-fiber/three`.
- **`.exr`** isn't supported.

## From six images

<!-- snippet: examples/environment/cube-faces.example.tsx#environment -->

```tsx
<Environment files={faces} path="/environment/cube/" background backgroundBlurriness={0.15} />
```

![A metal box lit by a cube map, the sky softly blurred behind it](../../../tests/snapshots/docs/environment/cube-faces.webgl.png)

`path` goes in front of every file. The faces are mirrored as three mirrors images of a cube, so the same six files face the same way in both.

## From a scene

Give `<Environment>` children and it films them with a cube camera into a cube target, which becomes the environment:

<!-- snippet: examples/environment/children.example.tsx#environment -->

```tsx
<Environment resolution={128} background>
  <Room />
</Environment>
```

![A metal ball and a matte one lit by a room of coloured walls](../../../tests/snapshots/docs/environment/children.webgl.png)

`resolution` sets the width of each face, `near` and `far` the cube camera's clipping, and `frames` how many frames it films: 1, the default, films once. With `frames={Infinity}` the environment follows the children, but pixi-3d prefilters the lighting again on every frame, so keep the resolution low.

## Turning, dimming and blurring

<!-- snippet: examples/environment/rotation.example.tsx#environment -->

```tsx
<Environment
  files="/environment/equirect.png"
  background
  backgroundRotation={[0, Math.PI / 2, 0]}
  environmentRotation={[0, Math.PI / 2, 0]}
  backgroundIntensity={0.7}
  environmentIntensity={0.8}
/>
```

![A mirror ball reflecting the same turned sky the background shows](../../../tests/snapshots/docs/environment/rotation.webgl.png)

| Prop                   | What it does                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `environmentIntensity` | Scales the light the environment gives                                             |
| `environmentRotation`  | Turns the environment round the scene, as Euler angles                             |
| `backgroundIntensity`  | Scales the background                                                              |
| `backgroundRotation`   | Turns the background round the scene                                               |
| `backgroundBlurriness` | Blurs the background, 0 to 1, as three's PMREM blurs it (`blur` is its older name) |

Each is also a field of the scene, `scene.environmentIntensity` and so on, as in three.

## Presets

`preset` names one of r3f's ten environments, `apartment`, `city`, `dawn`, `forest`, `lobby`, `night`, `park`, `studio`, `sunset` and `warehouse`, which load `.hdr` files from pmndrs' asset host:

```tsx
<Environment preset="sunset" background />
```

They need the network, so they aren't meant for production; download the file and pass it as `files` instead. `presetsObj` lists the file of each.

## `useEnvironment`

The hook loads an environment map and hands you the texture, for code that sets the scene up itself:

<!-- snippet: examples/environment/use-environment.example.tsx#hook -->

```tsx
/** Lights a scene with a texture and draws it behind, until the returned function puts the scene back */
function showSky(scene: Scene, texture: EnvironmentTexture): () => void {
  const { background, environment } = scene;
  scene.background = texture;
  scene.environment = texture;
  return () => {
    scene.background = background;
    scene.environment = environment;
  };
}

function Sky() {
  const texture = useEnvironment({ files: '/environment/equirect.png' });
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => showSky(scene, texture), [scene, texture]);

  return null;
}
```

`scene.environment` and `scene.background` take a pixi `CubeTexture` or a 2D `Texture` holding an equirectangular map, so a texture from `CubeTextureLoader`, `HDRLoader`, `TextureLoader` or a cube target's `texture` works too.

## What differs

- **Bright radiance clips.** pixi-3d prefilters an environment into a 10-bit unorm cube, so radiance above 1 clips: a sun far brighter than white leaves no highlight on smooth surfaces, and rough metal misses some of its light. `environmentIntensity` above 1 clips the same way.
- **Partial metal.** Metalness 0 and 1 match three under an environment, but metal in between comes out up to a fifth darker: three r187 mixes a dielectric and a metallic lobe by metalness, pixi-3d mixes F0 first.
- **`ground`** isn't supported yet; the environment is set without the projected ground.
- **`.exr`** files and six `.hdr` faces aren't supported.
- **Mirror reflections** of hard edges are a little sharper than three's.

# Lights and shadows

Lights, shadows, fog and the background are three's elements here, with three's arguments and fields, so a scene lit for react-three-fiber lights the same way. Each draws through pixi-3d, and the visual tests hold each to three's own picture.

## Lights

| Element              | Arguments                                                      | Notes                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ambientLight>`     | `color`, `intensity`                                           | Lights everything evenly.                                                                                                                                 |
| `<hemisphereLight>`  | `skyColor`, `groundColor`, `intensity`                         | Sky colour from above, ground colour from below. pixi-3d draws it as the view's environment.                                                              |
| `<directionalLight>` | `color`, `intensity`                                           | Shines from its position toward its `target`, the origin unless you change it. Casts shadows.                                                             |
| `<pointLight>`       | `color`, `intensity`, `distance`, `decay`                      | Shines every way from its position. Casts no shadows on pixi-3d.                                                                                          |
| `<spotLight>`        | `color`, `intensity`, `distance`, `angle`, `penumbra`, `decay` | A cone from its position toward its `target`. `angle` is the cone's half-angle in radians; `penumbra` the share of it the edge fades over. Casts shadows. |

Intensities are three's physical units: candela for point and spot lights, so a light a few units away needs an intensity in the tens. `power` gives a point or spot light's intensity in lumens. A light's `color` is a three `Color`, so `color="orange"`, `color-r={1}` and `light.color.setHSL(0.1, 1, 0.5)` all work.

<!-- snippet: examples/lights-and-shadows/hemisphere-light.example.tsx#scene -->

```tsx
function Scene() {
  return (
    <>
      <hemisphereLight args={['#bde0ff', '#4a3826', 2]} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} />
      <mesh>
        <sphereGeometry args={[1, 64, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </>
  );
}
```

### Aiming at a target

Directional and spot lights shine at their `target`, an `Object3D`. As in three, the default target is outside the scene, so setting `target-position` moves it but the light keeps aiming at the origin until the target is added to the scene or its `updateMatrixWorld()` is called. The simplest way to aim at something is to make it the target:

<!-- snippet: examples/lights-and-shadows/spot-light.example.tsx#spot -->

```tsx
import { useLayoutEffect, useRef } from 'react';
import type { Mesh, SpotLight } from 'react-pixi-fiber/three';

function Spot() {
  const light = useRef<SpotLight>(null!);
  const ball = useRef<Mesh>(null!);

  useLayoutEffect(() => {
    light.current.target = ball.current;
  }, []);

  return (
    <>
      <spotLight ref={light} position={[-2, 4, 2]} angle={0.4} penumbra={0.4} intensity={60} castShadow />
      <mesh ref={ball} position={[0.5, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.5, 48, 24]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </>
  );
}
```

## Shadows

Shadows take three steps, as in three: turn them on for the renderer, let a light cast them, and choose which meshes cast and receive them.

<!-- snippet: examples/lights-and-shadows/shadows.example.tsx#canvas -->

```tsx
import { Canvas } from 'react-pixi-fiber';

export function App() {
  return (
    <Canvas renderer={{ shadows: true }} camera={{ position: [4, 4, 6] }}>
      <Scene />
    </Canvas>
  );
}
```

<!-- snippet: examples/lights-and-shadows/shadows.example.tsx#scene -->

```tsx
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 6, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#f0ad4e" />
      </mesh>
      <mesh position={[-1.6, 0.5, 1]} castShadow>
        <sphereGeometry args={[0.5, 48, 24]} />
        <meshStandardMaterial color="#5d9de0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#d8d8d8" />
      </mesh>
    </>
  );
}
```

`renderer={{ shadows }}` takes r3f's values, mapped onto pixi-3d's shadow filters:

| `shadows`                        | three            | pixi-3d filter |
| -------------------------------- | ---------------- | -------------- |
| `true`, `'percentage'`, `'soft'` | `PCFShadowMap`   | `'pcf'`        |
| `'basic'`                        | `BasicShadowMap` | `'hard'`       |
| `'variance'`                     | `VSMShadowMap`   | `'pcf-high'`   |

A light's `shadow` is three's `LightShadow`, set through piercing:

- `shadow-camera-left`, `-right`, `-top`, `-bottom`, `-near` and `-far` set the box a directional light's shadow covers. Only what is inside it casts a shadow, as in three. pixi-3d widens it by 5% so a caster on its edge still lands inside.
- `shadow-mapSize` sets the shadow's resolution. pixi-3d keeps one resolution per view, from 512 to 4096, and takes the largest any casting light asks for.
- `shadow-bias` and `shadow-normalBias` take three's values. Leave them at 0 and pixi-3d's own offsets keep surfaces from shadowing themselves.
- `shadow-radius`, `shadow-blurSamples` and `shadow-intensity` are kept and change nothing: the renderer's `shadows` setting picks the softness, and shadows are always at full strength.

A spot light's shadow covers its whole cone, from 1 unit in front of the light to its `distance`, so `shadow-camera-fov`, `-near` and `-far` change nothing for it. pixi-3d's own shadow options are on the same object: `shadow-cascades={3}` gives a directional light cascaded shadow maps that follow the camera, and `shadow-update` how often each is redrawn.

## Fog and the background

`<fog>` and `<fogExp2>` attach to the scene's `fog`. Linear fog thickens from none at `near` to full at `far`; exponential fog closes in with the square of the distance. Give the background the fog's colour and distant objects disappear into it. Changing the fog while the scene runs is a property write:

<!-- snippet: examples/lights-and-shadows/fog.example.tsx#fog -->

```tsx
import { useRef } from 'react';
import { useFrame } from 'react-pixi-fiber';
import type { Fog } from 'react-pixi-fiber/three';

function Haze() {
  const fog = useRef<Fog>(null!);

  useFrame(({ elapsed }) => {
    fog.current.far = 12 + Math.sin(elapsed) * 6;
  });

  return (
    <>
      <color attach="background" args={['#202030']} />
      <fog ref={fog} attach="fog" args={['#202030', 2, 12]} />
    </>
  );
}
```

The fog is mixed in after the tone curve, as three mixes it, so a fully fogged surface shows the fog colour itself. A material whose `toneMapped` is off takes no fog on pixi-3d.

`scene.background` takes what three's does where pixi-3d can draw it:

- A colour: `<color attach="background" args={['#202030']} />`, a three `Color` or any colour string or number. The canvas clears to it, untouched by tone mapping.
- A texture, stretched over the canvas as three draws it. `backgroundIntensity` dims it, from 0 to 1.
- A pixi-3d `CubeTexture` or `Hemisphere`, which pixi-3d draws around the scene. pixi-3d tone-maps a cube background where three leaves an sRGB one as it is, and has no blur or rotation for it, so `backgroundBlurriness` and `backgroundRotation` are kept and change nothing.

## What pixi-3d can't do yet

- **`decay`.** pixi-3d's point and spot lights always fall off with the square of the distance, three's default of 2. `decay={0}` changes nothing.
- **Point light shadows.** pixi-3d's point lights cast none.
- **`RectAreaLight` and `LightProbe`.** pixi-3d has no area lights and no spherical-harmonics probes, so the catalog has neither.
- **A hemisphere light and an environment map together.** pixi-3d has one environment per view, so a scene with an `environment` lights by that and ignores hemisphere lights, and only the first visible hemisphere light lights.
- **A spot light's `map`.** pixi-3d's spots project no texture.

The [Differences](differences.md) page lists every gap, with what it costs a scene's picture.

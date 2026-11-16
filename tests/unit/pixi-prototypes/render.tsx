import { act, createRoot, events } from '@react-fiber/threejs-compat';
import { AlphaFilter, Texture } from 'pixi.js';
import type { Graphics, RenderLayer } from 'pixi.js';
import { useMemo, useState } from 'react';
import '@react-fiber/2d';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

const FRAMES = [Texture.WHITE, Texture.EMPTY];
let clicks = 0;

/**
 * Every 2D prop and attach that core doesn't write by assignment, on or off, and 2D in 3D
 * @param props - The props
 * @param props.on - Whether each feature is on
 */
function Every2DFeature({ on }: { on: boolean }) {
  const [layer, setLayer] = useState<RenderLayer | null>(null);
  const [shape, setShape] = useState<Graphics | null>(null);
  const fade = useMemo(() => new AlphaFilter({ alpha: 0.5 }), []);

  return (
    <>
      <container2D x={10} y={10} cacheAsTexture={on} filters={on ? fade : null}>
        <sprite2D
          texture={Texture.WHITE}
          width={40}
          height={40}
          tint="hotpink"
          parentRenderLayer={on ? layer : null}
          onClick={() => clicks++}
        >
          {on && <blurFilter2D attach="filters-0" strength={2} />}
          <alphaFilter2D attach="filters-1" alpha={0.5} />
        </sprite2D>
        <container2D x={50} mask={{ inverse: on }}>
          <sprite2D texture={Texture.WHITE} width={40} height={40} />
          {on && <graphics2D attach="mask" draw={(graphics) => graphics.circle(20, 20, 15).fill('white')} />}
        </container2D>
        <sprite2D texture={Texture.WHITE} width={40} height={40} x={100} mask={shape} />
        <graphics2D ref={setShape} x={100} draw={(graphics) => graphics.rect(0, 0, on ? 20 : 30, 20).fill('white')} />
        <graphics2D y={50}>
          <graphicsContext2D attach="context" draw={(context) => context.rect(0, 0, 8, 8).fill('white')} />
        </graphics2D>
        <animatedSprite2D args={[FRAMES]} playing={on} x={50} y={50} />
        <text2D text="Aa" x={100} y={50} style={{ fill: 'white', fontSize: 16 }} />
        <particleContainer2D y={100}>
          <particle2D args={[{ texture: Texture.WHITE }]} />
        </particleContainer2D>
      </container2D>
      <renderLayer2D ref={setLayer} />
      <mesh>
        <boxGeometry />
        <meshBasicMaterial />
        <sprite2D texture={Texture.WHITE} width={8} height={8} />
      </mesh>
    </>
  );
}

/**
 * Dispatches a click on the canvas as Chrome sends one, at a point of the frame's page
 * @param canvas - The canvas
 * @param x - The point's x
 * @param y - The point's y
 */
function click(canvas: HTMLCanvasElement, x: number, y: number): void {
  const init = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true };
  canvas.dispatchEvent(new PointerEvent('pointermove', init));
  canvas.dispatchEvent(new PointerEvent('pointerdown', { ...init, button: 0, buttons: 1 }));
  canvas.dispatchEvent(new PointerEvent('pointerup', { ...init, button: 0, buttons: 0 }));
  canvas.dispatchEvent(new PointerEvent('click', { ...init, button: 0, buttons: 0 }));
}

/**
 * Renders every 2D feature, draws it, clicks the sprite with a handler, turns every feature off, draws
 * again and unmounts, which frees every object
 * @returns How many clicks the sprite got
 * @internal
 */
export async function renderEvery2DFeature(): Promise<number> {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const canvas = document.body.appendChild(document.createElement('canvas'));
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:150px';
  const root = createRoot(canvas);
  await root.configure({ frameloop: 'never', size: { width: 200, height: 150, top: 0, left: 0 }, dpr: 1, events });
  const store = await act(async () => root.render(<Every2DFeature on />));
  await act(async () => store.getState().advance(16));
  await act(async () => click(canvas, 30, 30));
  await act(async () => root.render(<Every2DFeature on={false} />));
  await act(async () => store.getState().advance(32));
  await act(async () => root.unmount());
  canvas.remove();
  return clicks;
}

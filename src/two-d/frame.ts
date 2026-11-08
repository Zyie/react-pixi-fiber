import { getScheduler } from '@pmndrs/scheduler';
import { Application, Culler, CullerPlugin, Rectangle } from 'pixi.js';
import type { Ticker, AnimatedSprite } from 'pixi.js';

import type { RootStore } from '../types/state';
import type { Linked } from './screen';

/** The 2D work a root does each frame, and how to stop it */
interface RootFrame2D {
  /** The animated sprites of the root's elements, which advance on its clock */
  readonly sprites: Set<AnimatedSprite>;
  /** Unregisters the root's jobs */
  readonly release: () => void;
}

const frames = new WeakMap<RootStore, RootFrame2D>();
const cullView = new Rectangle();
const clock = { deltaTime: 0, deltaMS: 0 };
let anyPlaying = false;

/**
 * Advances an animated sprite by the frame on `clock`, and forgets it once it is destroyed
 * @param sprite - The sprite
 * @param _again - The sprite again, as `Set.forEach` passes it
 * @param sprites - The set it is in
 */
function advance(sprite: AnimatedSprite, _again: AnimatedSprite, sprites: Set<AnimatedSprite>): void {
  if (sprite.destroyed) {
    sprites.delete(sprite);
    return;
  }
  if (!sprite.playing) return;
  sprite.update(clock as Ticker);
  anyPlaying ||= sprite.playing;
}

/**
 * The root store a portal's store belongs to
 * @param store - A root's or a portal's store
 */
function initialRoot(store: RootStore): RootStore {
  let root = store;
  for (let previous = root.getState().previousRoot; previous; previous = previous.getState().previousRoot) {
    root = previous;
  }
  return root;
}

/**
 * Registers a root's 2D frame jobs with the scheduler: its animated sprites advance in the `update`
 * phase, before the app's own `useFrame` jobs, and, once pixi's `CullerPlugin` is registered with
 * `extensions.add`, its screen layer is culled against the canvas just before it renders, as a pixi
 * `Application` with that plugin culls its stage.
 * @param store - The root
 * @internal
 */
export function setupFrame2D(store: RootStore): void {
  if (frames.has(store)) return;
  const { rootId } = store.getState().internal;
  if (!rootId) return;
  const scheduler = getScheduler();
  const sprites = new Set<AnimatedSprite>();

  const unregisterSprites = scheduler.register(
    (_state, delta) => {
      if (sprites.size === 0) return;
      clock.deltaTime = delta * 60;
      clock.deltaMS = delta * 1000;
      anyPlaying = false;
      sprites.forEach(advance);
      if (anyPlaying) store.getState().invalidate();
    },
    { id: `${rootId}_animatedSprites2D`, rootId, phase: 'update', priority: 1000, system: true },
  );
  const unregisterCulling = scheduler.register(
    () => {
      if (!Application._plugins.includes(CullerPlugin)) return;
      const { screen, size } = store.getState();
      cullView.width = size.width;
      cullView.height = size.height;
      Culler.shared.cull(screen, cullView, false);
    },
    { id: `${rootId}_cull2D`, rootId, before: 'render', system: true },
  );

  frames.set(store, {
    sprites,
    release: () => {
      unregisterSprites();
      unregisterCulling();
      sprites.clear();
    },
  });
}

/**
 * Stops a root's 2D frame jobs
 * @param store - The root
 * @internal
 */
export function releaseFrame2D(store: RootStore): void {
  frames.get(store)?.release();
  frames.delete(store);
}

/**
 * Moves an element's animated sprite from pixi's shared ticker onto its root's clock, so `play()`,
 * `animationSpeed`, `loop` and `onComplete` follow the root's frameloop: `frameloop="demand"`,
 * `advance()` and a test's fixed clock. An element with `autoUpdate` set to `true` stays on the shared
 * ticker.
 * @param sprite - A sprite an element made
 * @internal
 */
export function driveOnRootClock(sprite: Linked<AnimatedSprite>): void {
  const instance = sprite.__r3f;
  if (!instance || instance.props.autoUpdate === true) return;
  const frame = frames.get(initialRoot(instance.root));
  if (!frame || frame.sprites.has(sprite)) return;
  sprite.autoUpdate = false;
  frame.sprites.add(sprite);
}

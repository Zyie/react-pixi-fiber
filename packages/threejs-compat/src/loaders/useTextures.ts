/*!
 * Adapted from react-three-fiber's packages/fiber/src/core/hooks/useTextures.tsx
 * MIT License, Copyright (c) 2019-2025 Poimandres
 */
import { warn } from 'pixi.js';
import type { Texture as PixiTexture } from 'pixi.js';
import { useMemo } from 'react';

import { useStore, useThree } from '../r3f/src/core/hooks/useStore';
import type { RootState, RootStore } from '../types/state';

/**
 * A registry read: one key, a list of keys, or a record of names to keys
 * @category hooks
 * @advanced
 */
export type TextureInput = string | string[] | Record<string, string>;

/**
 * What a registry read returns, in the shape of its input
 * @category hooks
 * @advanced
 */
export type TextureResult<Input extends TextureInput> = Input extends string
  ? PixiTexture | undefined
  : Input extends string[]
    ? (PixiTexture | undefined)[]
    : { [K in keyof Input]: PixiTexture | undefined };

/**
 * The options of {@link UseTexturesReturn.dispose}
 * @category hooks
 * @advanced
 */
export interface DisposeOptions {
  /** Free the texture even while a mounted `useTexture` holds it @default false */
  force?: boolean;
}

/**
 * The texture registry {@link useTextures} returns
 * @category hooks
 * @advanced
 */
export interface UseTexturesReturn {
  /** Every registered texture, by key; read it, don't change it */
  readonly all: Map<string, PixiTexture>;
  /**
   * Reads one texture, a list, or a record of them, in the shape asked for
   * @param input - The keys
   */
  get<Input extends TextureInput>(input: Input): TextureResult<Input>;
  /**
   * Whether a key is registered
   * @param key - The key
   */
  has(key: string): boolean;
  /**
   * Registers a texture with no URL, such as a render target's or one you drew
   * @param key - Its key
   * @param texture - The texture
   */
  add(key: string, texture: PixiTexture): void;
  /**
   * Registers a record of textures
   * @param record - Textures by key
   */
  add(record: Record<string, PixiTexture>): void;
  /**
   * Frees a texture and removes it from the registry, unless a mounted `useTexture` still holds it
   * @param key - Its key
   * @param options - `force` to free it anyway
   * @returns Whether it was freed
   */
  dispose(key: string, options?: DisposeOptions): boolean;
  /** Frees every texture and empties the registry */
  disposeAll(): void;
}

/**
 * Frees a registered texture: a three `Texture` through its `dispose`, which frees the GPU copy and
 * keeps it usable as three's does, and any other pixi texture through pixi's `destroy`
 */
function release(texture: PixiTexture | undefined): void {
  if (!texture || texture.destroyed) return;

  const disposable = texture as PixiTexture & { dispose?: () => void };

  if (typeof disposable.dispose === 'function') disposable.dispose();
  else texture.destroy(true);
}

/**
 * The registry of a root's textures: `useTexture` adds what it loads, and any component reads them
 * back by URL, adds textures of its own and frees them
 *
 * r3f v10's hook, with the same registry and reference counts. Freeing a texture calls the three
 * `Texture`'s `dispose`, which frees its GPU copy and leaves it usable, as in three; a plain pixi
 * texture someone added is destroyed with pixi's `destroy`. The component re-renders when the
 * registry changes, or, with a selector, when what the selector returns changes.
 * @example
 * ```tsx
 * useTexture({ map: '/color.png', normalMap: '/normal.png' });
 *
 * const { map, normalMap } = useTextures().get({ map: '/color.png', normalMap: '/normal.png' });
 * return <meshStandardMaterial map={map} normalMap={normalMap} />;
 * ```
 * @category hooks
 * @standard
 */
export function useTextures(): UseTexturesReturn;
/**
 * The registry, through a selector; the component re-renders when what it returns changes
 * @param selector - Reads what the component needs from the registry
 */
export function useTextures<T>(selector: (registry: UseTexturesReturn) => T): T;
export function useTextures<T>(selector?: (registry: UseTexturesReturn) => T): UseTexturesReturn | T {
  const store = useStore() as unknown as RootStore;

  const registry = useMemo<UseTexturesReturn>(() => {
    const { getState, setState } = store;
    const getOne = (key: string): PixiTexture | undefined => getState().textures.get(key);

    return {
      get all() {
        return getState().textures;
      },

      get<Input extends TextureInput>(input: Input): TextureResult<Input> {
        if (typeof input === 'string') return getOne(input) as TextureResult<Input>;
        if (Array.isArray(input)) return input.map(getOne) as TextureResult<Input>;

        const out: Record<string, PixiTexture | undefined> = {};

        for (const [name, key] of Object.entries(input as Record<string, string>)) out[name] = getOne(key);

        return out as TextureResult<Input>;
      },

      has: (key: string) => getState().textures.has(key),

      add(keyOrRecord: string | Record<string, PixiTexture>, texture?: PixiTexture) {
        setState((state) => {
          const textures = new Map(state.textures);

          if (typeof keyOrRecord === 'string') textures.set(keyOrRecord, texture!);
          else for (const key in keyOrRecord) textures.set(key, keyOrRecord[key]);

          return { textures };
        });
      },

      dispose(key: string, options?: DisposeOptions): boolean {
        const state = getState();
        const refs = state._textureRefs.get(key) ?? 0;

        if (refs > 0 && !options?.force) {
          warn(
            `[useTextures] "${key}" still has ${refs} active reference(s); skipping dispose. ` +
              `Pass { force: true } to override.`,
          );

          return false;
        }

        release(state.textures.get(key));
        setState((s) => {
          const textures = new Map(s.textures);
          const nextRefs = new Map(s._textureRefs);

          textures.delete(key);
          nextRefs.delete(key);

          return { textures, _textureRefs: nextRefs };
        });

        return true;
      },

      disposeAll() {
        for (const texture of getState().textures.values()) release(texture);
        setState({ textures: new Map(), _textureRefs: new Map() });
      },
    };
  }, [store]);

  const subscribe = selector ? () => selector(registry) : (state: RootState) => state.textures;
  const selected = (useThree as unknown as (select: (state: RootState) => unknown) => unknown)(subscribe);

  return selector ? (selected as T) : registry;
}

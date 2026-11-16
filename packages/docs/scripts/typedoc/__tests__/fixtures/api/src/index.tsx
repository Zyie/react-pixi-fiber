import type { ReactNode } from 'react';

import type { Advance } from '#types';

import type * as Types from './types/namespace';

export * from './r3f/core';
export type * from '#types';
export { Scene } from '@pixi/3d';

/**
 * The canvas a scene draws on
 * @param props - Its children
 */
export function Canvas(props: { children?: ReactNode }): ReactNode {
  return props.children;
}

export const undocumentedValue = 1;

export const _internal = 2;

/** The type of {@link useClock} */
export type UseClock = (scale?: number) => number;

/** Reads the clock */
export const useClock: UseClock = () => 0;

/** Steps a root */
export const advance: Advance = () => {};

export type { Types };

import type { ReactNode } from 'react';

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

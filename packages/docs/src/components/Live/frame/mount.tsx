import '@react-fiber/2d';
import { Canvas } from '@react-fiber/threejs-compat';
/**
 * Mounts an example in the live frame, as the visual tests mount it: the example's `render()` inside a
 * `<Canvas>` that fills the frame, or, when `render()` returns a `<Canvas>` of its own, that one. Either
 * way the canvas asks pixi for the renderer the page chose, through the `renderer` prop, which r3f v10
 * hands to a renderer that isn't three's WebGL one (`gl` is for that one alone). The harness that draws
 * the reference pictures and this must agree on what an example is; `docs/README.md` says where.
 */
import { cloneElement, createElement, isValidElement } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import type { Renderer } from '../types';

/** What an example module exports, as far as the frame reads it */
interface ExampleModule {
  readonly example?: {
    readonly render?: () => ReactNode;
    readonly camera?: unknown;
    readonly canvas?: Readonly<{ renderer?: unknown } & Record<string, unknown>>;
  };
  readonly default?: ComponentType;
}

/**
 * Renders an example module into an element
 * @param module - The example, imported
 * @param container - The element its canvas fills
 * @param renderer - The renderer the page chose
 * @throws When the module exports no example
 */
export function mount(module: ExampleModule, container: HTMLElement, renderer: Renderer): void {
  const options = { preference: renderer };
  let content: ReactNode;

  if (typeof module.example?.render === 'function') content = module.example.render();
  else if (typeof module.default === 'function') content = createElement(module.default);
  else throw new TypeError('An example exports `example`, whose `render()` returns its scene.');

  if (isValidElement(content) && content.type === Canvas) {
    const element = content as ReactElement<{ renderer?: object }>;

    content = cloneElement(element, { renderer: { ...options, ...element.props.renderer } });
  } else {
    const { camera, canvas = {} } = module.example ?? {};
    const settings = typeof canvas.renderer === 'object' ? canvas.renderer : {};

    content = createElement(Canvas, { camera, ...canvas, renderer: { ...settings, ...options } }, content);
  }

  createRoot(container).render(content);
}

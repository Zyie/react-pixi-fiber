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
import * as fiber from 'react-pixi-fiber';

import type { Renderer } from '../types';

/** What an example module exports, as far as the frame reads it */
interface ExampleModule {
  readonly example?: { readonly render?: () => ReactNode; readonly canvas?: Readonly<Record<string, unknown>> };
  readonly default?: ComponentType;
}

/** The `<Canvas>` of the entry, when it exports one; read off the namespace, so the build passes without it */
const { Canvas } = fiber;

/**
 * Renders an example module into an element
 * @param module - The example, imported
 * @param container - The element its canvas fills
 * @param renderer - The renderer the page chose
 * @throws When the module exports no example, or the entry has no `Canvas` to draw it in
 */
export function mount(module: ExampleModule, container: HTMLElement, renderer: Renderer): void {
  const options = { preference: renderer };
  let content: ReactNode;

  if (typeof module.example?.render === 'function') content = module.example.render();
  else if (typeof module.default === 'function') content = createElement(module.default);
  else throw new TypeError('An example exports `example`, whose `render()` returns its scene.');

  if (isValidElement(content) && Canvas && content.type === Canvas) {
    const element = content as ReactElement<{ renderer?: object }>;

    content = cloneElement(element, { renderer: { ...options, ...element.props.renderer } });
  } else {
    if (!Canvas)
      throw new TypeError("react-pixi-fiber doesn't export Canvas yet, so the frame has nothing to draw in.");
    content = createElement(Canvas, { renderer: options, ...module.example?.canvas }, content);
  }

  createRoot(container).render(content);
}

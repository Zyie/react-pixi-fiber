import clsx from 'clsx';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { useHasWebGPU } from './preference';
import { RENDERER_LABELS } from './types';
import type { Renderer } from './types';

/**
 * The choice between WebGL and WebGPU, wherever the site runs Pixi: a segmented control (custom.css)
 * of two radio buttons. WebGPU can't be chosen in a browser that doesn't have it.
 * @param props - The renderer in use, what takes the reader's choice, and a class for the control
 */
export default function RendererSwitch(props: {
  value: Renderer;
  onChange: (renderer: Renderer) => void;
  className?: string;
}): ReactNode {
  const { value, onChange, className } = props;
  const name = useId();
  const webgpu = useHasWebGPU();

  return (
    <fieldset className={clsx('segmented', className)}>
      <legend className="sr-only">Renderer</legend>
      {(Object.keys(RENDERER_LABELS) as Renderer[]).map((renderer) => {
        const unavailable = renderer === 'webgpu' && !webgpu;

        return (
          <label key={renderer} title={unavailable ? "This browser doesn't have WebGPU" : undefined}>
            <input
              type="radio"
              name={name}
              value={renderer}
              checked={value === renderer}
              disabled={unavailable}
              onChange={() => onChange(renderer)}
            />
            <span>{RENDERER_LABELS[renderer]}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

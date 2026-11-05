import { useCallback, useState } from 'react';

import type { RendererType } from '../../tests/harness/scene-runner';
import type { EntryKind } from './scenes';

/** What the playground shows, kept in the URL so a view can be linked */
export interface PlaygroundState {
  kind: EntryKind;
  id: string | null;
  view: 'side' | 'diff';
  /** The two renderers the diff view compares */
  a: RendererType;
  b: RendererType;
  search: string;
}

const DEFAULTS: PlaygroundState = { kind: 'scene', id: null, view: 'side', a: 'webgl', b: 'three', search: '' };

function read(): PlaygroundState {
  const params = new URLSearchParams(location.search);
  const state = { ...DEFAULTS };

  for (const key of Object.keys(DEFAULTS) as (keyof PlaygroundState)[]) {
    const value = params.get(key);

    if (value !== null) Object.assign(state, { [key]: value });
  }

  return state;
}

/** The playground's state and a function that changes part of it, both kept in the URL's query */
export function useUrlState(): [PlaygroundState, (patch: Partial<PlaygroundState>) => void] {
  const [state, setState] = useState(read);
  const update = useCallback((patch: Partial<PlaygroundState>) => {
    setState((previous) => {
      const next = { ...previous, ...patch };
      const params = new URLSearchParams();

      for (const [key, value] of Object.entries(next)) {
        if (value !== null && value !== DEFAULTS[key as keyof PlaygroundState]) params.set(key, String(value));
      }

      history.replaceState(null, '', params.size ? `?${params.toString()}` : location.pathname);

      return next;
    });
  }, []);

  return [state, update];
}

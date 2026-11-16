import type { RunEvent } from './runtime';
import type { RunError } from './types';

/** Where a run is */
export type RunStatus =
  | { readonly state: 'loading' }
  | { readonly state: 'running'; readonly renderer: string }
  /** The program has run and drawn nothing yet, such as one that only logs */
  | { readonly state: 'ran' }
  /** The program threw; the run stays so whatever it draws afterwards */
  | { readonly state: 'error'; readonly error: RunError };

/**
 * What a frame's report makes of its run's status. An error holds: a program that threw after it made
 * its app still draws a frame, and that frame doesn't make the run live.
 * @param settled - The status the run has reported so far, null while it loads
 * @param event - What its frame reports
 * @returns The run's status now, or null when the report doesn't change it
 */
export function statusAfter(
  settled: RunStatus | null,
  event: Exclude<RunEvent, { type: 'console' }>,
): RunStatus | null {
  if (event.type === 'error') return { state: 'error', error: event.error };
  if (settled?.state === 'error') return null;
  if (event.type === 'rendered') return { state: 'running', renderer: event.renderer };

  return settled ? null : { state: 'ran' };
}

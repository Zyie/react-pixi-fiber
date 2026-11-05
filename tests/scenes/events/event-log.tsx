import { useCallback, useState } from 'react';

/** One handler call: which object's handler ran, and which handler */
export interface LogEntry {
  who: string;
  what: string;
}

/** Colours of the handlers a log can hold, its bottom row */
export const WHAT_COLORS: Record<string, string> = {
  over: '#3cb44b',
  out: '#e6194b',
  enter: '#bfef45',
  leave: '#f58231',
  click: '#42d4f4',
  down: '#4363d8',
  up: '#911eb4',
  move: '#ffe119',
  missed: '#ffffff',
};

/**
 * A log of handler calls, in the order they ran
 * @returns The entries, and a function that adds one
 */
export function useEventLog(): [LogEntry[], (who: string, what: string) => void] {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const log = useCallback((who: string, what: string) => setEntries((previous) => [...previous, { who, what }]), []);

  return [entries, log];
}

/**
 * Draws a log as a row of columns, left to right in the order the handlers ran: the top cube is the
 * object whose handler ran, in that object's colour, and the bottom cube is the handler, in `WHAT_COLORS`
 */
export function EventLog({ entries, who, y = -1.7 }: { entries: LogEntry[]; who: Record<string, string>; y?: number }) {
  return (
    <>
      {entries.map((entry, index) => (
        <group key={index} position={[(index - 7.5) * 0.36, y, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.28, 0.28, 0.28]} />
            <meshBasicMaterial color={who[entry.who]} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[0.28, 0.28, 0.28]} />
            <meshBasicMaterial color={WHAT_COLORS[entry.what]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** A row of lamps, green for each check that holds and red for each that doesn't */
export function Checks({ checks, y = -1.7 }: { checks: boolean[]; y?: number }) {
  return (
    <>
      {checks.map((passed, index) => (
        <mesh key={index} position={[(index - (checks.length - 1) / 2) * 0.42, y, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={passed ? '#3cb44b' : '#e6194b'} />
        </mesh>
      ))}
    </>
  );
}

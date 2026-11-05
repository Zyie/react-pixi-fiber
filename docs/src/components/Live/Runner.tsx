import useBaseUrl from '@docusaurus/useBaseUrl';
import clsx from 'clsx';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { startRun } from './runtime';
import type { Run, RunEvent } from './runtime';
import { statusAfter } from './status';
import type { RunStatus } from './status';
import type { ConsoleEntry, Language, Renderer, RunError } from './types';

import styles from './Runner.module.css';

/** The props of `<Runner>` */
export interface RunnerProps {
  /** The program, TypeScript or TSX; a change runs it again in a new frame */
  code: string;
  language: Language;
  /** `code` compiled already, such as an example's `compiled`, which spares the page the compiler */
  compiled?: string;
  /** The text of each file the program imports by a relative path, such as `./theme.css?raw` */
  files?: Readonly<Record<string, string>>;
  /** The renderer to ask pixi for; a change runs the program again */
  renderer: Renderer;
  /** Changes run the same program again */
  runKey?: number;
  /** The frame's accessible name */
  title: string;
  /** The name the program goes by in an error's stack, `program.ts` by default */
  fileName?: string;
  /** Called as a run loads, draws and fails */
  onStatus?: (status: RunStatus) => void;
  /** Called with each console call of the program */
  onConsole?: (entry: ConsoleEntry) => void;
  /** Called as each run starts, before its first console call: the time to clear a console */
  onRun?: () => void;
  /** Whether the runner shows an error over its frame; true by default */
  showErrors?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Drawn over the frame, such as a picture until the first run draws */
  children?: ReactNode;
}

const LOADING: RunStatus = { state: 'loading' };

/** How long a run that drew nothing waits before it shows its frame anyway and reports `ran` */
const SHOW_AFTER = 400;

/**
 * A program running live in a sandboxed frame that fills the runner. The frame gets the program's
 * console and errors, and a new frame takes the old one's place only once it has drawn, so editing
 * doesn't flash. Out of sight, the program's tickers stop.
 * @param props - The program and what to do with what it reports
 */
export default function Runner(props: RunnerProps): ReactNode {
  const { code, language, compiled, files, renderer, runKey, title, fileName, showErrors = true } = props;
  const baseUrl = useBaseUrl('/');
  const host = useRef<HTMLDivElement>(null);
  const current = useRef<Run | null>(null);
  const filesKey = JSON.stringify(files ?? {});
  /** What a run is of: a status reported for another run is stale, and reads as loading */
  const signature = [code, language, compiled ?? '', filesKey, renderer, runKey ?? 0, baseUrl].join('\0');
  const [reported, setReported] = useState<{ signature: string; status: RunStatus } | null>(null);
  const [stackOf, setStackOf] = useState<string | null>(null);
  const status: RunStatus = reported?.signature === signature ? reported.status : LOADING;
  const emitStatus = useEffectEvent((next: RunStatus) => props.onStatus?.(next));
  const emitConsole = useEffectEvent((entry: ConsoleEntry) => props.onConsole?.(entry));
  const emitRun = useEffectEvent(() => props.onRun?.());
  const readFiles = useEffectEvent(() => files);

  useEffect(() => {
    const element = host.current!;
    let pending: Run | null = null;
    const run = new AbortController();
    let settled: RunStatus | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const promote = (): void => {
      if (!pending) return;
      current.current?.destroy();
      current.current = pending;
      pending.frame.removeAttribute('data-pending');
      pending = null;
    };
    const settle = (next: RunStatus): void => {
      clearTimeout(timer);
      promote();
      settled = next;
      setReported({ signature, status: next });
      emitStatus(next);
    };
    const onEvent = (event: RunEvent): void => {
      if (event.type === 'console') {
        emitConsole(event.entry);

        return;
      }

      const next = statusAfter(settled, event);

      if (next?.state === 'ran') timer = setTimeout(() => settle(next), SHOW_AFTER);
      else if (next) settle(next);
    };

    emitStatus(LOADING);

    /** The program as JavaScript, compiled here unless it came compiled, or why it doesn't compile */
    const javascript = async (): Promise<{ js: string } | { error: RunError }> => {
      if (compiled !== undefined) return { js: compiled };

      const { compile, compileError } = await import('./compile');

      try {
        return { js: compile(code, language) };
      } catch (error) {
        return { error: { name: 'SyntaxError', ...compileError(error) } };
      }
    };

    void javascript().then((result) => {
      if (run.signal.aborted) return;
      if ('error' in result) {
        settle({ state: 'error', error: result.error });

        return;
      }

      const { js } = result;

      emitRun();
      pending = startRun(
        element,
        { code: js, files: readFiles(), renderer, name: fileName ?? `program.${language}`, baseUrl },
        onEvent,
        title,
      );
      pending.frame.className = styles.frame!;
      pending.frame.setAttribute('data-pending', '');
      if (!current.current) promote();
    });

    return () => {
      run.abort();
      clearTimeout(timer);
      pending?.destroy();
    };
  }, [code, language, compiled, filesKey, renderer, runKey, title, fileName, baseUrl, signature]);

  useEffect(() => {
    const element = host.current!;
    const observer = new IntersectionObserver(([entry]) => current.current?.setPaused(!entry!.isIntersecting));

    observer.observe(element);

    return () => {
      observer.disconnect();
      current.current?.destroy();
      current.current = null;
    };
  }, []);

  const error = status.state === 'error' ? status.error : null;
  const showStack = stackOf === signature;

  return (
    <div className={clsx(styles.runner, props.className)} style={props.style}>
      <div ref={host} className={styles.host} />
      {props.children}
      {status.state === 'loading' && (
        <span className={clsx('spinner', styles.loading)} role="status" aria-label="Loading the example" />
      )}
      {showErrors && error && (
        <div className={styles.error} role="alert">
          <div className={styles.errorHead}>
            <span className={styles.errorName}>{error.name}</span>
            {error.line !== undefined && (
              <span className={styles.errorWhere}>
                line {error.line}
                {error.column !== undefined && `:${error.column}`}
              </span>
            )}
          </div>
          <p className={styles.errorMessage}>{error.message}</p>
          {error.stack && (
            <>
              <button
                type="button"
                className={styles.errorToggle}
                aria-expanded={showStack}
                onClick={() => setStackOf(showStack ? null : signature)}
              >
                {showStack ? 'Hide the stack' : 'Show the stack'}
              </button>
              {showStack && <pre className={styles.errorStack}>{error.stack}</pre>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

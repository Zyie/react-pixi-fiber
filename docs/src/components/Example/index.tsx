import useBaseUrl from '@docusaurus/useBaseUrl';
import type { ExampleSource } from '@site/plugins/example/types';
import { CheckIcon, CollapseIcon, CopyIcon, ExpandIcon, PlayIcon, StopIcon } from '@site/src/components/Live/Icons';
import { useRenderer } from '@site/src/components/Live/preference';
import RendererSwitch from '@site/src/components/Live/RendererSwitch';
import type { RunStatus } from '@site/src/components/Live/status';
import { rendererLabel, withEntry } from '@site/src/components/Live/types';
import type { ConsoleEntry } from '@site/src/components/Live/types';
import { useCopy } from '@site/src/components/Live/useCopy';
import { useResizeHandle } from '@site/src/components/Live/useResizeHandle';
import CodeBlock from '@theme/CodeBlock';
import clsx from 'clsx';
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import styles from './styles.module.css';

/** The props MDX writes, the contract every page uses */
export interface ExampleProps {
  /** The example, from the repo root: `examples/<topic>/<name>.example.ts(x)` */
  file: string;
  /** A `// #region` of the file to show in place of all of it */
  region?: string;
  /** The height of the picture's stage in pixels; the picture's own height by default */
  height?: number;
  /** A caption; the file's path by default */
  title?: string;
  /** What the example draws, in words, for a reader who can't see the picture or the canvas */
  alt?: string;
}

/** The size of an example's canvas when it has no picture yet */
const CANVAS = { width: 400, height: 300 };

/** The smallest a reader can drag the canvas to */
const MIN_SIZE = { width: 120, height: 80 };

/**
 * What only a running example needs, in a chunk of its own, so a page that shows examples loads the
 * runner and the console when a reader first runs one
 */
const loadLive = () => import('./live');
const Runner = lazy(async () => ({ default: (await loadLive()).Runner }));
const Console = lazy(async () => ({ default: (await loadLive()).Console }));

/** The badge of each state of a run but `running`, which names its renderer */
const STATUS_LABELS = { loading: 'Loading', ran: 'Ran', error: 'Error' } as const;

/**
 * Makes everything on the page but an element inert, as a modal dialog does, so focus can't leave it
 * @param element - What stays usable
 * @returns What makes the page usable again
 */
function inertOutside(element: Element): () => void {
  const made: Element[] = [];

  for (let node = element; node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      made.push(sibling);
    }
  }

  return () => {
    for (const sibling of made) sibling.removeAttribute('inert');
  };
}

/**
 * An example of the docs: the picture its visual test draws and its code, which a reader can run live
 * in the page, on the renderer they choose. Editing the code in place is the next seam: layout's site
 * does it with Monaco, and the `program` and `focus` of the source are what an editor would show.
 * @param props - The props MDX writes, and the `source` that the remark plugin in `plugins/example` adds
 */
export default function Example(props: ExampleProps & { source: ExampleSource }): ReactNode {
  const { file, height, title, alt, source } = props;
  const { code, language, picture, program, compiled, files } = source;
  const baseUrl = useBaseUrl('/');
  const pictureSrc = useBaseUrl(picture?.src ?? '/');
  const [renderer, setRenderer] = useRenderer();
  const name = file.split('/').pop()!.replace('.example', '');
  const caption = title ?? file.split('/').pop()!;
  const canvas = picture ? { width: picture.width, height: picture.height } : CANVAS;

  const [live, setLive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<RunStatus>({ state: 'loading' });
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [copied, copy] = useCopy();
  const [size, setSize] = useState(canvas);
  const [stageWidth, setStageWidth] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const figure = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const collapse = useRef<HTMLButtonElement>(null);
  const base = height ?? canvas.height;
  const stageHeight = Math.max(base, size.height);
  const resized = size.width !== canvas.width || size.height !== canvas.height;
  /** How much a canvas wider than its stage shrinks to fit */
  const scale = expanded || stageWidth === null ? 1 : Math.min(1, stageWidth / size.width);

  useLayoutEffect(() => {
    const element = stage.current!;
    const observer = new ResizeObserver(() => setStageWidth(element.clientWidth));

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Filling the window is a modal dialog: the page behind it is inert, Escape closes it (the editor
  // keeps the first Escape, which lets Tab leave it), and focus goes back to the button that opened it.
  useEffect(() => {
    if (!expanded) return;

    const root = document.documentElement;
    const overflow = root.style.overflow;
    const button = collapse.current;
    const restore = inertOutside(figure.current!);
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') setExpanded(false);
    };

    root.style.overflow = 'hidden';
    button?.focus();
    addEventListener('keydown', onKey);

    return () => {
      restore();
      root.style.overflow = overflow;
      removeEventListener('keydown', onKey);
      // Out of the document once the example unmounts, when focusing it does nothing
      button?.focus();
    };
  }, [expanded]);

  const start = useCallback(() => {
    setStatus({ state: 'loading' });
    setLive(true);
  }, []);

  // A pointer on a button that starts a run: by the click, the runtime is on its way
  const warm = live ? undefined : () => void loadLive().then(({ prefetchRuntime }) => prefetchRuntime(baseUrl));

  const stop = (): void => {
    setLive(false);
    setDrawn(false);
    setEntries([]);
    setSize(canvas);
    setStatus({ state: 'loading' });
  };

  const onStatus = useCallback((next: RunStatus) => {
    setStatus(next);
    if (next.state === 'running') setDrawn(true);
  }, []);

  const toggleExpanded = (): void => {
    if (!expanded && !live) start();
    setExpanded(!expanded);
  };

  const onConsole = useCallback((entry: ConsoleEntry) => setEntries((list) => withEntry(list, entry)), []);
  const onRun = useCallback(() => setEntries([]), []);

  /** The widest the canvas goes: its stage's width, in the canvas's own px */
  const maxWidth = (): number => stage.current!.clientWidth / scale;

  /**
   * A size for the canvas, no smaller than a reader can use and no wider than its stage
   * @param width - The width asked for
   * @param height - The height asked for
   * @param widest - The widest it goes
   */
  const fit = (width: number, height: number, widest: number): { width: number; height: number } => ({
    width: Math.round(Math.min(widest, Math.max(MIN_SIZE.width, width))),
    height: Math.round(Math.max(MIN_SIZE.height, height)),
  });

  // The corner of the canvas. The canvas stays centred, so its width grows twice as fast as the pointer
  // moves, and its bottom edge follows the pointer whatever the stage's own height.
  const resize = useResizeHandle(
    () => ({ ...size, scale, widest: maxWidth(), bottom: (Math.max(base, size.height) + size.height) / 2 }),
    (from, dx, dy) => {
      const bottom = from.bottom + dy / from.scale;

      setSize(fit(from.width + (dx * 2) / from.scale, bottom >= base ? bottom : 2 * bottom - base, from.widest));
    },
    (dx, dy) => setSize(fit(size.width + dx, size.height + dy, maxWidth())),
  );

  const resizeByKey = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setSize(canvas);
    } else {
      resize.handlers.onKeyDown(event);
    }
  };

  const pictureImage = picture && (
    <img
      className={styles.picture}
      src={pictureSrc}
      width={picture.width}
      height={picture.height}
      alt={alt ?? `What ${caption} draws`}
      loading="lazy"
      decoding="async"
    />
  );
  const cover = pictureImage && <div className={styles.cover}>{pictureImage}</div>;
  const block = (
    <CodeBlock className={styles.block} language={language}>
      {code}
    </CodeBlock>
  );

  return (
    <figure
      ref={figure}
      className={clsx(styles.example, expanded && styles.expanded)}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? caption : undefined}
      onPointerEnter={() => void loadLive()}
    >
      <figcaption className={styles.bar}>
        <span className={clsx(styles.title, !title && styles.path)} title={caption}>
          {caption}
        </span>
        {live && (
          <span
            className={clsx(styles.status, styles[status.state])}
            aria-live="polite"
            title={status.state === 'running' ? `Drawn with ${rendererLabel(status.renderer)}` : undefined}
          >
            {status.state !== 'running'
              ? STATUS_LABELS[status.state]
              : status.renderer === renderer
                ? 'Live'
                : `Live on ${rendererLabel(status.renderer)}`}
          </span>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={live ? stop : start}
            onPointerEnter={warm}
            aria-label={live ? 'Stop the example' : 'Run the example live'}
            title={live ? 'Stop' : 'Run live'}
          >
            {live ? <StopIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => void copy(program)}
            aria-label={copied ? 'Copied the example' : 'Copy the example'}
            title={copied ? 'Copied' : 'Copy the example'}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            ref={collapse}
            type="button"
            className={styles.action}
            onClick={toggleExpanded}
            onPointerEnter={warm}
            aria-label={expanded ? 'Back to the page' : 'Fill the window'}
            title={expanded ? 'Back to the page (Esc)' : 'Fill the window'}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </button>
        </div>
      </figcaption>

      <div className={styles.body}>
        <div className={styles.view}>
          <div
            ref={stage}
            className={clsx(styles.stage, !live && styles.idle)}
            style={
              expanded
                ? undefined
                : live
                  ? { height: stageHeight * scale }
                  : { aspectRatio: `${canvas.width} / ${base}`, maxHeight: base }
            }
            onClick={live ? undefined : start}
          >
            <div
              className={styles.canvas}
              style={
                expanded
                  ? undefined
                  : live
                    ? { width: size.width, height: size.height, transform: scale < 1 ? `scale(${scale})` : undefined }
                    : { width: canvas.width, aspectRatio: `${canvas.width} / ${canvas.height}` }
              }
            >
              {live ? (
                <Suspense fallback={cover}>
                  <Runner
                    className={clsx(styles.runner, resize.dragging && styles.inert)}
                    code={program}
                    compiled={compiled}
                    language={language}
                    files={files}
                    renderer={renderer}
                    title={`${alt ?? caption}, running live`}
                    fileName={name}
                    onStatus={onStatus}
                    onConsole={onConsole}
                    onRun={onRun}
                  >
                    {!drawn && cover}
                  </Runner>
                </Suspense>
              ) : (
                pictureImage
              )}
              {live && !expanded && (
                <button
                  type="button"
                  className={styles.resize}
                  {...resize.handlers}
                  onDoubleClick={() => setSize(canvas)}
                  onKeyDown={resizeByKey}
                  aria-label="Resize the canvas"
                  title="Drag or use the arrow keys to resize the canvas; double-click or Enter resets it"
                />
              )}
            </div>
            {!live && (
              <button type="button" className={styles.play} onClick={start} onPointerEnter={warm}>
                <PlayIcon />
                Run live
              </button>
            )}
            {live && !expanded && (
              <span className={clsx(styles.size, (resize.dragging || resized) && styles.shown)} role="status">
                {size.width} × {size.height}
              </span>
            )}
          </div>

          {live && (
            <Suspense fallback={<div className={styles.statusBar} />}>
              <Console
                className={styles.statusBar}
                entries={entries}
                open={consoleOpen}
                onToggle={() => setConsoleOpen(!consoleOpen)}
                onClear={() => setEntries([])}
              >
                <RendererSwitch className="segmented--small" value={renderer} onChange={setRenderer} />
              </Console>
            </Suspense>
          )}
        </div>

        <div className={styles.code}>{block}</div>
      </div>
    </figure>
  );
}

import { useEffect, useMemo, useRef } from 'react';

import { measureParity, PARITY_THRESHOLD } from '../../tests/harness/parity-metric';
import type { ParityMeasure } from '../../tests/harness/parity-metric';
import type { RendererType } from '../../tests/harness/scene-runner';
import { entries } from './scenes';
import type { EntryKind, PlaygroundEntry } from './scenes';
import { frameUrl, useCapture } from './useCapture';
import type { Capture } from './useCapture';
import { useUrlState } from './useUrlState';

/** Every renderer, in the order the panes show them */
const RENDERERS: RendererType[] = ['webgl', 'webgpu', 'three'];

const LABELS: Record<RendererType, string> = { webgl: 'pixi WebGL', webgpu: 'pixi WebGPU', three: 'three.js' };

const TABS: { kind: EntryKind; title: string }[] = [
  { kind: 'scene', title: 'Scenes' },
  { kind: 'example', title: 'Examples' },
];

export function App() {
  const [state, update] = useUrlState();
  const entry = useMemo(
    () => entries.find((e) => e.kind === state.kind && e.id === state.id) ?? null,
    [state.kind, state.id],
  );
  const captures: Record<RendererType, Capture> = {
    webgl: useCapture(entry, 'webgl'),
    webgpu: useCapture(entry, 'webgpu'),
    three: useCapture(entry, 'three'),
  };

  return (
    <div className="layout">
      <Sidebar
        kind={state.kind}
        selected={entry}
        search={state.search}
        onKind={(kind) => update({ kind, id: null })}
        onSearch={(search) => update({ search })}
        onSelect={(selected) => update({ kind: selected.kind, id: selected.id })}
      />
      <main className="main">
        {entry ? (
          <>
            <header className="toolbar">
              <div className="title">
                <span className="kind">{entry.kind}</span>
                <h1>{entry.id}</h1>
                <code className="key">tests/snapshots/{entry.key}.&lt;renderer&gt;.png</code>
              </div>
              <div className="segmented" role="tablist">
                <button aria-pressed={state.view === 'side'} onClick={() => update({ view: 'side' })}>
                  Side by side
                </button>
                <button aria-pressed={state.view === 'diff'} onClick={() => update({ view: 'diff' })}>
                  Diff
                </button>
              </div>
              {state.view === 'diff' && (
                <div className="pair">
                  <RendererSelect value={state.a} onChange={(a) => update({ a })} />
                  <span>vs</span>
                  <RendererSelect value={state.b} onChange={(b) => update({ b })} />
                </div>
              )}
            </header>
            <section className="panes">
              {(state.view === 'side' ? RENDERERS : [state.a, state.b]).map((renderer, index) => (
                <Pane key={`${renderer}-${index}`} entry={entry} renderer={renderer} capture={captures[renderer]} />
              ))}
              {state.view === 'diff' && (
                <DiffPane
                  a={captures[state.a]}
                  b={captures[state.b]}
                  title={`${LABELS[state.a]} vs ${LABELS[state.b]}`}
                />
              )}
            </section>
          </>
        ) : (
          <div className="empty">
            <h1>react-pixi-fiber playground</h1>
            <p>
              Pick a scene or an example. Each is built three times, as the visual tests build it: through this library
              on pixi-3d's WebGL and WebGPU renderers, and through r3f's own entry on three.js.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface SidebarProps {
  kind: EntryKind;
  selected: PlaygroundEntry | null;
  search: string;
  onKind: (kind: EntryKind) => void;
  onSearch: (search: string) => void;
  onSelect: (entry: PlaygroundEntry) => void;
}

function Sidebar({ kind, selected, search, onKind, onSearch, onSelect }: SidebarProps) {
  const folders = useMemo(() => {
    const query = search.toLowerCase();
    const groups = new Map<string, PlaygroundEntry[]>();

    for (const entry of entries) {
      if (entry.kind !== kind || (query && !entry.id.toLowerCase().includes(query))) continue;
      groups.set(entry.folder, [...(groups.get(entry.folder) ?? []), entry]);
    }

    return [...groups];
  }, [kind, search]);

  return (
    <nav className="sidebar">
      <div className="brand">
        react-pixi-fiber <span>playground</span>
      </div>
      <div className="segmented tabs">
        {TABS.map((tab) => (
          <button key={tab.kind} aria-pressed={kind === tab.kind} onClick={() => onKind(tab.kind)}>
            {tab.title} <span className="count">{entries.filter((entry) => entry.kind === tab.kind).length}</span>
          </button>
        ))}
      </div>
      <input
        className="search"
        type="search"
        placeholder="Filter"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <div className="tree">
        {folders.map(([folder, items]) => (
          <div key={folder} className="folder">
            <div className="folder-name">{folder}</div>
            {items.map((entry) => (
              <button key={entry.id} className="leaf" aria-current={entry === selected} onClick={() => onSelect(entry)}>
                {entry.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

function RendererSelect({ value, onChange }: { value: RendererType; onChange: (renderer: RendererType) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as RendererType)}>
      {RENDERERS.map((renderer) => (
        <option key={renderer} value={renderer}>
          {LABELS[renderer]}
        </option>
      ))}
    </select>
  );
}

/** Shows a canvas the playground already holds, in a frame of its shape, so a scene that isn't 4:3 isn't cropped */
function CanvasHost({ canvas }: { canvas: HTMLCanvasElement }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    host.current?.replaceChildren(canvas);
  }, [canvas]);

  return <div ref={host} className="canvas" style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }} />;
}

function Pane({ entry, renderer, capture }: { entry: PlaygroundEntry; renderer: RendererType; capture: Capture }) {
  return (
    <figure className="pane">
      <figcaption>
        <span className={`dot ${renderer}`} />
        {LABELS[renderer]}
        <a href={frameUrl(entry, renderer)} target="_blank" rel="noreferrer">
          open
        </a>
        {entry.kind === 'example' && (
          <a href={frameUrl(entry, renderer, true)} target="_blank" rel="noreferrer">
            live
          </a>
        )}
      </figcaption>
      {capture.status === 'done' && <CanvasHost canvas={capture.canvas} />}
      {capture.status === 'loading' && <div className="canvas placeholder">Rendering…</div>}
      {capture.status === 'skipped' && <div className="canvas placeholder">Skipped: {capture.reason}</div>}
      {capture.status === 'error' && <pre className="canvas error">{capture.message}</pre>}
    </figure>
  );
}

/**
 * Draws the difference between two pictures and measures it as the tests measure parity
 * @param a - One picture
 * @param b - The other
 */
function diffCanvases(
  a: HTMLCanvasElement,
  b: HTMLCanvasElement,
): { canvas: HTMLCanvasElement; measure: ParityMeasure } {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const pixels = (source: HTMLCanvasElement): ImageData => {
    const scratch = new OffscreenCanvas(width, height).getContext('2d')!;

    scratch.fillStyle = '#000';
    scratch.fillRect(0, 0, width, height);
    scratch.drawImage(source, 0, 0);

    return scratch.getImageData(0, 0, width, height);
  };
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d')!;
  const output = context.createImageData(width, height);
  const measure = measureParity(pixels(a).data, pixels(b).data, width, height, output.data);

  context.putImageData(output, 0, 0);

  return { canvas, measure };
}

/**
 * The difference between two captures, counted as the tests count parity: the share of drawn pixels
 * that differ at the parity threshold
 */
function DiffPane({ a, b, title }: { a: Capture; b: Capture; title: string }) {
  const canvasA = a.status === 'done' ? a.canvas : null;
  const canvasB = b.status === 'done' ? b.canvas : null;
  const diff = useMemo(() => (canvasA && canvasB ? diffCanvases(canvasA, canvasB) : null), [canvasA, canvasB]);

  return (
    <figure className="pane">
      <figcaption>
        <span className="dot diff" />
        Diff
        {diff && (
          <span className="measure">
            {(diff.measure.share * 100).toFixed(1)}% of drawn pixels · {diff.measure.differing} px
          </span>
        )}
      </figcaption>
      {diff ? (
        <CanvasHost canvas={diff.canvas} />
      ) : (
        <div className="canvas placeholder">
          {a.status === 'skipped' || b.status === 'skipped'
            ? 'Nothing to compare: skipped on one side'
            : 'Waiting for both…'}
        </div>
      )}
      <p className="note">
        {title}. Red pixels differ at pixelmatch threshold {PARITY_THRESHOLD}; yellow is anti-aliasing.
      </p>
    </figure>
  );
}

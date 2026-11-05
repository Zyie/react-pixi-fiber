/**
 * Crawls a build of the site in Chromium, the way a reader and a search engine meet it, and fails on
 * anything broken:
 *
 * ```sh
 * node docs/scripts/crawl.mts [--name <name> | --dir <build>] [--out <report.json>] [--concurrency <n>]
 * ```
 *
 * It serves the build as GitHub Pages does (`docs/scripts/pages.mts`), opens `/`, every URL of the
 * sitemap and every same-site link it finds on the way, and checks the files llms.txt and the sitemap
 * name. Each page opens cold, in its own browser context, and settles until the network is idle. The
 * crawl answers every request to another site itself, with an empty response, so it neither waits on
 * other sites nor fails when they're down; it lists the sites the pages asked for.
 *
 * Then it runs live code: on the page of the first example of each topic, it presses "Run the example
 * live". A run must draw within 30 s, with no error shown over its canvas, no exception and nothing
 * logged as an error, by the page or the program's frame. With no examples, there is nothing to run.
 *
 * - **Errors**, which exit with 1: console errors, uncaught exceptions, failed requests and responses of
 *   400 or more, links to a missing page or file, links to an anchor the page doesn't
 *   have, and a live run that fails. Two missing pages are also opened, to check the 404 page.
 * - **Warnings:** a page that doesn't load in 30 s or whose network doesn't settle in 10 s, and a page
 *   search engines may index (no `noindex`, and not disallowed by robots.txt) with no title,
 *   description, `og:image` or canonical URL of its own in the HTML as served, without exactly one
 *   `h1`, or with an image that has no `alt`.
 * - **Weight:** the JavaScript, CSS and WebAssembly each page loads before it settles, raw and gzipped as
 *   GitHub Pages serves it, its layout shift, which warns above 0.1, and how long each live run takes
 *   to draw.
 *
 * Without `--name` or `--dir` it reads `docs/build`. `--out` also writes everything as JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import zlib from 'node:zlib';

import { chromium } from 'playwright';
import type { Browser, BrowserContext } from 'playwright';

import { CHANNEL } from '../src/components/Live/types.ts';
import type { FrameEvent } from '../src/components/Live/types.ts';
import { chromiumLaunchOptions, watchPageErrors } from './chromium.mts';
import { buildDir, servePages } from './pages.mts';

const COMPRESSED = /\.(?:html|m?js|css|json|map|svg|txt|md|xml|wasm)$/;
/** A missing page, to check the 404 page */
const MISSING = ['/this-page-does-not-exist/'];
const SETTLE_MS = 10_000;
/** The layout shift above which Core Web Vitals no longer call a page good */
const GOOD_SHIFT = 0.1;
/** How long a live run may take to draw; CI draws in software */
const LIVE_MS = 30_000;
/** How long a run that drew is watched for an error that follows */
const LIVE_GRACE_MS = 500;

/** What one page loaded, and what was wrong with it */
interface PageReport {
  readonly path: string;
  status: number;
  title: string;
  /** Bytes of each kind of file the page loaded before it settled, raw and gzipped */
  weight: Record<'js' | 'css' | 'wasm', { raw: number; gzip: number }>;
  requests: number;
  /** Cumulative layout shift until the page settled */
  shift: number;
  errors: string[];
  warnings: string[];
}

/** How one live run went */
interface LiveReport {
  readonly path: string;
  /** Milliseconds from pressing Run live to the first frame drawn */
  ms: number | null;
  /** The renderer pixi drew with */
  renderer: string;
  errors: string[];
}

/** What the page says about itself, read in the browser */
interface PageFacts {
  title: string;
  description: string | null;
  canonical: string | null;
  image: string | null;
  noindex: boolean;
  h1: number;
  imagesWithoutAlt: number;
  shift: number;
  ids: string[];
  links: string[];
}

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    dir: { type: 'string' },
    out: { type: 'string' },
    concurrency: { type: 'string', default: '4' },
  },
});
const build = values.dir ? path.resolve(values.dir) : buildDir(values.name);
const server = await servePages(build);
const { origin } = server;
const gzipSizes = new Map<string, number>();

/**
 * A served file's size, raw and as GitHub Pages sends it
 * @param pathname - The URL's path
 */
function sizeOf(pathname: string): { raw: number; gzip: number } {
  const file = server.fileOf(pathname);

  if (!file) return { raw: 0, gzip: 0 };

  const bytes = fs.readFileSync(file);

  if (!gzipSizes.has(file)) gzipSizes.set(file, COMPRESSED.test(file) ? zlib.gzipSync(bytes).length : bytes.length);

  return { raw: bytes.length, gzip: gzipSizes.get(file)! };
}

const sitemap = fs.readFileSync(path.join(build, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]!));
const site = sitemapUrls[0]?.origin ?? origin;
const disallowed = [...fs.readFileSync(path.join(build, 'robots.txt'), 'utf8').matchAll(/^Disallow:\s*(\S+)/gm)].map(
  (match) => match[1]!,
);
const llmsUrls = [...fs.readFileSync(path.join(build, 'llms.txt'), 'utf8').matchAll(/\]\((https?:[^)\s]+)\)/g)]
  .map((match) => new URL(match[1]!))
  .filter((url) => url.origin === site);

const reports = new Map<string, PageReport>();
const queue: string[] = ['/', ...MISSING, ...sitemapUrls.map((url) => url.pathname)];
const seen = new Set<string>(queue);
const files = new Map<string, string>();
const anchors: { from: string; to: string; hash: string }[] = [];
const ids = new Map<string, Set<string>>();
/** The other sites the pages asked for, which the crawl answered itself */
const otherSites = new Set<string>();
const topicOf = (route: string): string | undefined => /^\/examples\/([^/]+)\/[^/]+\/$/.exec(route)?.[1];
const examplePages = sitemapUrls.map((url) => url.pathname).filter((route) => topicOf(route));
const liveRoutes = examplePages.filter(
  (route, index) => examplePages.findIndex((other) => topicOf(other) === topicOf(route)) === index,
);

for (const url of llmsUrls) files.set(url.pathname, '/llms.txt');
for (const file of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']) files.set(file, '/');

/**
 * Queues a link found on a page: a page to open, a file to check, an anchor to look for. A hash that
 * holds state, such as `#code=...`, is no anchor.
 * @param from - The page it's on
 * @param href - Where it points, resolved
 */
function follow(from: string, href: string): void {
  const url = new URL(href);

  if (url.origin !== origin) return;
  if (/^#[^=&/?]+$/.test(url.hash))
    anchors.push({ from, to: url.pathname, hash: decodeURIComponent(url.hash.slice(1)) });
  if (/\.(?!html$)\w+$/.test(url.pathname)) {
    if (!files.has(url.pathname)) files.set(url.pathname, from);
  } else if (!seen.has(url.pathname)) {
    seen.add(url.pathname);
    queue.push(url.pathname);
  }
}

/**
 * A fresh browser context in which the crawl answers each request to another site with nothing
 * @param browser - The browser
 */
async function openContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.route(
    (url) => url.protocol.startsWith('http') && url.origin !== origin,
    (request) => {
      otherSites.add(new URL(request.request().url()).origin);

      return request.fulfill({ status: 204 });
    },
  );

  return context;
}

/**
 * Opens one page cold and settles it
 * @param browser - The browser
 * @param route - The page's path
 */
async function visit(browser: Browser, route: string): Promise<PageReport> {
  const context = await openContext(browser);
  await context.addInitScript(() => {
    Reflect.set(window, 'crawlShift', 0);
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput)
          Reflect.set(window, 'crawlShift', (Reflect.get(window, 'crawlShift') as number) + entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  const page = await context.newPage();
  const report: PageReport = {
    path: route,
    status: 0,
    title: '',
    weight: { js: { raw: 0, gzip: 0 }, css: { raw: 0, gzip: 0 }, wasm: { raw: 0, gzip: 0 } },
    requests: 0,
    shift: 0,
    errors: [],
    warnings: [],
  };
  const expected404 = MISSING.includes(route);
  const weighed = new Set<string>();

  // A missing page's 404, and the console error Chromium logs for it, are what the page is for
  watchPageErrors(page, (error, url) => {
    if (!(expected404 && url === origin + route)) report.errors.push(error);
  });
  page.on('response', (response) => {
    const url = new URL(response.url());

    report.requests++;
    if (url.origin !== origin || response.status() !== 200 || weighed.has(url.pathname)) return;

    const type = response.request().resourceType();
    const kind = url.pathname.endsWith('.wasm')
      ? 'wasm'
      : type === 'script'
        ? 'js'
        : type === 'stylesheet'
          ? 'css'
          : null;

    if (kind) {
      const size = sizeOf(url.pathname);

      weighed.add(url.pathname);
      report.weight[kind].raw += size.raw;
      report.weight[kind].gzip += size.gzip;
    }
  });

  try {
    const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: SETTLE_MS * 3 });

    report.status = response?.status() ?? 0;

    // The head as served, which is what search engines read; Docusaurus rewrites it as the page hydrates
    const html = (await response?.text()) ?? '';

    await page.waitForLoadState('load', { timeout: SETTLE_MS * 3 }).catch(() => {
      report.warnings.push(`no load event after ${(SETTLE_MS * 3) / 1000} s`);
    });
    await page.waitForLoadState('networkidle', { timeout: SETTLE_MS }).catch(() => {
      report.warnings.push(`the network was still busy after ${SETTLE_MS / 1000} s`);
    });

    const facts: PageFacts = await page.evaluate((served) => {
      const head = new DOMParser().parseFromString(served, 'text/html');
      const meta = (selector: string): string | null => head.querySelector(selector)?.getAttribute('content') ?? null;

      return {
        title: head.title,
        description: meta('meta[name="description"]'),
        canonical: head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
        image: meta('meta[property="og:image"]'),
        noindex: [...head.querySelectorAll('meta[name="robots"], meta[property="robots"]')].some((tag) =>
          /noindex/.test(tag.getAttribute('content') ?? ''),
        ),
        h1: document.querySelectorAll('h1').length,
        imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
        shift: Reflect.get(window, 'crawlShift') as number,
        ids: [...document.querySelectorAll('[id]')].map((element) => element.id),
        links: [...document.querySelectorAll('a[href]')].map((anchor) => (anchor as HTMLAnchorElement).href),
      };
    }, html);

    report.title = facts.title;
    report.shift = Math.round(facts.shift * 1000) / 1000;
    if (report.shift > GOOD_SHIFT)
      report.warnings.push(`layout shift of ${report.shift}, over the ${GOOD_SHIFT} counted as good`);
    ids.set(route, new Set(facts.ids));
    for (const link of facts.links) follow(route, link);

    if (expected404) {
      if (report.status !== 404) report.errors.push(`a missing page answers ${report.status}, not 404`);
    } else if (!facts.noindex && !disallowed.some((prefix) => route.startsWith(prefix))) {
      const canonical = facts.canonical ? new URL(facts.canonical) : null;

      if (!facts.title) report.warnings.push('no title');
      if (!facts.description) report.warnings.push('no meta description');
      if (!facts.image) report.warnings.push('no og:image');
      if (canonical?.origin !== site || canonical.pathname !== route) {
        report.warnings.push(`canonical URL ${facts.canonical} is not ${site}${route}`);
      }
      if (facts.h1 !== 1) report.warnings.push(`${facts.h1} h1 elements`);
      if (facts.imagesWithoutAlt) report.warnings.push(`${facts.imagesWithoutAlt} images without alt`);
    }
  } catch (error) {
    report.errors.push(`navigation: ${(error as Error).message.split('\n')[0]}`);
  }

  await context.close();

  return report;
}

/**
 * Runs a page's live code and waits for it to draw: an example's page after pressing Run live. A run
 * reports to its page by `postMessage`, which is where its errors go, so the page's listener for them is
 * mirrored here.
 * @param browser - The browser
 * @param route - The page's path, with its query
 */
async function runLive(browser: Browser, route: string): Promise<LiveReport> {
  const context = await openContext(browser);
  await context.addInitScript((channel) => {
    if (window.top !== window) return;

    const events: unknown[] = [];

    Reflect.set(window, 'crawlLive', events);
    addEventListener('message', (event: MessageEvent<{ channel?: string } | null>) => {
      if (event.data?.channel === channel) events.push(event.data);
    });
  }, CHANNEL);

  const page = await context.newPage();
  const report: LiveReport = { path: route, ms: null, renderer: '', errors: [] };

  watchPageErrors(page, (error) => report.errors.push(error));

  try {
    await page.goto(origin + route, { waitUntil: 'load', timeout: LIVE_MS });
    await page.getByRole('button', { name: 'Run the example live' }).first().click();

    const started = Date.now();
    const settled = (): boolean =>
      (Reflect.get(window, 'crawlLive') as FrameEvent[]).some(
        (event) => event.type === 'rendered' || event.type === 'error',
      ) || document.querySelector('[role="alert"]') !== null;

    await page.waitForFunction(settled, null, { timeout: LIVE_MS });

    const settledIn = Date.now() - started;

    await page.waitForTimeout(LIVE_GRACE_MS);

    const { events, alert } = await page.evaluate(() => ({
      events: Reflect.get(window, 'crawlLive') as FrameEvent[],
      alert: document.querySelector<HTMLElement>('[role="alert"]')?.innerText.replace(/\s+/g, ' ') ?? null,
    }));

    for (const event of events) {
      if (event.type === 'rendered' && !report.renderer) {
        report.renderer = event.renderer;
        report.ms = settledIn;
      } else if (event.type === 'error') {
        report.errors.push(`run: ${event.error.name}: ${event.error.message}`);
      } else if (event.type === 'console' && event.entry.level === 'error') {
        report.errors.push(`run console: ${event.entry.text}`);
      }
    }
    // An error that stops a run before its frame starts, such as code that doesn't compile, shows only on the page
    if (alert && !events.some((event) => event.type === 'error')) report.errors.push(`shown over the canvas: ${alert}`);
    if (!report.renderer && report.errors.length === 0) report.errors.push('the run drew nothing');
  } catch (error) {
    report.errors.push(`live: ${(error as Error).message.split('\n')[0]}`);
  }

  await context.close();

  return report;
}

const browser = await chromium.launch(chromiumLaunchOptions());
let visiting = 0;

/** Opens queued pages until the queue is empty and no other worker can add to it */
async function work(): Promise<void> {
  for (;;) {
    const route = queue.shift();

    if (route === undefined) {
      if (visiting === 0) return;
      await new Promise((done) => setTimeout(done, 50));
      continue;
    }
    visiting++;
    reports.set(route, await visit(browser, route));
    visiting--;
  }
}

await Promise.all(Array.from({ length: Number(values.concurrency) }, work));

const liveQueue = [...liveRoutes];
const lives: LiveReport[] = [];

await Promise.all(
  Array.from({ length: Number(values.concurrency) }, async () => {
    for (let route = liveQueue.shift(); route !== undefined; route = liveQueue.shift()) {
      lives.push(await runLive(browser, route));
    }
  }),
);
lives.sort((a, b) => liveRoutes.indexOf(a.path) - liveRoutes.indexOf(b.path));
await browser.close();

const missingFiles: string[] = [];

for (const [file, from] of files) {
  const response = await fetch(origin + file, { method: 'HEAD', redirect: 'manual' });

  if (response.status !== 200) missingFiles.push(`${file} (${response.status}), linked from ${from}`);
}
server.close();

const brokenAnchors = anchors
  .filter(({ to, hash }) => ids.has(to) && !ids.get(to)!.has(hash))
  .map(({ from, to, hash }) => `${to}#${hash}, linked from ${from}`);
const pages = [...reports.values()].sort((a, b) => a.path.localeCompare(b.path));
const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} kB`;
let errors = missingFiles.length + brokenAnchors.length;
let warnings = 0;

console.log(`\nPath${' '.repeat(52)}Status  JS gzip   CSS gzip  Shift  Requests`);
for (const report of pages) {
  console.log(
    `${report.path.padEnd(56)}${String(report.status).padEnd(8)}${kb(report.weight.js.gzip).padEnd(10)}${kb(report.weight.css.gzip).padEnd(10)}${String(report.shift).padEnd(7)}${report.requests}`,
  );
}
for (const report of pages) {
  errors += report.errors.length;
  warnings += report.warnings.length;
  if (report.errors.length + report.warnings.length === 0) continue;
  console.log(`\n${report.path}`);
  for (const error of report.errors) console.log(`  error: ${error}`);
  for (const warning of report.warnings) console.log(`  warning: ${warning}`);
}
for (const file of missingFiles) console.log(`error: missing file ${file}`);
for (const anchor of brokenAnchors) console.log(`error: missing anchor ${anchor}`);

console.log(`\nLive run${' '.repeat(48)}Drew in   Renderer`);
for (const live of lives) {
  const drew = live.ms === null ? '-' : `${(live.ms / 1000).toFixed(1)} s`;

  console.log(`${live.path.padEnd(56)}${drew.padEnd(10)}${live.renderer || '-'}`);
}
for (const live of lives) {
  errors += live.errors.length;
  if (live.errors.length === 0) continue;
  console.log(`\n${live.path}`);
  for (const error of live.errors) console.log(`  error: ${error}`);
}

const failedRuns = lives.filter((live) => live.errors.length > 0).length;

console.log(`\nOther sites the pages asked for, answered with nothing: ${[...otherSites].sort().join(', ') || 'none'}`);
console.log(
  `\ncrawl: ${pages.length} pages, ${files.size} files and ${lives.length} live runs (${failedRuns} failed), ${errors} errors, ${warnings} warnings (${build})`,
);

if (values.out) {
  fs.mkdirSync(path.dirname(path.resolve(values.out)), { recursive: true });
  fs.writeFileSync(
    values.out,
    `${JSON.stringify({ pages, lives, missingFiles, brokenAnchors, otherSites: [...otherSites].sort() }, null, 2)}\n`,
  );
}

process.exit(errors ? 1 : 0);

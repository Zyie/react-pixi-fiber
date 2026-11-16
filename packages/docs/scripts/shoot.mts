/**
 * Screenshots pages of the site at a desktop and a phone size, dark and light, and lists what each
 * page logs as an error: console errors, uncaught exceptions and failed requests.
 *
 * ```sh
 * node packages/docs/scripts/shoot.mts [--name <name> | --dir <build> | --port <port>] --out <folder> [--full] / /docs/
 * ```
 *
 * It serves a build as the crawl does, `docs/build` or the one `--name` or `--dir` names, or with
 * `--port` shoots a server already running there, such as `site.mts dev`. Each picture is
 * `<folder>/<page>-<width>x<height>-<mode>.png`, `<page>` being the path's segments joined by `_`, or
 * `home` for `/`. `--full` takes the whole page instead of the first screen. It exits with 1 when a
 * page logged an error.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright';

import { chromiumLaunchOptions, watchPageErrors } from './chromium.mts';
import { buildDir, servePages } from './pages.mts';

const SIZES = [
  { width: 1440, height: 900, isMobile: false },
  { width: 390, height: 844, isMobile: true },
];
const MODES = ['dark', 'light'] as const;

const { values, positionals: pages } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    dir: { type: 'string' },
    port: { type: 'string' },
    out: { type: 'string' },
    full: { type: 'boolean', default: false },
  },
});

if (!values.out || pages.length === 0) {
  console.error(
    'Usage: node packages/docs/scripts/shoot.mts [--name <name> | --dir <build> | --port <port>] --out <folder> [--full] <path>...',
  );
  process.exit(1);
}

const server = values.port ? null : await servePages(values.dir ? path.resolve(values.dir) : buildDir(values.name));
const origin = server?.origin ?? `http://127.0.0.1:${values.port}`;
const out = path.resolve(values.out);
const browser = await chromium.launch(chromiumLaunchOptions());
let failed = false;

fs.mkdirSync(out, { recursive: true });

for (const { width, height, isMobile } of SIZES) {
  for (const mode of MODES) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile, hasTouch: isMobile });
    const page = await context.newPage();
    const errors: string[] = [];

    watchPageErrors(page, (error) => errors.push(error));

    for (const route of pages) {
      const url = new URL(route, origin);
      const file = path.join(
        out,
        `${route.split('/').filter(Boolean).join('_') || 'home'}-${width}x${height}-${mode}.png`,
      );

      url.searchParams.set('docusaurus-theme', mode);
      errors.length = 0;
      await page.goto(url.href, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      await page.screenshot({ path: file, fullPage: values.full });
      console.log(file);
      for (const error of errors) console.error(`  ${error}`);
      failed ||= errors.length > 0;
    }
    await context.close();
  }
}

await browser.close();
server?.close();
process.exit(failed ? 1 : 0);

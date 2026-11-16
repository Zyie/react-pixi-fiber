/**
 * Runs the docs site for one caller, so several callers can build and serve it at the same time:
 *
 * ```sh
 * node docs/scripts/site.mts <command> [--name <name>] [--port <port>] [-- <docusaurus flags>]
 * ```
 *
 * - `sync` writes the generated content (docs/scripts/sync.mts).
 * - `build` syncs, then builds the site.
 * - `serve` serves that build on 127.0.0.1 as GitHub Pages does (docs/scripts/pages.mts).
 * - `dev` syncs, then runs the dev server, and syncs a generator again when one of its sources changes.
 * - `clear` deletes the build and Docusaurus's generated files.
 *
 * With `--name`, both go in `docs/.sites/<name>/`, so callers with different names share no file.
 * Without it they are Docusaurus's own, `docs/build` and `docs/.docusaurus`. The generated content is
 * shared, and every caller writes the same bytes.
 * `serve` and `dev` listen on `--port`, 3000 by default, and fail when something else holds it.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { buildDir, servePages } from './pages.mts';
import { ROOT, SITE } from './paths.mts';
import type { Generator } from './sync.mts';

const COMMANDS = ['sync', 'build', 'serve', 'dev', 'clear'];
const DOCUSAURUS = createRequire(import.meta.url).resolve('@docusaurus/core/bin/docusaurus.mjs');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { name: { type: 'string' }, port: { type: 'string', default: '3000' } },
});
const [command = '', ...flags] = positionals;
const { name, port } = values;

if (!COMMANDS.includes(command) || (name !== undefined && !/^[\w-]+$/.test(name))) {
  console.error(
    `Usage: node docs/scripts/site.mts <${COMMANDS.join('|')}> [--name <letters, digits, - and _>] [--port <port>]`,
  );
  process.exit(1);
}

const own = name === undefined ? null : path.join('.sites', name);
const outDir = buildDir(name);
/** What Docusaurus runs with: a copy taken before the sync, so nothing a generator sets in this process reaches it */
const env: NodeJS.ProcessEnv = {
  ...process.env,
  ...(own && { DOCUSAURUS_GENERATED_FILES_DIR_NAME: path.join(own, 'generated') }),
};

/**
 * Runs the Docusaurus CLI in `docs/` and exits with it, passing on the signals that stop this process
 * @param args - The command and its flags
 */
function docusaurus(args: string[]): void {
  const child = spawn(process.execPath, [DOCUSAURUS, ...args, ...flags], { cwd: SITE, env, stdio: 'inherit' });

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(signal, () => child.kill(signal));
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

/**
 * Exits with 1 when something already listens on the port. Docusaurus would print an error and exit
 * with 0, or ask in a terminal to move to another port, and a caller would talk to the wrong server.
 * @param port - The port `serve` or `dev` is about to listen on
 */
async function claimPort(port: string): Promise<void> {
  const probe = net.createServer();

  await new Promise<void>((done) => {
    probe.once('error', (error: NodeJS.ErrnoException) => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use; pick another with --port.` : error.message);
      process.exit(1);
    });
    probe.listen(Number(port), '127.0.0.1', () => probe.close(() => done()));
  });
}

/**
 * Syncs each generator again a moment after one of its sources changes
 * @param generators - The generators to watch
 * @param sync - Runs the generators it is given
 */
function watchSources(generators: readonly Generator[], sync: (only: readonly Generator[]) => Promise<void>): void {
  for (const generator of generators) {
    let timer: NodeJS.Timeout | undefined;
    const resync = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => sync([generator]).catch((error: unknown) => console.error(error)), 200);
    };

    for (const source of generator.sources) {
      const file = path.join(ROOT, source);

      if (fs.existsSync(file)) fs.watch(file, { recursive: true }, resync);
    }
  }
}

// The generators load only for the commands that sync, so `serve` and `clear` start without them
switch (command) {
  case 'sync':
    await (await import('./sync.mts')).sync();
    break;
  case 'build':
    await (await import('./sync.mts')).sync();
    docusaurus(['build', '--out-dir', outDir]);
    break;
  case 'serve':
    if (!fs.existsSync(path.join(outDir, 'index.html'))) {
      console.error(
        `No build in ${path.relative(ROOT, outDir)}; run: node docs/scripts/site.mts build${name ? ` --name ${name}` : ''}`,
      );
      process.exit(1);
    }
    await claimPort(port);
    console.log(`Serving ${path.relative(ROOT, outDir)} at ${(await servePages(outDir, Number(port))).origin}/`);
    break;
  case 'dev': {
    const { GENERATORS, sync } = await import('./sync.mts');

    await claimPort(port);
    await sync();
    watchSources(GENERATORS, sync);
    docusaurus(['start', '--port', port, '--host', '127.0.0.1', '--no-open']);
    break;
  }
  case 'clear':
    if (own) fs.rmSync(path.join(SITE, own), { recursive: true, force: true });
    else docusaurus(['clear']);
    break;
}

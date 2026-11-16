/**
 * Serves a build of the site as GitHub Pages does: a folder's `index.html`, a redirect that adds the
 * trailing slash, `404.html` with a 404, and on every file `Access-Control-Allow-Origin: *`, which the
 * frame of a live run needs to load the runtime, and `Cache-Control: max-age=600`, so a second run
 * takes the runtime from the browser's cache as it does on the site. A browser kept open across a
 * rebuild shows the old files for those ten minutes, until a hard reload. `site.mts serve`, the crawl
 * and the screenshots read builds through it.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

import { SITE } from './paths.mts';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml',
};

/** A build being served on 127.0.0.1 */
export interface PagesServer {
  /** `http://127.0.0.1:<port>` */
  readonly origin: string;
  /** The file served for a URL's path, or undefined when the path redirects or is missing */
  fileOf(pathname: string): string | undefined;
  /** Stops serving */
  close(): void;
}

/**
 * Where `docs/scripts/site.mts build` puts the site
 * @param name - The `--name` it was given; `docs/build` without one
 */
export function buildDir(name?: string): string {
  return path.join(SITE, name === undefined ? 'build' : path.join('.sites', name, 'build'));
}

/**
 * Serves a build
 * @param build - Absolute path of the build
 * @param port - The port to listen on; a free one when omitted
 */
export async function servePages(build: string, port = 0): Promise<PagesServer> {
  if (!fs.existsSync(path.join(build, 'index.html'))) {
    throw new Error(`No build in ${build}; run node packages/docs/scripts/site.mts build, with --name if it has one`);
  }

  const isFile = (file: string): boolean => fs.statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;
  const resolve = (pathname: string): { file?: string; redirect?: string } => {
    const decoded = decodeURIComponent(pathname);
    const file = path.join(build, decoded);

    if (!file.startsWith(build)) return {};
    if (decoded.endsWith('/'))
      return isFile(path.join(file, 'index.html')) ? { file: path.join(file, 'index.html') } : {};
    if (isFile(file)) return { file };
    if (isFile(path.join(file, 'index.html'))) return { redirect: `${pathname}/` };
    if (isFile(`${file}.html`)) return { file: `${file}.html` };

    return {};
  };
  const server = http.createServer((request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    const { file, redirect } = resolve(pathname);

    if (redirect) {
      response.writeHead(301, { location: redirect }).end();
    } else if (file) {
      response.writeHead(200, {
        'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'max-age=600',
      });
      response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(file));
    } else {
      response.writeHead(404, { 'content-type': TYPES['.html']! });
      response.end(fs.readFileSync(path.join(build, '404.html')));
    }
  });

  await new Promise<void>((done, fail) => server.once('error', fail).listen(port, '127.0.0.1', done));

  return {
    origin: `http://127.0.0.1:${(server.address() as { port: number }).port}`,
    fileOf: (pathname) => resolve(pathname).file,
    close: () => server.close(),
  };
}

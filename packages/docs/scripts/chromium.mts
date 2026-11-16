import type { LaunchOptions, Page } from 'playwright';

/**
 * How the crawl and the screenshots launch Chromium: with the GPU on and WebGPU allowed.
 * `CHROMIUM_CHANNEL` picks an installed browser, such as `chrome` on a CI runner that ships one, and
 * `CHROMIUM_ARGS` swaps the flags for a runner with no GPU:
 * `--use-angle=swiftshader --use-webgpu-adapter=swiftshader --enable-unsafe-webgpu`.
 */
export function chromiumLaunchOptions(): Pick<LaunchOptions, 'channel' | 'args'> {
  return {
    channel: process.env.CHROMIUM_CHANNEL || undefined,
    args: process.env.CHROMIUM_ARGS?.split(' ') ?? ['--enable-gpu', '--enable-unsafe-webgpu'],
  };
}

/**
 * Reports every error a page shows: a console error, an uncaught exception, a request that failed and
 * a response of 400 or more. A request the page or a navigation cancelled, `net::ERR_ABORTED`, is none.
 * @param page - The page to watch
 * @param report - Called with each error as a line of text, and the URL it is about: the request's, or
 *   for a console error the script or resource that logged it
 */
export function watchPageErrors(page: Page, report: (error: string, url: string | undefined) => void): void {
  page.on('console', (message) => {
    if (message.type() === 'error') report(`console: ${message.text()}`, message.location().url || undefined);
  });
  page.on('pageerror', (error) => report(`exception: ${error.message}`, undefined));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText;

    if (failure !== 'net::ERR_ABORTED') report(`failed: ${request.url()} ${failure}`, request.url());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) report(`${response.status()}: ${response.url()}`, response.url());
  });
}

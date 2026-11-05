/**
 * The two folders every script and plugin of the site resolves paths against. They come from
 * `import.meta.url`, which jiti, the loader of the Docusaurus config and its plugins, also provides.
 */
import { fileURLToPath } from 'node:url';

/** The repo root; `DOCS_ROOT` points the generators at another, as their tests do with a fixture */
export const ROOT = process.env.DOCS_ROOT ?? fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');

/** The site's folder, `docs/` */
export const SITE = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');

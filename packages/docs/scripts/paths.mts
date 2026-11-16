/**
 * The two folders every script and plugin of the site resolves paths against. They come from
 * `import.meta.url`, which jiti, the loader of the Docusaurus config and its plugins, also provides.
 */
import { fileURLToPath } from 'node:url';

/** The repo root; `DOCS_ROOT` points the generators at another, as their tests do with a fixture */
export const ROOT = process.env.DOCS_ROOT ?? fileURLToPath(new URL('../../..', import.meta.url)).replace(/[\\/]$/, '');

/** The sources of the packages the site documents, from the repo root, which the dev server watches */
export const PACKAGE_SOURCES: readonly string[] = ['core', '2d', '3d', 'threejs-compat'].map(
  (name) => `packages/${name}/src`,
);

/** The site's folder, `packages/docs/` */
export const SITE = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, '');

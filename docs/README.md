# The docs site

The documentation site of react-pixi-fiber, on Docusaurus. It renders the repo's own sources: the guides in `src/**/__docs__`, the parity findings in `docs/feasibility.md`, the examples in `examples/` with the pictures the visual tests draw of them, and the JSDoc of the public entry. Nothing is copied by hand. It is built the way [@pixi/layout's site](https://layout.pixijs.io) is, and keeps its design tokens and components.

## Run it

```sh
npm run docs:dev      # dev server on http://127.0.0.1:3000
npm run docs:build    # build into docs/build
npm run docs:serve    # serve that build on http://127.0.0.1:3000
```

Each goes through `docs/scripts/site.mts`, which needs Node 24 and syncs the generated content first. Pass `--name <name>` to give a run its own build and Docusaurus files in `docs/.sites/<name>/`, and `--port <port>` to listen elsewhere, so several builds and servers can run at once; `serve` and `dev` exit with 1 when the port is taken. `serve` answers as GitHub Pages does, through `docs/scripts/pages.mts`, which the crawl and the screenshots use too. That includes its ten-minute cache, so hard-reload a browser you kept open across a rebuild:

```sh
node docs/scripts/site.mts build --name home
node docs/scripts/shoot.mts --name home --out .temp/shots / /docs/
```

`docs/scripts/shoot.mts` screenshots pages at 1440x900 and 390x844, dark and light, and fails on a console error, an exception or a failed request. It serves the build itself, as the crawl does; `--port <port>` points it at a server that is already running, such as the dev server. Look at every picture it takes: a page that loads without an error can still be laid out wrong.

## Check it

`npm run test:site` builds the site as `test` and crawls it with `docs/scripts/crawl.mts`. The crawl serves the build as GitHub Pages does, opens every page of the sitemap and every link it finds from there, the 404 page included, and fails on a console error, an exception, a failed request, or a link to a missing page, file or anchor. It answers requests to other sites itself, with nothing, so another site being slow or down never slows or fails it. It then presses "Run live" on the first example of every topic, and fails when one shows an error or draws nothing in 30 s. It warns about a page search engines index with no description or canonical URL of its own, and about a layout shift over 0.1, and prints the JavaScript and CSS each page loads, gzipped, and how long each live run took to draw. Crawl your own build with `node docs/scripts/crawl.mts --name <name>`.

Broken links in Markdown and `<Link>` already fail the build. `npm run test:docs`, part of `npm test`, checks the docs against the code (`docs/scripts/typedoc/check.mts`), lints and type-checks `docs/`, and runs the unit tests of `docs/plugins/`, `docs/scripts/typedoc/` and `docs/scripts/generators/`. `npm run test:lint` and `npm run test:types` leave `docs/` to it, so they run without the `docs` workspace installed. The check fails on:

- a public name of the repo's own code without JSDoc. What r3f's vendored core declares is r3f's, and isn't checked: a file is vendored when a folder on its path is named `r3f`, `vendor` or `vendored` (`isVendored` in `docs/scripts/typedoc/entries.mts`);
- a code block that names a source with `<!-- snippet: examples/<topic>/<name>.example.tsx#region -->` and differs from it (`node docs/scripts/typedoc/snippets.mts --write` brings them up to date);
- a guide `GUIDES` lists that is missing, or a guide file it doesn't list;
- parity findings in `docs/feasibility.md` that the Differences page can no longer read.

## Ship it

Nothing deploys the site yet. A build is static files in `docs/build`, served from `/` with trailing slashes, which suits GitHub Pages; `docs/links/index.ts` holds the address it is built for, `https://react-pixi-fiber.pixijs.io`, which the canonical URLs, the sitemap and `llms.txt` use.

Besides the pages, the build has what search engines and language models read: `sitemap.xml` and `robots.txt`, a canonical URL and social card tags on every page, and `llms.txt`, `llms-full.txt` and the Markdown of every docs page beside it (`/docs/tutorials/basic-animations/` has `/docs/tutorials/basic-animations.md`). A generator writes that Markdown with the page, from the same tree, into `llms/`, and `plugins/llms` puts each file at its URL and lists them.

## Where things are

- `content/` holds the pages of the docs plugin, served from `/`: `content/docs`, `content/examples` and `content/api`, one sidebar each in `sidebars.ts`.
- `scripts/generators/` has a generator per area, listed in `scripts/sync.mts`. Each returns the files of the folders it owns, and the sync writes them, removes what's stale and keeps those folders out of git. What two generators read, such as the API model or the pages of the Docs section, is built once per sync through `shared`. A page is a Markdown tree (`markdown.mts`): the repo's Markdown parsed once, beside the site's components, which `components.mts` lists with their props, their imports and how each reads as plain Markdown. What is slow to build, the live runtime and the example pictures, is kept in `node_modules/.cache/react-pixi-fiber-docs` by a hash of its inputs (`cache.mts`) and built again only when one changes. `DOCS_ROOT` points every generator at another root, which is how their tests run them on a fixture.
- The guides are Markdown that lives with the code, `src/**/__docs__/<id>.md`, listed in order in `GUIDES` (`scripts/typedoc/guides.mts`), each in a section of the sidebar: Getting started, Tutorials, Reference. `scripts/generators/content.mts` writes a page for each at `/docs/<section>/<id>/`, the introduction at `/docs/`, and an overview per section; `content/sidebar.mts` says which pages there are, and `content/mdx.mts` wires a guide into the site: links to other guides, the first mention of a public name in each section linked to its API page, GitHub alerts as admonitions, and a snippet followed by its example's picture as a live `<Example>`. A guide's `npm install` block becomes a tab per package manager.
- The Differences page is `src/__docs__/differences.md` followed by the parity findings of `docs/feasibility.md`, which `scripts/generators/content/parity.mts` reads: the levels of the verdict (section 1), every row of the parity matrix with its class (section 4), and the major blockers (section 5). Edit the findings and the page follows.
- `scripts/generators/examples.mts` writes the Examples section from `examples/<topic>/<name>.example.ts(x)`, zero or more of them: the gallery at `/examples/` (filters in its query: `?topic=<topic>`, `?q=text`) and a page per example at `/examples/<topic>/<name>/`. A topic named like a guide takes its title and links it. An example's title is the `title` string of its `example` object, else the heading of the guide section that first shows its code, else its file name in words; its description is the prose that brings it in, else the object's `description`, else the JSDoc above `export const example`. Its picture is the visual harness's reference image, `tests/snapshots/docs/<topic>/<name>.webgl.png`, which it writes to `static/example-pictures` and, cropped to what it draws, to `static/example-thumbs`, as lossless WebP, with the PNG beside it for the card a shared link shows. An example with no picture yet gets a placeholder card. `src/components/Examples` draws the gallery and the parts of an example page.
- `src/components/Example` is the `<Example>` of every MDX page, with `plugins/example` giving it the example's code, picture and program. It runs live on the parts in `src/components/Live`, with the runtime that `scripts/generators/live.mts` builds into `static/runtime`: ES modules of react-pixi-fiber (from its entry in `src`), @pixi/3d (from `.repos/pixi-3d`), pixi.js, React and React DOM. A run is a sandboxed iframe that imports the example and mounts it with `src/components/Live/frame/mount.tsx`: the `example.render()` inside a `<Canvas>`, or the `<Canvas>` it returns, asking pixi for the reader's renderer through the `renderer` prop. That mount and the visual harness must agree on what an example exports; change both together. Editing an example in the page is the next seam: layout's site does it with Monaco, and `ExampleSource.program` and `focus` are what an editor shows.
- `scripts/generators/api.mts` writes the API reference from the JSDoc of the entry, `src/index.tsx` or `src/index.ts`, which `scripts/typedoc/api.mts` reads with oxc, following `export *`, relative imports and the root `tsconfig.json`'s paths into the repo's own files (one into `.repos` or `node_modules` names another package and isn't followed). `src/components/Api` draws its signatures, with each name linked to its page, and its fields. A name from r3f's vendored core is marked "From react-three-fiber" and links r3f's docs. Its routes are stable, so other pages link to them, and `apiLinks` in `scripts/generators/api/model.mts` maps every name to its route:
  - `/api/react-pixi-fiber/`, the entry's overview;
  - `/api/react-pixi-fiber/<kind>/<Name>/`, where `<kind>` is `functions`, `classes`, `constants`, `enums`, `interfaces` or `types`. A const counts as a function when its type is a function, or names a type alias or an interface with a call signature (`useFrame: UseFrame`), and its page shows that call signature: `/api/react-pixi-fiber/functions/useFrame/`. A module the entry imports with `import type * as` and exports, as `ReactThreeFiber` is, counts as a type: its JSDoc is the block directly above the module's first line, and its members are the types the module exports;
  - `#<member>`, a member by its name as written.

  A page's "Used in" lists the sections of the Docs pages that link it, read from the pages the content generator builds, and the examples that import it.

- `src/pages/index.tsx` is the home page, with its parts in `src/components/Home`. The hero's pictures, `static/img/hero-pixi.png` and `hero-three.png`, are the scene it shows rendered once by pixi-3d through react-pixi-fiber and once by three.js, by the visual harness: a scratch scene with the hero's JSX at 960 by 720 (run with a viewport that fits it), its `webgl` and `three` captures put on the hero's `#111111`. Render them again when either renderer's picture of it changes.
- `src/css/tokens.css` has the design tokens, and `src/css/custom.css` maps them onto Infima.
- Search is `@easyops-cn/docusaurus-search-local`, set up in `docusaurus.config.ts` to index headings and prose but not code or the example pages. `src/theme/SearchBar` and `src/theme/SearchPage` are ejected: the site's own box, which keeps focus where the reader puts it, and its own page, with places to start before anything is typed. Both import the plugin's worker, result rows and CSS by file path (typed in `src/search-plugin.d.ts`), so the plugin is pinned to an exact version in `package.json`: on an upgrade, check both against the plugin's own SearchBar and SearchPage.

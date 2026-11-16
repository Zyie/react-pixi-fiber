/**
 * Writes the current docs into the build for language models and the tools that feed them
 * (https://llmstxt.org):
 *
 * - `llms.txt` lists every page by sidebar and category, each linking to its Markdown;
 * - `<page>.md` is the Markdown of one page, next to its folder: `/docs/guides/flow/` has `/docs/guides/flow.md`,
 *   which the page names in a `<link rel="alternate" type="text/markdown">`;
 * - `llms-full.txt` is every page in one file, in the same order.
 *
 * The Markdown of a page is written with the page, by its generator (`writePage` in
 * docs/scripts/generators/markdown.mts), into `llms/`. The plugin puts each file where its page says
 * it is, and lists them.
 */
import fs from 'node:fs';
import path from 'node:path';

import type { DocMetadata, LoadedContent, LoadedVersion } from '@docusaurus/plugin-content-docs';
import type { LoadContext, Plugin } from '@docusaurus/types';

import { markdownFile, markdownRoute } from './paths.mts';

type SidebarItem = LoadedVersion['sidebars'][string][number];

/**
 * The label the navbar gives each sidebar
 * @param context - The site
 */
function sidebarLabels(context: LoadContext): Map<string, string> {
  const navbar = context.siteConfig.themeConfig.navbar as { items?: { sidebarId?: string; label?: string }[] };

  return new Map(
    (navbar.items ?? []).flatMap((item) => (item.sidebarId && item.label ? [[item.sidebarId, item.label]] : [])),
  );
}

/**
 * The plugin
 * @param context - The site
 */
export function llms(context: LoadContext): Plugin {
  let version: LoadedVersion | undefined;

  return {
    name: 'llms',
    allContentLoaded({ allContent }) {
      const docs = allContent['docusaurus-plugin-content-docs']?.default as LoadedContent | undefined;

      version = docs?.loadedVersions.find((candidate) => candidate.isLast);
    },
    postBuild({ outDir }) {
      if (!version) throw new Error('llms: the docs plugin has no current version');

      const { siteConfig, siteDir } = context;
      const site = siteConfig.url;
      const route = (doc: DocMetadata): string =>
        siteConfig.trailingSlash && !doc.permalink.endsWith('/') ? `${doc.permalink}/` : doc.permalink;
      const byId = new Map(version.docs.map((doc) => [doc.id, doc]));
      const header = [
        `# ${siteConfig.title}`,
        `> ${siteConfig.tagline}`,
        `The documentation of react-pixi-fiber, from ${site}/. It keeps react-three-fiber's API and renders with pixi-3d, so an r3f app swaps its import. Install it with \`${String(siteConfig.customFields?.install)}\`.`,
      ];
      const index = [
        header.join('\n\n'),
        '',
        'Each link is the Markdown of one page; llms-full.txt has every page in one file.',
      ];
      const full = [header.join('\n\n')];
      const listed = new Set<string>();
      const write = (file: string, text: string): void => {
        const target = path.join(outDir, file);

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, text);
      };
      const markdownOf = (doc: DocMetadata): string => {
        const file = path.join(siteDir, markdownFile(doc.source.replace(/^@site\//, '')));

        if (!fs.existsSync(file)) {
          throw new Error(`llms: ${doc.source} has no Markdown at ${file}; a generator writes both with writePage`);
        }

        const markdown = fs.readFileSync(file, 'utf8');

        if (!markdown.includes(`\nSource: ${site}${route(doc)}\n`)) {
          throw new Error(`llms: ${file} doesn't say it is the page at ${route(doc)}`);
        }

        return markdown;
      };
      const add = (id: string): void => {
        const doc = byId.get(id);

        if (!doc || doc.unlisted || listed.has(id)) return;

        const markdown = markdownOf(doc);
        const description = doc.description.replace(/\s+/g, ' ').trim();

        listed.add(id);
        write(markdownRoute(route(doc)), markdown);
        full.push(markdown.trim());
        index.push(`- [${doc.title}](${site}${markdownRoute(route(doc))})${description ? `: ${description}` : ''}`);
      };
      const walk = (items: readonly SidebarItem[], depth: number): void => {
        for (const item of items) {
          if (item.type === 'doc') add(item.id);
          else if (item.type === 'category') {
            index.push('', `${'#'.repeat(Math.min(depth + 3, 6))} ${item.label}`, '');
            if (item.link?.type === 'doc') add(item.link.id);
            walk(item.items, depth + 1);
          }
        }
      };
      const labels = sidebarLabels(context);

      for (const [id, sidebar] of Object.entries(version.sidebars)) {
        index.push('', `## ${labels.get(id) ?? id}`, '');
        walk(sidebar, 0);
      }
      index.push(
        '',
        '## Optional',
        '',
        `- [Every page in one file](${site}/llms-full.txt)`,
        `- [Source code](https://github.com/${siteConfig.organizationName}/${siteConfig.projectName})`,
      );

      write('llms.txt', `${index.join('\n').replace(/\n{3,}/g, '\n\n')}\n`);
      write('llms-full.txt', `${full.join('\n\n---\n\n')}\n`);
    },
  };
}

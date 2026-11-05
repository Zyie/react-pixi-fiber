/**
 * Where the Markdown of a page for language models is: the file its generator writes it to, and the
 * path the site serves it at. The generators and the plugin both read them here, so they can't disagree.
 */

/**
 * Where the Markdown of a page is served: `/docs/guides/flow/` at `/docs/guides/flow.md`
 * @param route - The page's URL from the site's root
 */
export function markdownRoute(route: string): string {
  return `${route.replace(/\/$/, '') || '/index'}.md`;
}

/**
 * The file a generator writes a page's Markdown to, from `docs/`: `llms/docs/guides/flow.md` for
 * `content/docs/guides/flow.mdx`
 * @param output - The page's MDX file, from `docs/`
 */
export function markdownFile(output: string): string {
  return output.replace(/^content\//, 'llms/').replace(/\.mdx$/, '.md');
}

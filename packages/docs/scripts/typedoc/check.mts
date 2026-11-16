/**
 * Checks the docs against the code they describe: `node docs/scripts/typedoc/check.mts`, run by `npm run
 * test:docs`. The site in `docs/` renders the same sources.
 *
 * It fails, listing each, on a public name of the repo's own code without docs (`undocumented`; what is
 * vendored from r3f is its authors'), a code block of a doc that differs from the source its marker
 * names (snippets.mts), a guide of `GUIDES` whose file is missing, a guide file that `GUIDES` doesn't
 * list, and parity findings in docs/feasibility.md that the Differences page can no longer read.
 */
import fs from 'node:fs';
import path from 'node:path';

import { readParity } from '../generators/content/parity.mts';
import type { ApiEntry } from './api.mts';
import { collectAll, undocumented } from './api.mts';
import { guideListProblems, GUIDES } from './guides.mts';
import { docFiles, guideFiles, ROOT, syncSnippets } from './snippets.mts';

/**
 * Every problem that fails the docs, one line each
 * @param root - The repo root
 * @param apis - The API of every entry, from `collectAll`
 */
export function checkDocs(root: string, apis: readonly ApiEntry[]): string[] {
  const problems = apis.flatMap(undocumented);

  for (const doc of docFiles(root)) {
    const text = fs.readFileSync(path.join(root, doc), 'utf8');
    const synced = syncSnippets(text, doc, root);

    problems.push(...synced.problems.map(({ line, message }) => `${doc}:${line}: ${message}`));
    if (synced.text !== text) {
      problems.push(
        `${doc}: a code block differs from its source; run node packages/docs/scripts/typedoc/snippets.mts --write`,
      );
    }
  }
  for (const guide of GUIDES) {
    if (!fs.existsSync(path.join(root, guide.file))) {
      problems.push(`${guide.file}: missing, and GUIDES lists it as the guide ${guide.id}`);
    }
  }
  for (const file of guideFiles(root)) {
    if (!GUIDES.some((guide) => guide.file === file)) {
      problems.push(
        `${file}: a guide that GUIDES in packages/docs/scripts/typedoc/guides.mts doesn't list, so the site leaves it out`,
      );
    }
  }
  if (fs.existsSync(path.join(root, 'README.md'))) {
    problems.push(...guideListProblems('README.md', fs.readFileSync(path.join(root, 'README.md'), 'utf8')));
  }
  try {
    readParity(root);
  } catch (error) {
    problems.push((error as Error).message);
  }

  return problems;
}

if (import.meta.main) {
  const problems = checkDocs(ROOT, collectAll(ROOT));

  for (const problem of problems) console.error(problem);
  if (problems.length > 0) {
    console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'} in the docs`);
    process.exit(1);
  }
}

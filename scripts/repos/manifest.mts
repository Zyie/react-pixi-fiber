/** A read-only reference repository that `npm run sync:repos` checks out into `.repos/<name>` */
export interface ReferenceRepo {
  /** Folder name under `.repos/` */
  name: string;
  /** Git URL to clone from */
  repository: string;
  /**
   * The commit to check out: a branch, a tag, a full commit sha, or `{ npm }` to follow the installed
   * version of that package
   */
  ref: string | { npm: string };
}

/** Every repository in `.repos/`; `npm run sync:repos` deletes folders that aren't listed here */
export const referenceRepos: ReferenceRepo[] = [
  // The commit src/r3f forks; `scripts/r3f/fork.mts` diffs the fork against it
  {
    name: 'react-three-fiber',
    repository: 'https://github.com/pmndrs/react-three-fiber.git',
    ref: '58acabc0fc996bac5a25320ca3a8670bdd209db7',
  },
  { name: 'pixi-3d', repository: 'https://github.com/pixijs/3d.git', ref: { npm: '@pixi/3d' } },
  { name: 'pixijs', repository: 'https://github.com/pixijs/pixijs.git', ref: { npm: 'pixi.js' } },
];

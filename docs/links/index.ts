/** The addresses the site links: its own, the repo's and the community's, for the config, the generators and the pages */

/** The site's address, with no trailing slash */
export const SITE_URL = 'https://react-pixi-fiber.pixijs.io';

/** The repo on GitHub */
export const REPO = 'https://github.com/pixijs/react-pixi-fiber';

/** The PixiJS Discord */
export const DISCORD = 'https://discord.gg/QrnxmQUPGV';

/** react-three-fiber's own docs, which the reference points to for the API it keeps */
export const R3F_DOCS = 'https://r3f.docs.pmnd.rs';

/** react-three-fiber on GitHub, at the branch the core is forked from */
export const R3F_REPO = 'https://github.com/pmndrs/react-three-fiber/tree/v10';

/** pixi-3d on GitHub, the renderer */
export const PIXI3D_REPO = 'https://github.com/pixijs/3d';

/**
 * A file of the repo on GitHub
 * @param file - Its path from the repo root, with an anchor if any
 */
export const blobUrl = (file: string): string => `${REPO}/blob/main/${file}`;

/**
 * The page that edits a file of the repo on GitHub
 * @param file - Its path from the repo root
 */
export const editUrl = (file: string): string => `${REPO}/edit/main/${file}`;

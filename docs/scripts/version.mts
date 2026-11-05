/** The version of react-pixi-fiber the docs describe, and how an install names it */
import fs from 'node:fs';

/** The version in the root package.json */
export const VERSION = (
  JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string }
).version;

/** The package's name on npm */
export const PACKAGE = 'react-pixi-fiber';

/**
 * Whether the docs describe a version npm has no release of yet: a prerelease, or 0.0.0 before the
 * first one, which an install has to name exactly
 */
export const PRERELEASE = VERSION.includes('-') || VERSION === '0.0.0';

/**
 * An install command as it works today: while the version is a prerelease, the package is named at that
 * version, which `react-pixi-fiber` alone doesn't install
 * @param text - The command
 */
export function installable(text: string): string {
  return PRERELEASE && VERSION !== '0.0.0'
    ? text.replace(/(?<![\w/@-])react-pixi-fiber(?:@[\w.-]+)?(?=[\s`]|$)/g, `${PACKAGE}@${VERSION}`)
    : text;
}

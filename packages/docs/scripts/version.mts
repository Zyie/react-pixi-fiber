/** The version of the packages the docs describe, and how an install names them */
import fs from 'node:fs';

/** The version in the root package.json */
export const VERSION = (
  JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')) as { version: string }
).version;

/**
 * Whether the docs describe a version npm has no release of yet: a prerelease, or 0.0.0 before the
 * first one, which an install has to name exactly
 */
export const PRERELEASE = VERSION.includes('-') || VERSION === '0.0.0';

/**
 * An install command as it works today: while the version is a prerelease, each package is named at that
 * version, which `@react-fiber/core` alone doesn't install
 * @param text - The command
 */
export function installable(text: string): string {
  return PRERELEASE && VERSION !== '0.0.0'
    ? text.replace(/(?<![\w/@-])(@react-fiber\/[\w-]+)(?:@[\w.-]+)?(?=[\s`]|$)/g, `$1@${VERSION}`)
    : text;
}

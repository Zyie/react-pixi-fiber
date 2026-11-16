import { defineConfig } from 'oxfmt';

export default defineConfig({
  // packages/r3f is a fork of r3f's source kept in r3f's own format, so its diff against upstream stays minimal.
  ignorePatterns: ['.claude/**', 'packages/r3f/**'],
  printWidth: 120,
  singleQuote: true,
  sortImports: {},
});

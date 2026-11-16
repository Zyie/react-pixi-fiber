import { defineConfig } from 'oxfmt';

export default defineConfig({
  // src/r3f is a fork of r3f's source kept in r3f's own format, so its diff against upstream stays minimal.
  ignorePatterns: ['.claude/**', 'src/r3f/**'],
  printWidth: 120,
  singleQuote: true,
  sortImports: {},
});

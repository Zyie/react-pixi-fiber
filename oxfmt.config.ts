import { defineConfig } from 'oxfmt';

export default defineConfig({
  // spike/r3f is r3f source copied byte-for-byte; formatting it would break the diff check.
  ignorePatterns: ['.claude/**', 'spike/**'],
  printWidth: 120,
  singleQuote: true,
  sortImports: {},
});

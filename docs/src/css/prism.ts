import type { PrismTheme } from 'prism-react-renderer';

/**
 * A colour of `--layout-code-*` in tokens.css
 * @param name - The token's name after the prefix
 */
const code = (name: string): string => `var(--layout-code-${name})`;

/**
 * The syntax theme of every code block, in both colour modes: its colours are the `--layout-code-*`
 * tokens, which tokens.css sets per mode, so a mode switch repaints no token and the server-rendered
 * HTML is right for either mode
 */
export const prismTheme: PrismTheme = {
  plain: { color: code('text'), backgroundColor: code('bg') },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: code('comment'), fontStyle: 'italic' } },
    {
      types: ['punctuation', 'template-punctuation', 'interpolation-punctuation'],
      style: { color: code('punctuation') },
    },
    { types: ['keyword', 'selector', 'important', 'atrule', 'rule', 'module'], style: { color: code('keyword') } },
    {
      types: ['string', 'template-string', 'char', 'attr-value', 'regex', 'url', 'inserted'],
      style: { color: code('string') },
    },
    { types: ['number', 'boolean', 'constant', 'symbol', 'unit', 'hexcode'], style: { color: code('number') } },
    { types: ['function', 'function-variable', 'method'], style: { color: code('function') } },
    { types: ['class-name', 'maybe-class-name', 'builtin', 'namespace'], style: { color: code('type') } },
    {
      types: ['property', 'literal-property', 'property-access', 'attr-name', 'key'],
      style: { color: code('property') },
    },
    { types: ['tag'], style: { color: code('tag') } },
    { types: ['operator', 'arrow', 'spread', 'entity'], style: { color: code('operator') } },
    { types: ['deleted'], style: { color: code('deleted') } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
    { types: ['bold', 'important'], style: { fontWeight: 'bold' } },
  ],
};

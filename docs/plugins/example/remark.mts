/**
 * Lets MDX write `<Example file="examples/<topic>/<name>.example.tsx" region="card" />` and nothing more.
 * The plugin checks the file exists and gives the element a `source` prop that requires the file
 * through `loader.mts`, so the bundler tracks the example and its picture, and a page rebuilds when
 * either changes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT } from '../../scripts/paths.mts';

const LOADER = fileURLToPath(new URL('./loader.mts', import.meta.url));

interface MdxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

interface MdxNode {
  type: string;
  name?: string | null;
  attributes?: MdxAttribute[];
  children?: MdxNode[];
  position?: { start: { line: number } };
}

/**
 * The value of a string attribute of an element
 * @param node - The element
 * @param name - The attribute's name
 * @param where - The element's file and line, for the error
 */
function stringAttribute(node: MdxNode, name: string, where: string): string | undefined {
  const attribute = node.attributes?.find(
    (candidate) => candidate.type === 'mdxJsxAttribute' && candidate.name === name,
  );

  if (attribute === undefined) return undefined;
  if (typeof attribute.value !== 'string')
    throw new Error(`${where}: <Example ${name}> takes a string, such as ${name}="..."`);

  return attribute.value;
}

/**
 * The attribute value `{require(request).default}`, with the estree MDX compiles it from
 * @param request - The module request
 */
function requireDefault(request: string): object {
  const value = `require(${JSON.stringify(request)}).default`;
  const call = {
    type: 'CallExpression',
    callee: { type: 'Identifier', name: 'require' },
    arguments: [{ type: 'Literal', value: request, raw: JSON.stringify(request) }],
    optional: false,
  };
  const expression = {
    type: 'MemberExpression',
    object: call,
    property: { type: 'Identifier', name: 'default' },
    computed: false,
    optional: false,
  };

  return {
    type: 'mdxJsxAttributeValueExpression',
    value,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        comments: [],
        body: [{ type: 'ExpressionStatement', expression }],
      },
    },
  };
}

/** The remark plugin, for the `remarkPlugins` of the docs and pages plugins */
export function remarkExample() {
  return (tree: MdxNode, vfile: { path?: string }): void => {
    const visit = (node: MdxNode): void => {
      if ((node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') && node.name === 'Example') {
        const where = `${vfile.path ?? 'MDX'}:${node.position?.start.line ?? 0}`;
        const file = stringAttribute(node, 'file', where);
        const region = stringAttribute(node, 'region', where);

        if (!file || !fs.existsSync(path.join(ROOT, file))) {
          throw new Error(
            `${where}: <Example file="${file ?? ''}"> needs a file from the repo root, such as examples/<topic>/<name>.example.tsx`,
          );
        }

        const query = region ? `?${new URLSearchParams({ region })}` : '';

        node.attributes!.push({
          type: 'mdxJsxAttribute',
          name: 'source',
          value: requireDefault(`!!${LOADER}${query}!${path.join(ROOT, file)}`),
        });
      }
      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

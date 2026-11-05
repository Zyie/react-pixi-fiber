/**
 * Reads the public API of a package entry out of its hand-written barrel and the JSDoc of what it
 * exports. The repo's TypeScript 7 has no compiler API and typedoc isn't installed, so the source is
 * parsed with oxc (`parseSync` from `rolldown/utils`), which keeps comments and TypeScript syntax.
 * What the reference shows of a declaration, its parameters, its return type and a property's flags,
 * is read off the syntax tree here, so no reader has to parse a signature again.
 */
import fs from 'node:fs';
import path from 'node:path';

import { parseSync } from 'rolldown/utils';
import type { ESTree, ParseResult } from 'rolldown/utils';

import { ENTRIES, entryFile, isVendored } from './entries.mts';
import type { Entry } from './entries.mts';
import { afterDelimiters, lineText, parseParam, tagNames } from './jsdoc.mts';

/** What a public name declares */
export type ApiKind = 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum';

/**
 * One tag of a JSDoc block: `@param node - A Container` is `{ tag: 'param', text: 'node - A Container',
 * type: null, name: 'node', description: 'A Container' }`
 */
export interface ApiTag {
  readonly tag: string;
  /** Everything after the tag's name */
  readonly text: string;
  /** The `{Type}` the text opens with, as in `@throws {RangeError} When...`; null when it has none */
  readonly type: string | null;
  /** The name a `@param` tag documents, `[name=default]` read as `name`; null for any other tag */
  readonly name: string | null;
  /** The text after the type and the name, and the `-` between them and it */
  readonly description: string;
}

/** A JSDoc block, split into its description and its tags */
export interface ApiDoc {
  /** The prose before the first tag, trimmed; empty when there is none */
  readonly description: string;
  /** Every tag, in source order. An `@example` keeps its code fence in `text` */
  readonly tags: readonly ApiTag[];
}

/** A parameter of a function, a method or a function type */
export interface ApiParameter {
  /** Its name; a rest parameter's without `...`, and a destructured one's pattern as written */
  readonly name: string;
  /** Its type on one line; null when the declaration doesn't write one */
  readonly type: string | null;
  /** Whether a call may leave it out: it is marked `?` or has a default */
  readonly optional: boolean;
}

/** The parameters and return type of something callable, as its declaration writes them */
export interface ApiCallable {
  readonly parameters: readonly ApiParameter[];
  /** The return type on one line; null when the declaration doesn't write one */
  readonly returns: string | null;
}

/** A property as a list of fields shows it */
export interface ApiField {
  readonly optional: boolean;
  /** Whether it can only be read: `readonly`, or a getter with no setter */
  readonly readonly: boolean;
  /** Its type on one line; null when the declaration gives only a value */
  readonly type: string | null;
  /** The literal a class field starts with, when it has no type to show instead */
  readonly value: string | null;
}

/**
 * The section of a page a member is listed in: a constructor, a property (a field, an accessor or an
 * index signature) or a method (a method, or a call or construct signature)
 */
export type ApiMemberKind = 'constructor' | 'property' | 'method';

/** A public member of an exported class or interface */
export interface ApiMember {
  readonly name: string;
  readonly kind: ApiMemberKind;
  /** Its declaration as written, without a body: `flush(): void`, `readonly enabled: boolean` */
  readonly signature: string;
  /** Its JSDoc; null when it has none */
  readonly doc: ApiDoc | null;
  /** What a call of it takes and returns: a method's, a getter's, or a function-typed property's */
  readonly callable: ApiCallable | null;
  /** How a property shows as a field; null for a constructor or a method */
  readonly field: ApiField | null;
}

/** One name a package entry exports */
export interface ApiSymbol {
  readonly name: string;
  readonly kind: ApiKind;
  /** Whether the entry exports it with `export type` */
  readonly typeOnly: boolean;
  /** The declaration as written, without a function body and without class or interface members */
  readonly signature: string;
  /** Its JSDoc; null when it has none */
  readonly doc: ApiDoc | null;
  /** Public members of a class or interface, in source order; empty for other kinds */
  readonly members: readonly ApiMember[];
  /**
   * What a call of it takes and returns, for a function (its first overload), a const that holds a
   * function and a type that is one; null otherwise
   */
  readonly callable: ApiCallable | null;
  /** Whether a call of it works: a function, or a const whose value or type is callable */
  readonly calls: boolean;
  /** Where it is declared, from the repo root: `src/core/LayoutCore.ts:1411` */
  readonly source: string;
}

/** The public API of one package entry */
export interface ApiEntry {
  readonly entry: Entry;
  /** Every name the entry's barrel exports, by name */
  readonly symbols: readonly ApiSymbol[];
  /**
   * The interfaces the entry adds to through `declare global` and `declare module` blocks of the files
   * it re-exports with `export *`, named by their namespace or module, with only their public members
   */
  readonly augments: readonly ApiSymbol[];
  /**
   * What the barrel exports that can't be followed to a declaration, and so has no docs to check: a
   * name from a package or a default import, `default`, a destructured `export const { a }` by its
   * pattern, an `export * as ns` by its name, and an `export * from 'pkg'` as `* from 'pkg'`
   */
  readonly unresolved: readonly string[];
  /** The file each name of `unresolved` is exported from, from the repo root */
  readonly unresolvedFrom: ReadonlyMap<string, string>;
}

/** Tags that keep a declaration out of the public API */
const HIDDEN = new Set(['internal', 'ignore', 'private']);

/** The `{Type}` a tag's text may open with; `{@link ...}` is a link, not a type */
const TAG_TYPE = /^\{(?!@)([^}]*)\}\s*/;

/**
 * A tag split into its type, its name and its description
 * @param tag - The tag's name
 * @param text - Its text
 */
function tagOf(tag: string, text: string): ApiTag {
  if (tag === 'param') {
    const line = `@param ${text}`;
    const param = parseParam(line);
    const type = TAG_TYPE.exec(text)?.[1] ?? null;

    if (param) {
      const description = param.descriptionStart < 0 ? '' : line.slice(param.descriptionStart);

      return { tag, text, type, name: param.name, description: description.replace(/^-\s*/, '').trim() };
    }
  }

  const type = TAG_TYPE.exec(text);

  return { tag, text, type: type?.[1] ?? null, name: null, description: type ? text.slice(type[0].length) : text };
}

/**
 * Splits the text of a JSDoc block, as the parser gives it between `/**` and `*\/`, into its parts
 * @param comment - The comment's text without its delimiters
 */
export function parseDoc(comment: string): ApiDoc {
  const lines = afterDelimiters(`*${comment}`).map(lineText);
  const names = tagNames(lines);
  const description: string[] = [];
  const tags: { tag: string; lines: string[] }[] = [];

  lines.forEach((line, i) => {
    const tag = names[i];

    if (tag)
      tags.push({
        tag,
        lines: [
          line
            .trimStart()
            .slice(tag.length + 1)
            .trimStart(),
        ],
      });
    else (tags.at(-1)?.lines ?? description).push(line);
  });

  return {
    description: description.join('\n').trim(),
    tags: tags.map(({ tag, lines: text }) => tagOf(tag, text.join('\n').trim())),
  };
}

/** A file under the repo root, parsed */
interface SourceFile {
  /** Its path from the repo root, with `/` */
  readonly path: string;
  readonly text: string;
  readonly program: ESTree.Program;
  /** Every comment, in source order */
  readonly comments: ParseResult['comments'];
}

/** A declaration that can carry a public name */
type Declaration =
  | ESTree.Function
  | ESTree.Class
  | ESTree.TSInterfaceDeclaration
  | ESTree.TSTypeAliasDeclaration
  | ESTree.TSEnumDeclaration
  | ESTree.VariableDeclaration;

/** A declaration of a name, with the file it is in */
interface Declared {
  readonly file: SourceFile;
  readonly node: Declaration;
  /** Where its JSDoc ends: before its `export` keyword when it has one */
  readonly docAt: number;
}

/**
 * What one barrel or module exports: every declaration behind each name. An empty list is an export
 * that can't be followed, keyed as `ApiEntry.unresolved` lists it.
 */
type Exports = Map<string, readonly Declared[]>;

/** Files and export maps of one run of `collectEntry`, keyed by path from the root */
interface Collector {
  readonly root: string;
  readonly files: Map<string, SourceFile>;
  readonly exports: Map<string, Exports>;
  /** The path mappings of the root tsconfig.json that lead into the repo's own files */
  readonly paths: readonly PathMapping[];
  /** The file each export that can't be followed is exported from, by its key */
  readonly unresolvedFrom: Map<string, string>;
}

/** A pattern of `compilerOptions.paths`, such as `~/*` or `#types`, and the files it maps to */
interface PathMapping {
  readonly pattern: string;
  readonly targets: readonly string[];
}

/**
 * The path mappings of the root tsconfig.json that lead into the repo's own files, so `#types` or `~/x`
 * is followed as a relative import is. One that leads into `.repos` or `node_modules`, such as
 * `@pixi/3d`, names another package, which the reference doesn't follow.
 * @param root - The repo root
 */
function pathMappings(root: string): PathMapping[] {
  const file = path.join(root, 'tsconfig.json');

  if (!fs.existsSync(file)) return [];

  // tsconfig.json is JSON with comments and trailing commas
  const text = fs
    .readFileSync(file, 'utf8')
    .replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_, string?: string) => string ?? '')
    .replace(/,(\s*[}\]])/g, '$1');
  const paths = (JSON.parse(text) as { compilerOptions?: { paths?: Record<string, string[]> } }).compilerOptions?.paths;

  return Object.entries(paths ?? {}).flatMap(([pattern, targets]) => {
    const own = targets
      .map((target) => path.posix.normalize(target.replace(/^\.\//, '')))
      .filter((target) => !/(^|\/)(\.repos|node_modules)\//.test(target));

    return own.length > 0 ? [{ pattern, targets: own }] : [];
  });
}

/**
 * Parses a file once per run
 * @param collector - The run
 * @param file - Its path from the repo root
 */
function sourceFile(collector: Collector, file: string): SourceFile {
  const cached = collector.files.get(file);

  if (cached) return cached;

  const text = fs.readFileSync(path.join(collector.root, file), 'utf8');
  const lang = file.endsWith('.d.ts') ? 'dts' : file.endsWith('x') ? 'tsx' : 'ts';
  const result = parseSync(file, text, { lang });
  const error = result.errors.find((problem) => problem.severity === 'Error');

  if (error) throw new Error(`${file}: ${error.message}`);

  const parsed = { path: file, text, program: result.program, comments: result.comments };

  collector.files.set(file, parsed);

  return parsed;
}

/**
 * The file a relative import names, or null for a package
 * @param collector - The run
 * @param from - The importing file
 * @param specifier - What it imports
 */
function resolveImport(collector: Collector, from: SourceFile, specifier: string): SourceFile | null {
  let base: string;

  if (specifier.startsWith('.')) base = path.posix.join(path.posix.dirname(from.path), specifier);
  else {
    const mapped = collector.paths.flatMap(({ pattern, targets }) => {
      const star = pattern.indexOf('*');
      const matches =
        star < 0
          ? specifier === pattern
          : specifier.startsWith(pattern.slice(0, star)) && specifier.endsWith(pattern.slice(star + 1));
      const rest = star < 0 ? '' : specifier.slice(star, specifier.length - (pattern.length - star - 1));

      return matches ? targets.map((target) => target.replace('*', rest)) : [];
    });

    if (mapped.length === 0) return null;
    base = mapped[0]!.replace(/\.(?:[cm]?[jt]sx?)$/, '');
  }

  base = base.replace(/\.js$/, '');

  const candidates = ['', '.ts', '.tsx', '.mts', '.d.ts', '/index.ts', '/index.tsx', '/index.d.ts'].map(
    (suffix) => base + suffix,
  );
  const found = candidates.find((file) =>
    fs.statSync(path.join(collector.root, file), { throwIfNoEntry: false })?.isFile(),
  );

  if (!found) throw new Error(`${from.path}: can't resolve ${specifier}`);

  return sourceFile(collector, found);
}

/**
 * The name an export or import specifier uses
 * @param name - The specifier's identifier or string
 */
function nameOf(name: ESTree.ModuleExportName): string {
  return name.type === 'Literal' ? name.value : name.name;
}

/**
 * The names a declaration declares
 * @param node - The declaration
 */
function declaredNames(node: Declaration): string[] {
  if (node.type !== 'VariableDeclaration') return node.id ? [node.id.name] : [];

  return node.declarations.flatMap((declarator) => (declarator.id.type === 'Identifier' ? [declarator.id.name] : []));
}

/**
 * The declaration a statement makes, when it can carry a public name
 * @param node - The statement
 */
function asDeclaration(node: ESTree.Node | null): Declaration | null {
  switch (node?.type) {
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
    case 'ClassDeclaration':
    case 'TSInterfaceDeclaration':
    case 'TSTypeAliasDeclaration':
    case 'TSEnumDeclaration':
    case 'VariableDeclaration':
      return node;
    default:
      return null;
  }
}

/**
 * Adds a declaration to the ones behind a name
 * @param map - The names
 * @param name - The name
 * @param declared - The declaration
 */
function add(map: Map<string, Declared[]>, name: string, declared: Declared): void {
  const list = map.get(name);

  if (list) list.push(declared);
  else map.set(name, [declared]);
}

/**
 * Every name a module exports, followed to the declarations behind it
 * @param collector - The run
 * @param file - The module
 */
function exportsOf(collector: Collector, file: SourceFile): Exports {
  const cached = collector.exports.get(file.path);

  if (cached) return cached;

  const exports: Exports = new Map();
  const locals = new Map<string, Declared[]>();
  const imports = new Map<string, { source: string; name: string }>();
  const local: { exported: string; name: string }[] = [];
  const stars: SourceFile[] = [];

  collector.exports.set(file.path, exports);
  for (const statement of file.program.body) {
    const exported = statement.type === 'ExportNamedDeclaration';
    const node = asDeclaration(exported ? statement.declaration : statement);

    if (node) {
      const declared = { file, node, docAt: statement.start };

      for (const name of declaredNames(node)) {
        add(locals, name, declared);
        if (exported) add(exports as Map<string, Declared[]>, name, declared);
      }
      if (exported && node.type === 'VariableDeclaration') {
        for (const { id } of node.declarations) {
          if (id.type !== 'Identifier') exports.set(file.text.slice(id.start, id.end), []);
        }
      }
    } else if (statement.type === 'ImportDeclaration') {
      for (const specifier of statement.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          imports.set(specifier.local.name, { source: statement.source.value, name: nameOf(specifier.imported) });
        }
      }
    } else if (statement.type === 'ExportAllDeclaration') {
      const target = statement.exported ? null : resolveImport(collector, file, statement.source.value);

      if (target) stars.push(target);
      else {
        const key = statement.exported ? nameOf(statement.exported) : `* from '${statement.source.value}'`;

        exports.set(key, []);
        collector.unresolvedFrom.set(key, file.path);
      }
    } else if (statement.type === 'ExportDefaultDeclaration') {
      exports.set('default', []);
      collector.unresolvedFrom.set('default', file.path);
    } else if (exported && statement.source) {
      const target = resolveImport(collector, file, statement.source.value);

      for (const specifier of statement.specifiers) {
        const found = target && exportsOf(collector, target).get(nameOf(specifier.local));

        exports.set(nameOf(specifier.exported), found ?? []);
        if (!found?.length) collector.unresolvedFrom.set(nameOf(specifier.exported), file.path);
      }
    } else if (exported) {
      for (const specifier of statement.specifiers) {
        local.push({ exported: nameOf(specifier.exported), name: nameOf(specifier.local) });
      }
    }
  }

  for (const { exported, name } of local) {
    const imported = imports.get(name);
    const target = imported ? resolveImport(collector, file, imported.source) : null;
    const found =
      locals.get(name) ?? (imported && target ? exportsOf(collector, target).get(imported.name) : undefined);

    exports.set(exported, found ?? []);
    if (!found?.length) collector.unresolvedFrom.set(exported, file.path);
  }
  for (const target of stars) {
    for (const [name, found] of exportsOf(collector, target)) {
      if (name !== 'default' && !exports.has(name)) exports.set(name, found);
    }
  }

  return exports;
}

/**
 * The JSDoc right above a node: the closest `/**` comment that ends on the line before it or on its
 * line, skipping lint and formatter directives in between
 * @param file - The node's file
 * @param at - Where the node starts
 */
function docBefore(file: SourceFile, at: number): ApiDoc | null {
  const { comments, text } = file;
  let index = comments.findLastIndex((comment) => comment.end <= at);
  let cursor = at;

  for (; index >= 0; index--) {
    const comment = comments[index]!;
    const gap = text.slice(comment.end, cursor);

    if (gap.trim() || gap.split('\n').length > 2) return null;
    if (comment.type === 'Block' && comment.value.startsWith('*')) return parseDoc(comment.value.slice(1));
    cursor = comment.start;
  }

  return null;
}

/**
 * Whether a doc keeps its declaration out of the public API
 * @param doc - The doc
 */
function isHidden(doc: ApiDoc | null): boolean {
  return doc?.tags.some(({ tag }) => HIDDEN.has(tag)) ?? false;
}

/**
 * Source text as a reader sees it in a signature: comments removed, blank lines dropped, continuation
 * lines dedented by the indentation of the line it starts on, and a trailing `;`, `,` or `=` cut
 * @param file - The file
 * @param start - Where the text starts
 * @param end - Where it ends
 */
function signatureText(file: SourceFile, start: number, end: number): string {
  const { comments, text } = file;
  let out = '';
  let cursor = start;

  for (const comment of comments) {
    if (comment.start < start || comment.end > end) continue;
    out += text.slice(cursor, comment.start);
    cursor = comment.end;
  }
  out += text.slice(cursor, end);

  const indent = /^ */.exec(text.slice(text.lastIndexOf('\n', start - 1) + 1))![0].length;
  const lines = out
    .split('\n')
    .filter((line) => line.trim())
    .map((line, i) => (i === 0 ? line : line.replace(new RegExp(`^ {0,${indent}}`), '')).trimEnd());

  return lines
    .join('\n')
    .trim()
    .replace(/\s*[;,=]$/, '')
    .replace(/^public\s+/, '');
}

/**
 * Text of a type on one line, as a field shows it: line breaks folded to spaces, no space inside
 * brackets, and a leading `|` dropped
 * @param file - The file
 * @param annotation - The annotation, `: Type`
 */
function typeText(file: SourceFile, annotation: ESTree.TSTypeAnnotation | null | undefined): string | null {
  if (!annotation) return null;

  const { start, end } = annotation.typeAnnotation;

  return signatureText(file, start, end)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/([([]) /g, '$1')
    .replace(/,? ([)\]])/g, '$1')
    .replace(/;\s*}/g, ' }')
    .trim()
    .replace(/^\|\s*/, '');
}

/**
 * The parameters a declaration writes with a name, in order: `a`, `a?`, `a = 1` and `...a`, each with its
 * type; a destructured parameter has no name to document, so it is left out
 * @param file - The file
 * @param params - The parameters
 */
function parametersOf(file: SourceFile, params: readonly ESTree.ParamPattern[]): ApiParameter[] {
  return params.flatMap((param): ApiParameter[] => {
    const pattern = param.type === 'TSParameterProperty' ? param.parameter : param;
    const rest = pattern.type === 'RestElement' ? pattern : null;
    const defaulted = pattern.type === 'AssignmentPattern' ? pattern : null;
    const target = rest?.argument ?? defaulted?.left ?? pattern;

    if (target.type !== 'Identifier') return [];

    return [
      {
        name: target.name,
        type: typeText(file, rest ? rest.typeAnnotation : target.typeAnnotation),
        optional: defaulted !== null || !!(target as { optional?: boolean }).optional,
      },
    ];
  });
}

/**
 * What a call takes and returns
 * @param file - The file
 * @param callable - A function, a method's signature or a function type
 */
function callableOf(
  file: SourceFile,
  callable: { params: readonly ESTree.ParamPattern[]; returnType?: ESTree.TSTypeAnnotation | null },
): ApiCallable {
  return { parameters: parametersOf(file, callable.params), returns: typeText(file, callable.returnType) };
}

/** A member, and whether it is a getter or a setter, which `membersOf` merges into one member */
interface MemberPart {
  readonly member: ApiMember;
  readonly accessor: 'get' | 'set' | null;
}

/**
 * A member of a class, an interface or a type literal, or null when it isn't public
 * @param file - Its file
 * @param node - The member
 */
function memberOf(file: SourceFile, node: ESTree.ClassElement | ESTree.TSSignature): MemberPart | null {
  if (
    node.type === 'StaticBlock' ||
    ('accessibility' in node && node.accessibility && node.accessibility !== 'public')
  ) {
    return null;
  }

  const doc = docBefore(file, node.start);
  const field = (
    annotation: ESTree.TSTypeAnnotation | null | undefined,
    flags: { optional?: boolean | null; readonly?: boolean | null },
    value: string | null = null,
  ): ApiField => ({ optional: !!flags.optional, readonly: !!flags.readonly, type: typeText(file, annotation), value });
  let name: string;
  let end = node.end;
  let kind: ApiMemberKind = 'property';
  let accessor: MemberPart['accessor'] = null;
  let callable: ApiCallable | null = null;
  let shown: ApiField | null = null;

  switch (node.type) {
    case 'TSIndexSignature':
      name = signatureText(file, node.start, node.typeAnnotation.start).replace(/:$/, '');
      shown = field(node.typeAnnotation, node);
      break;
    case 'TSCallSignatureDeclaration':
    case 'TSConstructSignatureDeclaration':
      name = node.type === 'TSCallSignatureDeclaration' ? '()' : 'new()';
      kind = 'method';
      callable = callableOf(file, node);
      break;
    default: {
      const { key } = node;

      if (key.type === 'PrivateIdentifier') return null;
      if (node.computed) name = `[${file.text.slice(key.start, key.end)}]`;
      else if (key.type === 'Identifier') name = key.name;
      else name = file.text.slice(key.start, key.end).replace(/^(['"])(.*)\1$/, '$2');

      if ('kind' in node) {
        const fn = node.type === 'TSMethodSignature' ? node : node.value;

        if (node.type !== 'TSMethodSignature' && node.value.body) end = node.value.body.start;
        callable = callableOf(file, fn);
        if (node.kind === 'get' || node.kind === 'set') {
          accessor = node.kind;
          shown = { optional: false, readonly: true, type: callable.returns, value: null };
        } else kind = node.kind === 'constructor' ? 'constructor' : 'method';
      } else {
        const literal =
          node.type !== 'TSPropertySignature' && !node.typeAnnotation && node.value?.type === 'Literal'
            ? file.text.slice(node.value.start, node.value.end)
            : null;

        if (node.type !== 'TSPropertySignature' && node.value && literal === null) end = node.value.start;
        if (node.typeAnnotation?.typeAnnotation.type === 'TSFunctionType') {
          callable = callableOf(file, node.typeAnnotation.typeAnnotation);
        }
        shown = field(node.typeAnnotation, node, literal);
      }
    }
  }

  if (name.startsWith('_') || isHidden(doc)) return null;

  return {
    member: { name, kind, signature: signatureText(file, node.start, end), doc, callable, field: shown },
    accessor,
  };
}

/**
 * The public members of a class, an interface or a type literal; a getter and its setter are one
 * member, with the doc of whichever has one first, which a reader may write only when there is a setter
 * @param file - Their file
 * @param nodes - The members
 */
function membersOf(file: SourceFile, nodes: readonly (ESTree.ClassElement | ESTree.TSSignature)[]): ApiMember[] {
  const parts: MemberPart[][] = [];

  for (const node of nodes) {
    const part = memberOf(file, node);

    if (!part) continue;

    const same = parts.find(([first]) => first!.member.name === part.member.name);

    if (same) same.push(part);
    else parts.push([part]);
  }

  return parts.map((same) => {
    const [first] = same as [MemberPart, ...MemberPart[]];
    const getter = same.find(({ accessor }) => accessor === 'get')?.member;

    return {
      ...first.member,
      signature: same.map(({ member }) => member.signature).join('\n'),
      doc: same.find(({ member }) => member.doc)?.member.doc ?? null,
      callable: getter?.callable ?? first.member.callable,
      field:
        getter?.field && same.some(({ accessor }) => accessor === 'set')
          ? { ...getter.field, readonly: false }
          : (getter?.field ?? first.member.field),
    };
  });
}

/**
 * A declaration's signature: a function's head, a class or an interface without its body, a type
 * literal without its members, a variable by its type when it has one
 * @param declared - The declaration
 */
function declarationSignature(declared: Declared): string {
  const { file, node } = declared;

  switch (node.type) {
    case 'ClassDeclaration':
    case 'ClassExpression':
    case 'TSInterfaceDeclaration':
      return signatureText(file, node.start, node.body.start);
    case 'TSTypeAliasDeclaration':
      return node.typeAnnotation.type === 'TSTypeLiteral'
        ? `${signatureText(file, node.start, node.typeAnnotation.start)} = { … }`
        : signatureText(file, node.start, node.end);
    case 'VariableDeclaration': {
      const { id, init } = node.declarations[0]!;

      if (init && id.typeAnnotation) return signatureText(file, node.start, init.start);
      if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
        return signatureText(file, node.start, init.body!.start).replace(/\s*=>$/, '');
      }

      return signatureText(file, node.start, node.end);
    }
    default:
      return signatureText(file, node.start, 'body' in node && node.body ? node.body.start : node.end);
  }
}

/**
 * What a declaration declares, for the reference
 * @param node - The declaration
 */
function kindOf(node: Declaration): ApiKind {
  switch (node.type) {
    case 'ClassDeclaration':
    case 'ClassExpression':
      return 'class';
    case 'TSInterfaceDeclaration':
      return 'interface';
    case 'TSTypeAliasDeclaration':
      return 'type';
    case 'TSEnumDeclaration':
      return 'enum';
    case 'VariableDeclaration':
      return 'const';
    default:
      return 'function';
  }
}

/**
 * The 1-based line of an offset
 * @param file - The file
 * @param at - The offset
 */
function lineOf(file: SourceFile, at: number): number {
  return file.text.slice(0, at).split('\n').length;
}

/**
 * One public name with the declarations behind it: a value before a type of the same name, and the
 * overloads of a function without its implementation
 * @param name - The name
 * @param declarations - Every declaration of it
 * @param typeOnly - Whether the barrel exports it as a type
 */
function symbolOf(name: string, declarations: readonly Declared[], typeOnly: boolean): ApiSymbol {
  const overloads = declarations.filter(({ node }) => node.type === 'TSDeclareFunction');
  const shown = overloads.length > 0 ? overloads : declarations;
  const isType = (declared: Declared): boolean =>
    declared.node.type === 'TSInterfaceDeclaration' || declared.node.type === 'TSTypeAliasDeclaration';
  const primary = shown.find((declared) => !isType(declared)) ?? shown[0]!;
  const { file, node } = primary;
  const docs = [primary, ...shown].map((declared) => docBefore(declared.file, declared.docAt));
  let members: ApiMember[] = [];

  if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') members = membersOf(file, node.body.body);
  else if (node.type === 'TSInterfaceDeclaration') members = membersOf(file, node.body.body);
  else if (node.type === 'TSTypeAliasDeclaration' && node.typeAnnotation.type === 'TSTypeLiteral') {
    members = membersOf(file, node.typeAnnotation.members);
  }

  const kind = kindOf(node);
  const { callable, calls } = callOf(file, node);

  return {
    name,
    kind,
    typeOnly,
    signature: shown.map(declarationSignature).join('\n'),
    doc: docs.find((doc) => doc !== null) ?? null,
    members,
    callable,
    calls: kind === 'function' || calls,
    source: `${file.path}:${lineOf(file, node.start)}`,
  };
}

/**
 * What a call of a declaration takes and returns, and whether a const holds something to call: an arrow
 * or function expression with no type written, or a type that is a function or a literal of call
 * signatures
 * @param file - The file
 * @param node - The declaration
 */
function callOf(file: SourceFile, node: Declaration): { callable: ApiCallable | null; calls: boolean } {
  switch (node.type) {
    case 'FunctionDeclaration':
    case 'TSDeclareFunction':
      return { callable: callableOf(file, node), calls: true };
    case 'TSTypeAliasDeclaration':
      return {
        callable: node.typeAnnotation.type === 'TSFunctionType' ? callableOf(file, node.typeAnnotation) : null,
        calls: false,
      };
    case 'VariableDeclaration': {
      const { id, init } = node.declarations[0]!;
      const type = id.typeAnnotation?.typeAnnotation;

      if (type?.type === 'TSFunctionType') return { callable: callableOf(file, type), calls: true };
      if (type) {
        return {
          callable: null,
          calls: type.type === 'TSTypeLiteral' && type.members[0]?.type === 'TSCallSignatureDeclaration',
        };
      }
      if (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression') {
        return { callable: callableOf(file, init), calls: true };
      }

      return { callable: null, calls: false };
    }
    default:
      return { callable: null, calls: false };
  }
}

/**
 * The interfaces that `declare global` and `declare module` blocks of a file add to, named by their
 * namespace or module: `PixiMixins.Container`, `@pixi/react.PixiElements`
 * @param file - The file
 * @param statements - The statements to look in
 * @param scope - The names of the blocks around them
 */
function augmentsOf(file: SourceFile, statements: readonly ESTree.Node[], scope: readonly string[] = []): ApiSymbol[] {
  return statements.flatMap((statement): ApiSymbol[] => {
    if (statement.type === 'TSInterfaceDeclaration') {
      const name = [...scope, statement.id.name].join('.');
      const declared = { file, node: statement, docAt: statement.start };

      return [symbolOf(name, [declared], true)];
    }
    if (statement.type !== 'TSModuleDeclaration' || !statement.body) return [];

    const inner = statement.global
      ? scope
      : [...scope, file.text.slice(statement.id.start, statement.id.end).replace(/^(['"])(.*)\1$/, '$2')];

    return augmentsOf(file, statement.body.body, inner);
  });
}

/**
 * The public API of an entry: every name its barrel, `src/<file>.tsx` or `.ts`, exports, followed through `export
 * { a } from`, `export type { a } from`, `export *` and `export type *` to its declaration, with its
 * JSDoc and, for a class or an interface, its public members. Members tagged `@internal`, `@ignore` or
 * `@private`, private and protected members, and names (of exports or members) starting with `_` are
 * left out. An export with no declaration to follow goes in `unresolved`.
 * @param entry - The entry, from `ENTRIES` in entries.mts
 * @param root - The repo root
 */
export function collectEntry(entry: Entry, root: string): ApiEntry {
  const collector: Collector = {
    root,
    files: new Map(),
    exports: new Map(),
    paths: pathMappings(root),
    unresolvedFrom: new Map(),
  };
  const barrel = sourceFile(collector, entryFile(entry, root));
  const typeOnly = new Set<string>();
  const augments: ApiSymbol[] = [];

  for (const statement of barrel.program.body) {
    if (statement.type === 'ExportAllDeclaration' && !statement.exported) {
      const target = resolveImport(collector, barrel, statement.source.value);

      if (!target) continue;
      augments.push(...augmentsOf(target, target.program.body));
      if (statement.exportKind === 'type') for (const name of exportsOf(collector, target).keys()) typeOnly.add(name);
    } else if (statement.type === 'ExportNamedDeclaration' && !statement.declaration) {
      for (const specifier of statement.specifiers) {
        if (statement.exportKind === 'type' || specifier.exportKind === 'type')
          typeOnly.add(nameOf(specifier.exported));
      }
    }
  }

  const symbols: ApiSymbol[] = [];
  const unresolved: string[] = [];

  for (const [name, declarations] of exportsOf(collector, barrel)) {
    if (name.startsWith('_')) continue;
    if (declarations.length > 0) symbols.push(symbolOf(name, declarations, typeOnly.has(name)));
    else unresolved.push(name);
  }

  return { entry, symbols, augments, unresolved, unresolvedFrom: collector.unresolvedFrom };
}

/**
 * The API of every package entry, in the order of `ENTRIES`
 * @param root - The repo root
 */
export function collectAll(root: string): ApiEntry[] {
  return ENTRIES.map((entry) => collectEntry(entry, root));
}

/**
 * Every public name of an entry that lacks docs, as `<entry>: <name>` or `<entry>: <name>.<member>`: a
 * symbol or member with no JSDoc or an empty description, an exported symbol tagged `@internal`,
 * `@ignore` or `@private`, which the barrel must not export, and an export with no declaration to read.
 * What a vendored file declares or exports (`isVendored`) is its authors' and isn't checked.
 * @param api - The entry's API
 */
export function undocumented(api: ApiEntry): string[] {
  const prefix = `${api.entry.name}: `;
  const lacking = (doc: ApiDoc | null, constructor = false): boolean =>
    doc === null || (!doc.description && !(constructor && doc.tags.length > 0));
  const problems: string[] = [];

  const own = (symbol: ApiSymbol): boolean => !isVendored(symbol.source);

  for (const symbol of api.symbols.filter(own)) {
    const hidden = symbol.doc?.tags.find(({ tag }) => HIDDEN.has(tag));

    if (hidden) problems.push(`${prefix}${symbol.name} is exported but tagged @${hidden.tag}`);
    else if (lacking(symbol.doc)) problems.push(`${prefix}${symbol.name}`);
  }
  for (const name of api.unresolved) {
    if (!isVendored(api.unresolvedFrom.get(name) ?? '')) {
      problems.push(`${prefix}${name} is exported but can't be followed to its declaration`);
    }
  }
  for (const symbol of [...api.symbols, ...api.augments].filter(own)) {
    for (const member of symbol.members) {
      if (lacking(member.doc, member.name === 'constructor')) problems.push(`${prefix}${symbol.name}.${member.name}`);
    }
  }

  return problems;
}

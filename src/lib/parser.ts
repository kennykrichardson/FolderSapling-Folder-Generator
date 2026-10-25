export type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  children: TreeNode[];
};

type ParsedLine = {
  depth: number;
  name: string;
  explicitDirectory: boolean;
  explicitFile: boolean;
  lineNumber: number;
};

const TREE_PREFIX =
  /^((?:(?:│   )|(?:\|   )|(?:    ))*)(?:├── |└── )(.*)$/;

const CONNECTOR_ONLY = /^[\s│|]*$/;
const CODE_FENCE = /^\s*```/;
const INVALID_NAME_CHARS = /[<>:"\\|?*\u0000-\u001F]/;
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

function cleanName(raw: string, lineNumber: number): {
  name: string;
  explicitDirectory: boolean;
} {
  let name = raw.trim();

  // AI responses sometimes wrap entries in inline Markdown code ticks.
  if (name.startsWith('`') && name.endsWith('`') && name.length >= 2) {
    name = name.slice(1, -1).trim();
  }

  const explicitDirectory = /\/$/.test(name);
  name = name.replace(/\/+$/, '');

  if (!name || name === '.' || name === '..') {
    throw new Error(`Invalid entry on line ${lineNumber}: "${raw.trim()}".`);
  }

  if (
    name === '..' ||
    name.startsWith('../') ||
    name.startsWith('..\\') ||
    name.startsWith('/') ||
    /^[a-z]:[\\/]/i.test(name)
  ) {
    throw new Error(`Unsafe path on line ${lineNumber}: "${name}".`);
  }

  if (name.includes('/') || name.includes('\\')) {
    throw new Error(
      `Entry "${name}" on line ${lineNumber} contains a path. ` +
      'Use a tree structure or provide flat paths consistently.'
    );
  }

  if (INVALID_NAME_CHARS.test(name)) {
    throw new Error(`Invalid filename on line ${lineNumber}: "${name}".`);
  }

  if (name.endsWith('.') || name.endsWith(' ')) {
    throw new Error(
      `Filename "${name}" on line ${lineNumber} cannot end with a dot or space.`
    );
  }

  if (WINDOWS_RESERVED_NAME.test(name)) {
    throw new Error(
      `"${name}" on line ${lineNumber} is a reserved Windows filename.`
    );
  }

  return { name, explicitDirectory };
}

function looksLikeFileName(name: string): boolean {
  // Common extensionless files that should not accept child entries.
  const extensionlessFiles = new Set([
    'Dockerfile', 'Makefile', ' justfile', 'Procfile', 'LICENSE',
    'NOTICE', 'CHANGELOG', 'CONTRIBUTING', 'CODEOWNERS',
  ]);

  if (extensionlessFiles.has(name) || extensionlessFiles.has(name.toUpperCase())) {
    return true;
  }

  // Dotfiles such as .env and conventional names with extensions are files.
  if (/^\.[^./]+$/.test(name)) return true;
  return /\.[a-z0-9_-]{1,16}$/i.test(name);
}

function readTreeLines(input: string): ParsedLine[] {
  const rawLines = input.replace(/^\uFEFF/, '').split(/\r?\n/);
  const lines: ParsedLine[] = [];

  for (let index = 0; index < rawLines.length; index++) {
    const rawLine = rawLines[index];

    if (CODE_FENCE.test(rawLine)) continue;
    if (CONNECTOR_ONLY.test(rawLine)) continue;

    const match = rawLine.match(TREE_PREFIX);
    let depth: number;
    let rawName: string;

    if (match) {
      const prefix = match[1];

      if (prefix.length % 4 !== 0) {
        throw new Error(
          `Invalid indentation on line ${index + 1}. ` +
          'Use standard tree connectors and four-character indentation levels.'
        );
      }

      depth = prefix.length / 4 + 1;
      rawName = match[2];
    } else {
      // A non-connector line is a root. Leading whitespace is intentionally
      // ignored for root labels, since AI responses often indent code fences.
      if (/^\s*(?:├──|└──|│)/.test(rawLine)) {
        throw new Error(
          `Malformed tree connector on line ${index + 1}: "${rawLine.trim()}".`
        );
      }

      depth = 0;
      rawName = rawLine.trim();
    }

    const cleaned = cleanName(rawName, index + 1);
    lines.push({
      depth,
      name: cleaned.name,
      explicitDirectory: cleaned.explicitDirectory,
      explicitFile: !cleaned.explicitDirectory && looksLikeFileName(cleaned.name),
      lineNumber: index + 1,
    });
  }

  if (lines.length === 0) {
    throw new Error('Paste a folder structure first.');
  }

  return lines;
}

function buildTree(lines: ParsedLine[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];
  const explicitDirectoryByNode = new WeakMap<TreeNode, boolean>();

  for (const line of lines) {
    const { depth, name, explicitDirectory, explicitFile, lineNumber } = line;

    if (depth > stack.length) {
      throw new Error(
        `Invalid indentation near "${name}" on line ${lineNumber}. ` +
        'A child must be nested exactly one level beneath an existing directory.'
      );
    }

    // Truncate the stack at the current level so this item becomes a sibling
    // of the previous item at the same depth.
    stack.length = depth;

    const node: TreeNode = {
      name,
      type: explicitDirectory || !explicitFile ? 'directory' : 'file',
      children: [],
    };

    explicitDirectoryByNode.set(node, explicitDirectory);

    if (depth === 0) {
      roots.push(node);
    } else {
      const parent = stack[depth - 1];

      if (!parent) {
        throw new Error(
          `Missing parent folder for "${name}" on line ${lineNumber}.`
        );
      }

      if (parent.type !== 'directory') {
        throw new Error(
          `Cannot place "${name}" inside "${parent.name}" on line ${lineNumber}: ` +
          'the parent is marked as a file.'
        );
      }

      parent.children.push(node);
    }

    stack[depth] = node;
  }

  function finalize(nodes: TreeNode[]): void {
    const seen = new Map<string, TreeNode>();

    for (const node of nodes) {
      const previous = seen.get(node.name);

      if (previous) {
        const previousKind = previous.type;
        const currentKind = node.type;

        if (previousKind !== currentKind) {
          throw new Error(
            `"${node.name}" is listed as both a file and a directory.`
          );
        }

        throw new Error(`Duplicate entry: "${node.name}".`);
      }

      seen.set(node.name, node);

      if (node.children.length > 0) {
        node.type = 'directory';
      }

      finalize(node.children);
    }
  }

  finalize(roots);
  return roots;
}

function looksLikeFlatPaths(lines: string[]): boolean {
  const meaningful = lines
    .filter((line) => !CODE_FENCE.test(line))
    .filter((line) => !CONNECTOR_ONLY.test(line))
    .map((line) => line.trim());

  if (meaningful.length < 2) return false;
  if (meaningful.some((line) => TREE_PREFIX.test(line))) return false;

  // Flat-path mode is chosen only when at least one entry contains a nested
  // path separator. A single root directory remains ordinary tree input.
  return meaningful.some((line) => line.includes('/') || line.includes('\\'));
}

function parseFlatPaths(input: string): TreeNode[] {
  const rawLines = input.replace(/^\uFEFF/, '').split(/\r?\n/);
  const roots: TreeNode[] = [];
  const rootMap = new Map<string, TreeNode>();

  function getOrCreate(
    siblings: TreeNode[],
    name: string,
    type: 'file' | 'directory',
    fullPath: string
  ): TreeNode {
    const existing = siblings.find((item) => item.name === name);

    if (existing) {
      if (existing.type !== type && !(existing.type === 'file' && type === 'directory' && existing.children.length > 0)) {
        throw new Error(`Conflicting file/directory entry: "${fullPath}".`);
      }
      return existing;
    }

    const node: TreeNode = { name, type, children: [] };
    siblings.push(node);
    return node;
  }

  for (let index = 0; index < rawLines.length; index++) {
    const raw = rawLines[index].trim();

    if (!raw || CODE_FENCE.test(raw) || CONNECTOR_ONLY.test(raw)) continue;

    if (raw.startsWith('/') || raw.startsWith('\\') || /^[a-z]:[\\/]/i.test(raw)) {
      throw new Error(`Absolute paths are not allowed (line ${index + 1}).`);
    }

    const normalized = raw.replace(/\\/g, '/');
    const explicitDirectory = normalized.endsWith('/');
    const segments = normalized.split('/').filter(Boolean);

    if (segments.length === 0 || segments.some((segment) => segment === '.' || segment === '..')) {
      throw new Error(`Unsafe path on line ${index + 1}: "${raw}".`);
    }

    for (const segment of segments) {
      if (INVALID_NAME_CHARS.test(segment) || WINDOWS_RESERVED_NAME.test(segment) ||
          segment.endsWith('.') || segment.endsWith(' ')) {
        throw new Error(`Invalid path segment "${segment}" on line ${index + 1}.`);
      }
    }

    let siblings = roots;
    let currentPath = '';
    let currentNode: TreeNode | undefined;

    for (let partIndex = 0; partIndex < segments.length; partIndex++) {
      const segment = segments[partIndex];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      const isLast = partIndex === segments.length - 1;
      const kind = isLast && !explicitDirectory ? 'file' : 'directory';

      const existingBeforeInsert = siblings.find((item) => item.name === segment);
      if (
        isLast &&
        !explicitDirectory &&
        existingBeforeInsert?.type === 'file'
      ) {
        throw new Error(`Duplicate entry: "${currentPath}".`);
      }

      currentNode = getOrCreate(siblings, segment, kind, currentPath);

      if (isLast && explicitDirectory) currentNode.type = 'directory';
      if (!isLast && currentNode.type === 'file') {
        throw new Error(`Cannot nest "${currentPath}" because it is already a file.`);
      }

      siblings = currentNode.children;
    }
  }

  if (roots.length === 0) {
    throw new Error('Paste a folder structure first.');
  }

  // If the input includes a root directory line and paths prefixed with that
  // same directory, merge naturally into that root.
  return roots;
}

/**
 * Parse an AI-generated directory tree into a nested TreeNode structure.
 *
 * Supported formats:
 * - ASCII tree connectors: ├──, └──, │
 * - Plain root names plus connected children
 * - Flat paths, one per line (e.g. src/components/Button.tsx)
 * - Markdown code fences surrounding either format
 *
 * Files are represented as empty placeholders by the ZIP generator; this
 * function only describes the structure.
 */
export function parseStructure(input: string): TreeNode[] {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('Paste a folder structure first.');
  }

  const withoutFenceLines = input
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => !CODE_FENCE.test(line));

  if (looksLikeFlatPaths(withoutFenceLines)) {
    return parseFlatPaths(input);
  }

  return buildTree(readTreeLines(input));
}

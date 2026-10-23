
export type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  children: TreeNode[];
};

export function parseStructure(input: string): TreeNode[] {
  const lines = input
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^\s*```/.test(line));

  if (lines.length === 0) {
    throw new Error('Paste a folder structure first.');
  }

  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (const rawLine of lines) {
    const match = rawLine.match(
      /^((?:(?:│   )|(?:    ))*)(?:├── |└── )(.*)$/
    );

    const depth = match ? match[1].length / 4 + 1 : 0;
    const rawName = (match ? match[2] : rawLine.trim())
      .trim()
      .replace(/^`|`$/g, '');

    const isDirectory = rawName.endsWith('/');
    const name = rawName.replace(/\/+$/, '');

    if (!name || name === '.' || name === '..') {
      throw new Error(`Invalid entry: "${rawName}"`);
    }

    if (/[<>:"\\|?*\u0000-\u001F]/.test(name)) {
      throw new Error(`Invalid filename: "${name}"`);
    }

    if (depth > stack.length) {
      throw new Error(`Invalid indentation near "${name}".`);
    }

    const node: TreeNode = {
      name,
      type: isDirectory ? 'directory' : 'file',
      children: [],
    };

    stack.length = depth;

    if (depth === 0) {
      roots.push(node);
    } else {
      const parent = stack[depth - 1];

      if (!parent) {
        throw new Error(`Missing parent folder for "${name}".`);
      }

      parent.children.push(node);
      parent.type = 'directory';
    }

    stack[depth] = node;
  }

  function finalize(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.type = 'directory';
      }
      finalize(node.children);
    }
  }

  finalize(roots);
  return roots;
}

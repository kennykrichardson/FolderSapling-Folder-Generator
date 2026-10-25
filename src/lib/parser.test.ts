import { describe, expect, it } from 'vitest';
import { parseStructure } from './parser';

describe('parseStructure', () => {
  it('parses nested ASCII trees and ignores blank connector rows', () => {
    const result = parseStructure(`MegaProject/
├── Engineering/
│   ├── Backend/
│   │   ├── NodeJS/
│   │   │   └── API/
│   │   └── Python/
│
└── README.md`);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('MegaProject');
    expect(result[0].children[0].name).toBe('Engineering');
    expect(result[0].children[0].children[0].name).toBe('Backend');
    expect(result[0].children[0].children[0].children[0].name).toBe('NodeJS');
  });

  it('infers directories that contain children', () => {
    const result = parseStructure(`project/
├── src
│   └── main.ts`);

    expect(result[0].children[0].type).toBe('directory');
    expect(result[0].children[0].children[0].type).toBe('file');
  });

  it('preserves explicitly empty directories', () => {
    const result = parseStructure(`project/
└── empty/`);

    expect(result[0].children[0]).toMatchObject({
      name: 'empty',
      type: 'directory',
      children: [],
    });
  });

  it('supports flat paths', () => {
    const result = parseStructure(`src/main.ts
src/components/Header.tsx
README.md`);

    expect(result.find((node) => node.name === 'src')?.type).toBe('directory');
    expect(result[0].children.find((node) => node.name === 'components')?.children[0].name)
      .toBe('Header.tsx');
  });

  it('supports Markdown fences', () => {
    const result = parseStructure('```text\nproject/\n└── README.md\n```');
    expect(result[0].name).toBe('project');
  });

  it('rejects duplicate sibling names', () => {
    expect(() => parseStructure(`project/
├── src/
└── src/`)).toThrow(/Duplicate entry/);
  });

  it('rejects traversal paths', () => {
    expect(() => parseStructure('../../outside/file.txt')).toThrow(/Unsafe path/);
  });

  it('rejects invalid characters', () => {
    expect(() => parseStructure(`project/
└── bad?.txt`)).toThrow(/Invalid filename/);
  });

  it('treats extensionless folder names as directories', () => {
    const result = parseStructure(`project
├── Backend
│   └── API
│       └── routes.ts`);

    expect(result[0].children[0].type).toBe('directory');
    expect(result[0].children[0].children[0].type).toBe('directory');
  });

  it('rejects children under a file', () => {
    expect(() => parseStructure(`project
├── README.md
│   └── child.txt`)).toThrow(/marked as a file/);
  });

  it('rejects empty input', () => {
    expect(() => parseStructure('  \n \n')).toThrow(/Paste a folder structure first/);
  });
});


import JSZip from 'jszip';
import type { TreeNode } from './parser';

export async function generateZip(
  nodes: TreeNode[]
): Promise<Blob> {
  const zip = new JSZip();

  function addNodes(items: TreeNode[], parentPath = '') {
    for (const node of items) {
      const path = parentPath
        ? `${parentPath}/${node.name}`
        : node.name;

      if (node.type === 'directory') {
        zip.folder(path);
        addNodes(node.children, path);
      } else {
        zip.file(path, '');
      }
    }
  }

  addNodes(nodes);

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export async function downloadZip(
  nodes: TreeNode[]
): Promise<void> {
  const blob = await generateZip(nodes);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'sapling-project.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
